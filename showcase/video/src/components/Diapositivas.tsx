import React from "react";
import {AbsoluteFill, Img, interpolate, staticFile} from "remotion";
import {
  ArrowRight, BookOpen, Check, CircleSlash, ClipboardCheck, Database, FileCode2, FlaskConical, Globe, Languages, Lightbulb, Lock,
  Network, Radar, Scale, ShieldCheck, Star, Terminal, Timer,
} from "lucide-react";
import {aparece, fotogramaDe, useFrame} from "../lib/tiempo";
import {C, F} from "../theme";
import type {Escena} from "../types";
import {Kicker, Linea, Logo, Marco, Panel, Titular, useEntrada} from "./Base";

type P = {escena: Escena};
type Icono = React.FC<{size?: number; color?: string; strokeWidth?: number}>;
const v = (e: Escena) => e.visual;
const ICONOS: Record<string, Icono> = {
  terminal: Terminal, scale: Scale, lock: Lock, flask: FlaskConical, globe: Globe, lightbulb: Lightbulb,
  file: FileCode2, shield: ShieldCheck, database: Database,
};
const COLORES: Record<string, string> = {ens: C.ens, iso: C.iso, cont: C.cont, acento: C.acento};

const Caja: React.FC<{I: Icono; color?: string; tam?: number}> = ({I, color = C.acento, tam = 72}) => (
  <div style={{width: tam, height: tam, borderRadius: tam * 0.26, display: "grid", placeItems: "center", flexShrink: 0,
    background: `color-mix(in srgb, ${color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 32%, transparent)`}}>
    <I size={tam * 0.5} color={color} strokeWidth={1.9} />
  </div>
);

// ─────────────── portada ───────────────
export const Portada: React.FC<P> = ({escena}) => {
  const frame = useFrame();
  const a = aparece(frame, 6, 30);
  const b = aparece(frame, 22, 26);
  const f1 = fotogramaDe(escena, 1);
  const f2 = fotogramaDe(escena, 2);
  const chips = ["Gratis", "Código abierto", "En español", "En tu navegador"];
  return (
    <AbsoluteFill style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
      <div style={{display: "flex", alignItems: "center", gap: 90, marginTop: -40}}>
        <Logo size={300} style={{opacity: a, transform: `scale(${0.94 + 0.06 * a})`, filter: `blur(${(1 - a) * 12}px) drop-shadow(0 30px 80px rgba(47,107,255,.25))`}} />
        <div style={{display: "flex", flexDirection: "column", gap: 26}}>
          <div style={{opacity: b, transform: `translateY(${(1 - b) * 20}px)`, fontFamily: F.texto, fontWeight: 780, fontSize: 210, letterSpacing: 10,
            lineHeight: 0.9, color: C.texto}}>ARGOS</div>
          <Linea ancho={220 * b} />
          <div style={{opacity: b, fontFamily: F.texto, fontSize: 46, color: C.texto2}}>Laboratorio de práctica GRC</div>
          <div style={{display: "flex", gap: 12, marginTop: 6}}>
            {chips.map((c, i) => {
              const o = aparece(frame, f1 + i * 5, 14);
              return (
                <span key={c} style={{opacity: o, transform: `translateY(${(1 - o) * 10}px)`, fontFamily: F.mono, fontSize: 22, fontWeight: 600,
                  padding: "8px 18px", borderRadius: 999, color: C.acento, background: C.acentoSuave, border: `1px solid ${C.bordeFuerte}`}}>{c}</span>
              );
            })}
          </div>
          <div style={{opacity: aparece(frame, f2, 22), fontFamily: F.texto, fontWeight: 650, fontSize: 40, color: C.texto, marginTop: 14}}>
            Practicar GRC como se practica el hacking.
          </div>
        </div>
      </div>
      <div style={{position: "absolute", left: 0, right: 0, bottom: 130, textAlign: "center", opacity: aparece(frame, 30, 24),
        fontFamily: F.mono, fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: C.tenue}}>
        Yoandy Ramírez Delgado · NicaHackFest 2026
      </div>
    </AbsoluteFill>
  );
};

