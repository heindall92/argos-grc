import React, {useMemo} from "react";
import {AbsoluteFill, Easing, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {srcClip} from "../lib/clips";
import {C, F, H, W} from "../theme";

/** Marca guardada por el grabador: dónde se hizo clic o qué zona se señaló, y cuándo. */
export type Marca = {t: number; tipo: "clic" | "foco" | "corte_ini" | "corte_fin"; caja: [number, number, number, number]; texto?: string | null; zoom?: number | null};
export type MetaToma = {clip: string; duracion: number; ancho: number; alto: number; marcas: Marca[]; rapidos?: [number, number, number][]};

type Cam = {t: number; x: number; y: number; z: number};

const suave = Easing.bezier(0.45, 0, 0.2, 1);
const ANTES = 0.45; // la cámara empieza a moverse un poco antes del clic
const MANTIENE = 2.6; // segundos que se queda encima de la zona
const MAX_Z = 1.75;

/** Calcula los puntos de cámara a partir de las marcas: acercarse a cada zona y volver a plano general si hay hueco. */
export const camaraDe = (meta: MetaToma, velocidad: number): Cam[] => {
  const cams: Cam[] = [{t: 0, x: W / 2, y: H / 2, z: 1}];
  const ms = meta.marcas.filter((m) => m.zoom !== 0);
  ms.forEach((m, i) => {
    const [x, y, w, h] = m.caja;
    const auto = Math.min((W * 0.5) / Math.max(w, 60), (H * 0.5) / Math.max(h, 40));
    const z = Math.max(1, Math.min(MAX_Z, m.zoom ?? auto));
    const t = Math.max(0, m.t / velocidad - ANTES);
    const prev = cams[cams.length - 1];
    if (t - prev.t > MANTIENE + 1.2 && prev.z > 1.01) {
      cams.push({t: prev.t + MANTIENE, x: prev.x, y: prev.y, z: prev.z});
      cams.push({t: Math.min(t, prev.t + MANTIENE + 0.9), x: W / 2, y: H / 2, z: 1});
    }
    cams.push({t: Math.max(t, prev.t + 0.5), x: x + w / 2, y: y + h / 2, z});
    if (i === ms.length - 1) {
      cams.push({t: t + MANTIENE + 0.6, x: x + w / 2, y: y + h / 2, z});
      cams.push({t: t + MANTIENE + 1.6, x: W / 2, y: H / 2, z: 1});
    }
  });
  return cams;
};

const valorEn = (cams: Cam[], t: number) => {
  let i = 0;
  while (i < cams.length - 1 && cams[i + 1].t <= t) i++;
  const a = cams[i];
  const b = cams[Math.min(i + 1, cams.length - 1)];
  if (b === a || t <= a.t) return a;
  // cada transición dura como mucho 0,9 s; el resto del tramo la cámara está quieta
  const dur = Math.min(0.9, b.t - a.t);
  const inicio = b.t - dur;
  if (t < inicio) return a;
  const k = suave(Math.min(1, (t - inicio) / dur));
  return {t, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k};
};

/** Limita el encuadre para que nunca se vea fuera de la grabación. */
const encuadre = (c: {x: number; y: number; z: number}) => {
  const mw = W / (2 * c.z);
  const mh = H / (2 * c.z);
  return {x: Math.max(mw, Math.min(W - mw, c.x)), y: Math.max(mh, Math.min(H - mh, c.y)), z: c.z};
};

/** Tramo del clip [inicio, fin, factor]: factor 1 = velocidad normal; >1 = avance rápido (tecleo, esperas). */
type Tramo = [number, number, number];
const RESTO = 1.2;

/** Tramos reproducibles: se quitan las esperas marcadas (corte_ini/corte_fin, deja RESTO s) y se aceleran los «rápidos». */
export const tramosDe = (meta: MetaToma): Tramo[] => {
  const base: Tramo[] = [];
  let ini = 0;
  const ms = meta.marcas;
  for (let i = 0; i < ms.length; i++) {
    if (ms[i].tipo !== "corte_ini") continue;
    const fin = ms.slice(i + 1).find((m) => m.tipo === "corte_fin");
    if (!fin || fin.t - ms[i].t <= RESTO * 2) continue;
    base.push([ini, ms[i].t + RESTO / 2, 1]);
    ini = fin.t - RESTO / 2;
  }
  base.push([ini, meta.duracion, 1]);
  let tramos = base;
  for (const [ra, rb, k] of meta.rapidos ?? []) {
    const sig: Tramo[] = [];
    for (const [a, b, f] of tramos) {
      const x = Math.max(a, ra);
      const y = Math.min(b, rb);
      if (y <= x) {
        sig.push([a, b, f]);
        continue;
      }
      if (x > a) sig.push([a, x, f]);
      sig.push([x, y, f * k]);
      if (b > y) sig.push([y, b, f]);
    }
    tramos = sig;
  }
  return tramos;
};
/** Segundo del clip → segundo útil (sin cortes y con los rápidos comprimidos). */
const util = (tramos: Tramo[], t: number) => {
  let acc = 0;
  for (const [a, b, k] of tramos) {
    if (t <= b) return acc + Math.max(0, t - a) / k;
    acc += (b - a) / k;
  }
  return acc;
};
export const duracionUtil = (meta: MetaToma) => tramosDe(meta).reduce((s, [a, b, k]) => s + (b - a) / k, 0);

/**
 * Una grabación real de la consola ajustada a la duración de su escena: se recortan las esperas,
 * el tecleo y las esperas largas van en avance rápido, la velocidad general se adapta (0,8×–2×)
 * y, si aún sobra escena, se congela el último fotograma.
 */
export const Toma: React.FC<{meta: MetaToma; duracion?: number; marcos?: boolean}> = ({meta, duracion, marcos = true}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const salida = (duracion ?? durationInFrames) / fps;
  const tramos = useMemo(() => tramosDe(meta), [meta]);
  const total = tramos.reduce((s, [a, b, k]) => s + (b - a) / k, 0);
  const vel = Math.max(0.8, Math.min(2, total / Math.max(1, salida - 0.4)));
  // marcas en segundos de salida (las que caen dentro de un avance rápido no llevan rótulo: pasarían volando)
  const metaSalida = useMemo<MetaToma>(() => ({
    ...meta,
    marcas: meta.marcas
      .filter((m) => m.tipo === "clic" || m.tipo === "foco")
      .filter((m) => !tramos.some(([a, b, k]) => k > 1.5 && m.t > a + 0.3 && m.t < b - 0.3))
      .map((m) => ({...m, t: util(tramos, m.t) / vel})),
  }), [meta, tramos, vel]);
  const cams = useMemo(() => camaraDe(metaSalida, 1), [metaSalida]);
  const t = frame / fps;
  const c = encuadre(valorEn(cams, t));
  const tx = W / 2 - c.x * c.z;
  const ty = H / 2 - c.y * c.z;
  let acc = 0;
  const piezas = tramos.map(([a, b, k], i) => {
    const desde = Math.round((acc / vel) * fps);
    acc += (b - a) / k;
    const hasta = Math.round((acc / vel) * fps);
    return {i, a, k, desde, dur: Math.max(1, hasta - desde)};
  });
  const ultima = piezas[piezas.length - 1];
  const finVideo = ultima.desde + ultima.dur;
  const src = srcClip(meta.clip);

  return (
    <AbsoluteFill style={{background: C.fondo, overflow: "hidden"}}>
      <div style={{position: "absolute", width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${c.z})`}}>
        {piezas.map((pz) => (
          <Sequence key={pz.i} from={pz.desde} durationInFrames={pz.dur} layout="none">
            <OffthreadVideo src={src} playbackRate={vel * pz.k} startFrom={Math.round(pz.a * fps)} muted style={{position: "absolute", width: W, height: H}} />
          </Sequence>
        ))}
        {frame >= finVideo && (
          <Freeze frame={ultima.dur - 1}>
            <OffthreadVideo src={src} playbackRate={vel * ultima.k} startFrom={Math.round(ultima.a * fps)} muted style={{position: "absolute", width: W, height: H}} />
          </Freeze>
        )}
        {marcos && metaSalida.marcas.map((m, i) => <Recuadro key={i} m={m} t={t} z={c.z} />)}
      </div>
      {piezas.some((pz) => pz.k > 1.5 && frame >= pz.desde && frame < pz.desde + pz.dur) && (
        <div style={{position: "absolute", right: 48, bottom: 120, fontFamily: F.mono, fontSize: 20, letterSpacing: 2, color: C.texto,
          background: "rgba(5,7,13,.78)", padding: "6px 14px", borderRadius: 8}}>
          {`▶▶ ${Math.round(vel * Math.max(...piezas.filter((pz) => frame >= pz.desde && frame < pz.desde + pz.dur).map((pz) => pz.k)))}×`}
        </div>
      )}
    </AbsoluteFill>
  );
};

const Recuadro: React.FC<{m: Marca; t: number; z: number}> = ({m, t, z}) => {
  if (!m.texto) return null;
  const o = interpolate(t, [m.t - 0.1, m.t + 0.25, m.t + MANTIENE, m.t + MANTIENE + 0.4], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  if (o <= 0) return null;
  const [x, y, w, h] = m.caja;
  const pad = 6;
  const abajo = y + h + 54 < H;
  return (
    <div style={{opacity: o}}>
      <div style={{position: "absolute", left: x - pad, top: y - pad, width: w + pad * 2, height: h + pad * 2, borderRadius: 8,
        border: `${2 / z + 0.6}px solid ${C.acentoVivo}`, boxShadow: `0 0 ${18 / z}px rgba(63,208,214,.5)`}} />
      <div style={{position: "absolute", left: x - pad, top: abajo ? y + h + pad + 8 : y - pad - 8,
        transform: `${abajo ? "" : "translateY(-100%)"} scale(${1 / z})`, transformOrigin: abajo ? "0 0" : "0 100%",
        background: C.acento, color: C.tintaAcento, fontFamily: F.mono, fontWeight: 700, fontSize: 22, padding: "6px 14px",
        borderRadius: 7, whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(0,0,0,.45)"}}>{m.texto}</div>
    </div>
  );
};
