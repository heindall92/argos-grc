import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile} from "remotion";
import {useFrame} from "../lib/tiempo";
import {C, F, IRI} from "../theme";

const suaveSalida = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Fondo de las diapositivas: casi negro frío con dos luces difusas que se desplazan muy despacio.
 * Sin rejillas, sin anillos y sin patrones (los anillos son la firma de Rosetta).
 */
export const Fondo: React.FC = () => {
  const t = useFrame() / 30;
  const luz = (x: number, y: number, r: number, color: string) => `radial-gradient(circle at ${x}% ${y}%, ${color} 0%, rgba(0,0,0,0) ${r}%)`;
  return (
    <AbsoluteFill
      style={{
        background: [
          luz(14 + 5 * Math.sin(t / 11), 18 + 4 * Math.cos(t / 13), 42, "rgba(63,208,214,0.10)"),
          luz(88 + 4 * Math.cos(t / 12), 86 + 5 * Math.sin(t / 10), 46, "rgba(47,107,255,0.10)"),
          luz(70 + 6 * Math.sin(t / 15), 6, 30, "rgba(139,92,246,0.06)"),
          `linear-gradient(170deg, ${C.fondo2} 0%, ${C.fondo} 60%)`,
        ].join(", "),
      }}
    >
      <AbsoluteFill style={{boxShadow: "inset 0 0 260px rgba(0,0,0,0.65)"}} />
    </AbsoluteFill>
  );
};

/** Línea iridiscente de la marca ARGOS. */
export const Linea: React.FC<{ancho?: number; style?: React.CSSProperties}> = ({ancho = 160, style}) => (
  <div style={{width: ancho, height: 6, borderRadius: 3, background: IRI, ...style}} />
);

/** El ojo de ARGOS (logo de la app, app/src/ui/01-icons.js). */
export const Logo: React.FC<{size?: number; style?: React.CSSProperties}> = ({size = 64, style}) => (
  <Img src={staticFile("logo.svg")} style={{width: size, height: size, ...style}} />
);

export const Panel: React.FC<{style?: React.CSSProperties; children?: React.ReactNode; acento?: string}> = ({style, children, acento}) => (
  <div
    style={{
      background: `linear-gradient(160deg, ${C.panel2} 0%, ${C.panel} 100%)`,
      border: `1px solid ${acento ?? C.borde}`,
      borderRadius: 24,
      boxShadow: "0 30px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Antetítulo en monoespaciada, como la cabecera de página de la app. */
export const Kicker: React.FC<{texto: string; desde?: number}> = ({texto, desde = 0}) => {
  const frame = useFrame();
  const o = interpolate(frame - desde, [0, 12], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <div style={{display: "flex", alignItems: "center", gap: 16, fontFamily: F.mono, fontSize: 24, fontWeight: 600, letterSpacing: 5,
      textTransform: "uppercase", color: C.acento, marginBottom: 20, opacity: o}}>
      <Linea ancho={44 * o} style={{height: 3}} />
      {texto}
    </div>
  );
};

/** Antetítulo + titular grande que se revela palabra a palabra (desenfoque + subida, sin rebote). */
export const Titular: React.FC<{kicker?: string; texto: string; desde?: number; tam?: number; ancho?: number}> = ({
  kicker, texto, desde = 0, tam = 80, ancho = 1560,
}) => {
  const frame = useFrame();
  return (
    <div style={{maxWidth: ancho}}>
      {kicker ? <Kicker texto={kicker} desde={desde} /> : null}
      <div style={{fontFamily: F.texto, fontWeight: 700, fontSize: tam, lineHeight: 1.06, color: C.texto, letterSpacing: `${-0.022 * tam}px`}}>
        {texto.split(" ").map((p, i) => {
          const t = frame - desde - 6 - i * 2.5;
          const o = interpolate(t, [0, 10], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
          const y = interpolate(t, [0, 14], [18, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suaveSalida});
          return (
            <span key={i} style={{display: "inline-block", opacity: o, transform: `translateY(${y}px)`, filter: `blur(${(1 - o) * 6}px)`, marginRight: tam * 0.24}}>
              {p}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Entrada con muelle críticamente amortiguado (sin rebote): el panel se materializa con
 * desenfoque, subida y escala de 0,97 a 1, a la vez. `desde` en fotogramas de 30 fps de la escena.
 */
export const useEntrada = (desde: number) => {
  const frame = useFrame();
  const s = spring({frame: frame - desde, fps: 30, config: {damping: 200, stiffness: 140, mass: 0.9}});
  return {opacity: Math.min(1, s * 1.3), transform: `translateY(${(1 - s) * 28}px) scale(${0.97 + 0.03 * s})`, filter: `blur(${(1 - s) * 10}px)`};
};

/** Marco común de las diapositivas: deja sitio a la cabecera arriba y a los subtítulos abajo. */
export const Marco: React.FC<{children: React.ReactNode; centro?: boolean; gap?: number}> = ({children, centro, gap = 52}) => (
  <div style={{position: "absolute", inset: "150px 130px 190px 130px", display: "flex", flexDirection: "column",
    justifyContent: centro ? "center" : "flex-start", gap}}>{children}</div>
);