// ─────────────── tarjetas ───────────────
export const Tarjetas: React.FC<P> = ({escena}) => {
  const vis = v(escena);
  const ts = vis.tarjetas as {icono: string; titulo: string; texto: string; en: number}[];
  return (
    <Marco centro>
      <Titular kicker={vis.kicker} texto={vis.titular} tam={74} />
      <div style={{display: "grid", gridTemplateColumns: `repeat(${ts.length}, 1fr)`, gap: 30}}>
        {ts.map((t) => <Tarjeta key={t.titulo} t={t} desde={fotogramaDe(escena, t.en)} />)}
      </div>
    </Marco>
  );
};
const Tarjeta: React.FC<{t: {icono: string; titulo: string; texto: string}; desde: number}> = ({t, desde}) => {
  const st = useEntrada(desde);
  return (
    <Panel style={{...st, padding: "40px 38px", display: "flex", flexDirection: "column", gap: 24, minHeight: 330}}>
      <Caja I={ICONOS[t.icono] ?? Check} />
      <div style={{fontFamily: F.texto, fontWeight: 700, fontSize: 42, color: C.texto, letterSpacing: -0.6}}>{t.titulo}</div>
      <div style={{fontFamily: F.texto, fontSize: 30, lineHeight: 1.4, color: C.tenue}}>{t.texto}</div>
    </Panel>
  );
};

