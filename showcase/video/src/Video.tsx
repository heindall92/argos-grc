import React from "react";
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {Smartphone} from "lucide-react";
import {Fondo, Panel} from "./components/Base";
import {DIAPOSITIVAS, SinVisual} from "./components/Diapositivas";
import {Cabecera, Progreso, Subtitulos} from "./components/Overlay";
import {Toma, type MetaToma} from "./components/Toma";
import {srcClip} from "./lib/clips";
import {aparece, fotogramaDe, K, useFrame} from "./lib/tiempo";
import {C, F} from "./theme";
import type {Escena, Manifest} from "./types";

const FUNDIDO = Math.round(10 * K); // fundido de 1/3 s entre escenas

/** Etiqueta discreta que dice de dónde sale la imagen. */
const Origen: React.FC<{texto: string}> = ({texto}) => {
  const frame = useFrame();
  return (
    <div style={{position: "absolute", right: 48, top: 40, display: "flex", gap: 10, alignItems: "center", fontFamily: F.mono, fontSize: 15,
      fontWeight: 600, letterSpacing: 1.5, color: C.texto2, textTransform: "uppercase", opacity: aparece(frame, 15, 20),
      background: "rgba(5,7,13,.82)", border: `1px solid ${C.borde}`, padding: "8px 14px", borderRadius: 10}}>
      <span style={{width: 9, height: 9, borderRadius: "50%", background: C.ens, boxShadow: `0 0 10px ${C.ens}`}} />{texto}
    </div>
  );
};

/** Titular sobre la grabación: entra arriba, se queda unos segundos y sale. */
const RotuloToma: React.FC<{titulo: string}> = ({titulo}) => {
  const frame = useFrame();
  const o = interpolate(frame, [6, 20, 100, 118], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <div style={{position: "absolute", left: 0, right: 0, top: 130, display: "flex", justifyContent: "center", opacity: o,
      transform: `translateY(${(1 - o) * -14}px) scale(${0.97 + 0.03 * o})`}}>
      <div style={{fontFamily: F.texto, fontWeight: 720, fontSize: 60, letterSpacing: -1, color: C.texto, padding: "12px 36px", borderRadius: 18,
        background: "rgba(10,14,24,.9)", border: `1px solid ${C.bordeFuerte}`, boxShadow: "0 24px 70px rgba(0,0,0,.6)"}}>{titulo}</div>
    </div>
  );
};

/** La toma del móvil, dentro de un teléfono, con los puntos que se van diciendo al lado. */
const TomaMovil: React.FC<{escena: Escena; meta: MetaToma}> = ({escena, meta}) => {
  const frame = useFrame();
  const {fps} = useVideoConfig();
  const puntos = (escena.visual.puntos ?? []) as {en: number; texto: string}[];
  const alto = 770;
  const ancho = Math.round((alto * meta.ancho) / meta.alto);
  const vel = Math.max(0.8, Math.min(1.5, meta.duracion / Math.max(1, escena.duracion / fps - 0.5)));
  const a = aparece(frame, 0, 20);
  return (
    <AbsoluteFill>
      <Fondo />
      <div style={{position: "absolute", left: 330, top: 118, width: ancho + 28, height: alto + 28, borderRadius: 58, padding: 14,
        background: "#0b0f17", border: "2px solid #1d2433", boxShadow: "0 40px 120px rgba(0,0,0,.7), 0 0 0 1px rgba(63,208,214,.18)",
        opacity: a, transform: `translateY(${(1 - a) * 30}px) scale(${0.97 + 0.03 * a})`}}>
        <div style={{width: ancho, height: alto, borderRadius: 46, overflow: "hidden", background: "#000"}}>
          <OffthreadVideo src={srcClip(meta.clip)} playbackRate={vel} muted style={{width: ancho, height: alto}} />
        </div>
      </div>
      <div style={{position: "absolute", left: 470 + ancho, right: 140, top: 300, display: "flex", flexDirection: "column", gap: 22}}>
        <div style={{display: "flex", alignItems: "center", gap: 16, fontFamily: F.mono, fontSize: 24, fontWeight: 600, letterSpacing: 5,
          textTransform: "uppercase", color: C.acento, opacity: a}}><Smartphone size={30} color={C.acento} />390 × 844</div>
        {puntos.map((p) => {
          const o = aparece(frame, fotogramaDe(escena, p.en), 16);
          return (
            <Panel key={p.texto} style={{opacity: o, transform: `translateX(${(1 - o) * 40}px)`, filter: `blur(${(1 - o) * 8}px)`, padding: "22px 30px",
              fontFamily: F.texto, fontWeight: 600, fontSize: 36, color: C.texto}}>{p.texto}</Panel>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const EscenaVisual: React.FC<{escena: Escena; tomas: Record<string, MetaToma>}> = ({escena, tomas}) => {
  const vis = escena.visual;
  if (vis.tipo === "toma" && tomas[vis.clip]) {
    const meta = tomas[vis.clip];
    if (meta.ancho < 800) return <TomaMovil escena={escena} meta={meta} />;
    const terminal = vis.origen === "terminal";
    return (
      <>
        <Toma meta={meta} duracion={escena.duracion} />
        <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(5,7,13,.72) 0%, transparent 14%, transparent 78%, rgba(5,7,13,.78) 100%)"}} />
        {vis.rotulo ? <RotuloToma titulo={vis.rotulo} /> : null}
        <Origen texto={terminal ? "Terminal real · salida sin editar" : "Grabación real · ARGOS 1.4.0"} />
      </>
    );
  }
  const D = DIAPOSITIVAS[vis.tipo] ?? SinVisual;
  return (
    <>
      <Fondo />
      <D escena={escena} />
    </>
  );
};

export const Video: React.FC<{manifest: Manifest; tomas: Record<string, MetaToma>; subtitulos: boolean}> = ({manifest, tomas, subtitulos}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.fondo}}>
      {manifest.escenas.map((e) => (
        <Sequence key={e.id} from={e.inicio} durationInFrames={e.duracion + FUNDIDO} name={e.id}>
          <Fundido duracion={e.duracion}>
            <EscenaVisual escena={e} tomas={tomas} />
            {e.visual.tipo !== "portada" && e.visual.tipo !== "cierre" ? <Cabecera escena={e} manifest={manifest} /> : null}
            {subtitulos ? <Subtitulos subs={e.subtitulos} /> : null}
          </Fundido>
        </Sequence>
      ))}
      <Progreso manifest={manifest} frameGlobal={frame} />
      <Audio src={staticFile(manifest.audio)} />
    </AbsoluteFill>
  );
};

const Fundido: React.FC<{duracion: number; children: React.ReactNode}> = ({duracion, children}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, FUNDIDO, duracion, duracion + FUNDIDO], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};
