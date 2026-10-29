import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {aparece, useFrame} from "../lib/tiempo";
import {C, F} from "../theme";
import type {Escena, Manifest, Subtitulo} from "../types";
import {Logo} from "./Base";

/** Barra superior: marca y bloque del vídeo en el que estamos. */
export const Cabecera: React.FC<{escena: Escena; manifest: Manifest}> = ({escena, manifest}) => {
  const frame = useFrame();
  const o = aparece(frame, 4, 16);
  return (
    <div style={{position: "absolute", left: 40, top: 28, display: "flex", alignItems: "center", gap: 18, opacity: o,
      padding: "10px 18px 10px 10px", borderRadius: 18, background: "rgba(10,14,24,0.82)",
      border: `1px solid ${C.borde}`, boxShadow: "0 10px 30px rgba(0,0,0,.35)"}}>
      <Logo size={46} />
      <span style={{fontFamily: F.texto, fontWeight: 760, fontSize: 24, letterSpacing: 3, color: C.texto}}>ARGOS</span>
      <span style={{width: 1, height: 28, background: C.borde}} />
      <div style={{display: "flex", gap: 6}}>
        {Object.entries(manifest.bloques).map(([b, nombre]) => {
          const activo = b === escena.bloque;
          return (
            <span key={b} style={{fontFamily: F.mono, fontSize: 14, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase",
              padding: "4px 10px", borderRadius: 999, color: activo ? C.tintaAcento : C.muyTenue,
              background: activo ? C.acento : "transparent", border: `1px solid ${activo ? C.acento : "rgba(255,255,255,0.08)"}`}}>
              {nombre}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** Subtítulos quemados, sincronizados con la voz (out/subtitulos.srt tiene los mismos tiempos). */
export const Subtitulos: React.FC<{subs: Subtitulo[]}> = ({subs}) => {
  const frame = useCurrentFrame();
  const s = subs.find((x) => frame >= x.inicio && frame < x.fin + 4);
  if (!s) return null;
  const o = interpolate(frame, [s.inicio, s.inicio + 5, s.fin, s.fin + 4], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <div style={{position: "absolute", left: 0, right: 0, bottom: 52, display: "flex", justifyContent: "center", opacity: o}}>
      <div style={{maxWidth: 1480, padding: "12px 28px", borderRadius: 14, background: "rgba(5,7,13,0.86)", border: `1px solid ${C.borde}`,
        fontFamily: F.texto, fontWeight: 560, fontSize: 38, lineHeight: 1.28, color: C.texto, textAlign: "center"}}>
        {s.texto}
      </div>
    </div>
  );
};

/** Barra de progreso global, segmentada por bloques. */
export const Progreso: React.FC<{manifest: Manifest; frameGlobal: number}> = ({manifest, frameGlobal}) => {
  const segmentos: {b: string; ini: number; fin: number}[] = [];
  for (const e of manifest.escenas) {
    const ult = segmentos[segmentos.length - 1];
    if (ult && ult.b === e.bloque) ult.fin = e.inicio + e.duracion;
    else segmentos.push({b: e.bloque, ini: e.inicio, fin: e.inicio + e.duracion});
  }
  return (
    <div style={{position: "absolute", left: 48, right: 48, bottom: 20, height: 5, display: "flex", gap: 6}}>
      {segmentos.map((s) => {
        const p = Math.max(0, Math.min(1, (frameGlobal - s.ini) / (s.fin - s.ini)));
        return (
          <div key={s.b + s.ini} style={{flex: (s.fin - s.ini) / manifest.duracion, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden"}}>
            <div style={{width: `${p * 100}%`, height: "100%", background: C.acento}} />
          </div>
        );
      })}
    </div>
  );
};