// ─────────────── comparación ───────────────
type Lado = {titulo: string; items: string[]; en: number; bien?: boolean; color?: string};
export const Comparacion: React.FC<P> = ({escena}) => {
  const vis = v(escena);
  const iz = vis.izquierda as Lado;
  const de = vis.derecha as Lado;
  return (
    <Marco centro gap={46}>
      <Titular kicker={vis.kicker} texto={vis.titular} tam={70} />
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34}}>
        <Columna lado={iz} escena={escena} color={iz.color ? COLORES[iz.color] : C.muyTenue} destacado={!!iz.bien} />
        <Columna lado={de} escena={escena} color={de.color ? COLORES[de.color] : C.acento} destacado />
      </div>
    </Marco>
  );
};
const Columna: React.FC<{lado: Lado; escena: Escena; color: string; destacado: boolean}> = ({lado, escena, color, destacado}) => {
  const frame = useFrame();
  const desde = fotogramaDe(escena, lado.en);
  const st = useEntrada(desde);
  const I = destacado ? Check : BookOpen;
  return (
    <Panel acento={destacado ? `color-mix(in srgb, ${color} 45%, transparent)` : undefined} style={{...st, padding: "36px 40px"}}>
      <div style={{fontFamily: F.mono, fontSize: 24, fontWeight: 650, letterSpacing: 2.5, textTransform: "uppercase", color, marginBottom: 26}}>{lado.titulo}</div>
      <div style={{display: "flex", flexDirection: "column", gap: 22}}>
        {lado.items.map((it, i) => {
          const o = aparece(frame, desde + 8 + i * 9, 14);
          return (
            <div key={it} style={{display: "flex", gap: 18, alignItems: "flex-start", opacity: o, transform: `translateX(${(1 - o) * 16}px)`}}>
              <div style={{marginTop: 4}}><I size={30} color={color} strokeWidth={2.2} /></div>
              <span style={{fontFamily: F.texto, fontSize: 33, lineHeight: 1.32, color: destacado ? C.texto : C.texto2}}>{it}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

// ─────────────── mapa hacking → ARGOS ───────────────
export const Mapa: React.FC<P> = ({escena}) => {
  const vis = v(escena);
  const filas = vis.filas as {de: string; a: string; en: number}[];
  const frame = useFrame();
  const cab = aparece(frame, fotogramaDe(escena, filas[0].en) - 6, 14);
  return (
    <Marco centro gap={40}>
      <Titular kicker={vis.kicker} texto={vis.titular} tam={70} />
      <div style={{display: "flex", flexDirection: "column", gap: 16}}>
        <div style={{display: "grid", gridTemplateColumns: "420px 90px 1fr", fontFamily: F.mono, fontSize: 20, letterSpacing: 3, textTransform: "uppercase",
          color: C.muyTenue, opacity: cab, paddingLeft: 6}}>
          <span>En el hacking</span><span /><span>En ARGOS</span>
        </div>
        {filas.map((f) => <FilaMapa key={f.de} f={f} desde={fotogramaDe(escena, f.en)} />)}
      </div>
    </Marco>
  );
};
const FilaMapa: React.FC<{f: {de: string; a: string}; desde: number}> = ({f, desde}) => {
  const st = useEntrada(desde);
  return (
    <div style={{...st, display: "grid", gridTemplateColumns: "420px 90px 1fr", alignItems: "center"}}>
      <div style={{fontFamily: F.mono, fontSize: 30, fontWeight: 600, color: C.cont, padding: "18px 26px", borderRadius: 16,
        background: "rgba(95,220,140,0.08)", border: "1px solid rgba(95,220,140,0.28)"}}>{f.de}</div>
      <div style={{display: "grid", placeItems: "center"}}><ArrowRight size={36} color={C.muyTenue} /></div>
      <Panel style={{padding: "18px 28px", fontFamily: F.texto, fontSize: 32, fontWeight: 560, color: C.texto, borderRadius: 16}}>{f.a}</Panel>
    </div>
  );
};

// ─────────────── cifras ───────────────
export const Cifras: React.FC<P> = ({escena}) => {
  const vis = v(escena);
  const cs = vis.cifras as {valor: number; etiqueta: string; detalle: string; en: number}[];
  return (
    <Marco centro>
      <Titular kicker={vis.kicker} texto={vis.titular} tam={78} />
      <div style={{display: "grid", gridTemplateColumns: `repeat(${cs.length}, 1fr)`, gap: 26}}>
        {cs.map((c) => <Cifra key={c.etiqueta} c={c} desde={fotogramaDe(escena, c.en)} />)}
      </div>
    </Marco>
  );
};
const Cifra: React.FC<{c: {valor: number; etiqueta: string; detalle: string}; desde: number}> = ({c, desde}) => {
  const frame = useFrame();
  const st = useEntrada(desde);
  const k = interpolate(frame, [desde, desde + 26], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - Math.pow(1 - x, 3)});
  const cero = c.valor === 0;
  return (
    <Panel acento={cero ? C.bordeFuerte : undefined} style={{...st, padding: "38px 34px", display: "flex", flexDirection: "column", gap: 10, minHeight: 300}}>
      <div style={{fontFamily: F.texto, fontWeight: 760, fontSize: 132, lineHeight: 1, letterSpacing: -4, fontVariantNumeric: "tabular-nums",
        color: cero ? C.acento : C.texto}}>{Math.round(c.valor * k)}</div>
      <div style={{fontFamily: F.texto, fontWeight: 650, fontSize: 36, color: C.texto, marginTop: 8}}>{c.etiqueta}</div>
      <div style={{fontFamily: F.texto, fontSize: 27, lineHeight: 1.35, color: C.tenue}}>{c.detalle}</div>
    </Panel>
  );
};

// ─────────────── agenda ───────────────
export const Agenda: React.FC<P> = ({escena}) => {
  const vis = v(escena);
  const items = vis.items as {texto: string; en: number}[];
  return (
    <Marco centro gap={44}>
      <Titular kicker={vis.kicker} texto={vis.titular} tam={82} />
      <div style={{display: "flex", flexDirection: "column", gap: 18}}>
        {items.map((it, i) => <PuntoAgenda key={it.texto} n={i + 1} texto={it.texto} desde={fotogramaDe(escena, it.en)} />)}
      </div>
    </Marco>
  );
};
const PuntoAgenda: React.FC<{n: number; texto: string; desde: number}> = ({n, texto, desde}) => {
  const st = useEntrada(desde);
  const [titulo, resto] = texto.split(": ");
  return (
    <Panel style={{...st, display: "flex", alignItems: "center", gap: 34, padding: "24px 36px", maxWidth: 1400}}>
      <span style={{fontFamily: F.mono, fontSize: 34, fontWeight: 700, color: C.acento, fontVariantNumeric: "tabular-nums"}}>{String(n).padStart(2, "0")}</span>
      <span style={{fontFamily: F.texto, fontSize: 38, color: C.texto}}>
        <b style={{fontWeight: 720}}>{titulo}</b>{resto ? <span style={{color: C.tenue}}>{": " + resto}</span> : null}
      </span>
    </Panel>
  );
};

// ─────────────── lista (límites) ───────────────
export const Lista: React.FC<P> = ({escena}) => {
  const vis = v(escena);
  const items = vis.items as {texto: string; en: number}[];
  return (
    <Marco centro gap={44}>
      <Titular kicker={vis.kicker} texto={vis.titular} tam={82} />
      <div style={{display: "flex", flexDirection: "column", gap: 18}}>
        {items.map((it) => <PuntoLista key={it.texto} texto={it.texto} desde={fotogramaDe(escena, it.en)} />)}
      </div>
    </Marco>
  );
};
const PuntoLista: React.FC<{texto: string; desde: number}> = ({texto, desde}) => {
  const st = useEntrada(desde);
  return (
    <Panel style={{...st, display: "flex", alignItems: "center", gap: 28, padding: "22px 34px", maxWidth: 1450}}>
      <Caja I={CircleSlash} color={C.ambar} tam={58} />
      <span style={{fontFamily: F.texto, fontSize: 36, color: C.texto}}>{texto}</span>
    </Panel>
  );
};

// ─────────────── ecosistema ───────────────
const ICONO_HERRAMIENTA: Record<string, Icono> = {
  "CTEM-Nexus": Radar, "Rosetta Multinorma": Languages, KAIROS: Timer, "ENS AD Auditor": Network, "Compliance Studio": ClipboardCheck,
};
export const Ecosistema: React.FC<P> = ({escena}) => {
  const vis = v(escena);
  const hs = vis.herramientas as {nombre: string; texto: string; yo?: boolean; en: number}[];
  return (
    <Marco centro gap={44}>
      <Titular kicker={vis.kicker} texto={vis.titular} tam={78} />
      <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24}}>
        {hs.map((h) => <Herramienta key={h.nombre} h={h} desde={fotogramaDe(escena, h.en)} />)}
      </div>
    </Marco>
  );
};
const Herramienta: React.FC<{h: {nombre: string; texto: string; yo?: boolean}; desde: number}> = ({h, desde}) => {
  const st = useEntrada(desde);
  const I = ICONO_HERRAMIENTA[h.nombre];
  return (
    <Panel acento={h.yo ? C.bordeFuerte : undefined} style={{...st, padding: "30px 32px", display: "flex", gap: 24, alignItems: "flex-start", minHeight: 190,
      background: h.yo ? `linear-gradient(160deg, rgba(63,208,214,0.12) 0%, ${C.panel} 70%)` : undefined}}>
      {h.yo ? <Logo size={68} /> : <Caja I={I ?? Check} tam={68} color={C.texto2} />}
      <div style={{display: "flex", flexDirection: "column", gap: 10}}>
        <div style={{fontFamily: F.texto, fontWeight: 720, fontSize: 36, color: C.texto}}>{h.nombre}</div>
        <div style={{fontFamily: F.texto, fontSize: 27, lineHeight: 1.35, color: C.tenue}}>{h.texto}</div>
      </div>
    </Panel>
  );
};

// ─────────────── cierre ───────────────
export const Cierre: React.FC<P> = ({escena}) => {
  const frame = useFrame();
  const f1 = fotogramaDe(escena, 1);
  const f2 = fotogramaDe(escena, 2);
  const qr = useEntrada(8);
  return (
    <AbsoluteFill style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
      <div style={{display: "flex", alignItems: "center", gap: 110, marginTop: -30}}>
        <div style={{display: "flex", flexDirection: "column", gap: 30, maxWidth: 1000}}>
          <div style={{display: "flex", alignItems: "center", gap: 28, opacity: aparece(frame, 0, 22)}}>
            <Logo size={120} />
            <span style={{fontFamily: F.texto, fontWeight: 780, fontSize: 120, letterSpacing: 6, color: C.texto}}>ARGOS</span>
          </div>
          <Linea ancho={200} style={{opacity: aparece(frame, 6, 20)}} />
          <div style={{opacity: aparece(frame, 10, 22), fontFamily: F.mono, fontSize: 40, fontWeight: 600, color: C.acento}}>heindall92.github.io/argos-grc</div>
          <div style={{opacity: aparece(frame, f1, 22), display: "flex", flexDirection: "column", gap: 16, fontFamily: F.texto, fontSize: 34, color: C.texto2}}>
            <span style={{display: "flex", alignItems: "center", gap: 16}}><Star size={34} color={C.ambar} />Una estrella o un issue en GitHub</span>
            <span style={{fontFamily: F.mono, fontSize: 28, color: C.tenue}}>github.com/heindall92/argos-grc</span>
          </div>
          <div style={{opacity: aparece(frame, f2, 22), fontFamily: F.texto, fontWeight: 700, fontSize: 56, color: C.texto, marginTop: 18}}>
            Gracias. Nos vemos en el siguiente caso.
          </div>
          <Kicker texto="NicaHackFest 2026 · NicaSecurity" desde={f2 + 10} />
        </div>
        <Panel style={{...qr, padding: 26, borderRadius: 30, background: "#ffffff", border: "none"}}>
          <Img src={staticFile("qr-argos.svg")} style={{width: 380, height: 380, display: "block", imageRendering: "pixelated"}} />
          <div style={{fontFamily: F.mono, fontSize: 22, fontWeight: 600, color: "#0b1220", textAlign: "center", marginTop: 14}}>Abrir ARGOS</div>
        </Panel>
      </div>
    </AbsoluteFill>
  );
};

export const SinVisual: React.FC<P> = ({escena}) => (
  <Marco centro>
    <Titular kicker={escena.bloque} texto={escena.titulo} />
  </Marco>
);

export const DIAPOSITIVAS: Record<string, React.FC<P>> = {
  portada: Portada, tarjetas: Tarjetas, comparacion: Comparacion, mapa: Mapa, cifras: Cifras, agenda: Agenda, lista: Lista,
  ecosistema: Ecosistema, cierre: Cierre,
};
