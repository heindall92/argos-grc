import {Easing, interpolate, useCurrentFrame} from "remotion";
import manifest from "../generated/manifest.json";
import type {Escena} from "../types";

/**
 * Convierte un índice de frase («en») en fotograma relativo a la escena.
 * en = 2 → empieza la frase 2; en = 2.5 → mitad de la frase 2. Así las animaciones
 * siguen a la voz aunque cambie su duración (otra voz, otra velocidad, otra grabación).
 */
/**
 * Las animaciones están escritas en «fotogramas de 30 fps». Con el vídeo a 60 fps, useFrame() y
 * fotogramaDe() devuelven esa misma escala, así que todo dura lo mismo y solo gana suavidad.
 */
export const K = ((manifest as {fps?: number}).fps ?? 30) / 30;
export const useFrame = (): number => useCurrentFrame() / K;

export const fotogramaDe = (escena: Escena, en: number): number => {
  const fr = escena.frases;
  if (fr.length === 0) return 0;
  const i = Math.max(0, Math.min(fr.length - 1, Math.floor(en)));
  const resto = Math.max(0, en - i);
  const f = fr[i];
  return (f.inicio + resto * (f.fin - f.inicio)) / K;
};

export const suave = Easing.bezier(0.45, 0, 0.2, 1);

/** 0 → 1 en `dur` fotogramas a partir de `desde`, con curva suave. */
export const aparece = (frame: number, desde: number, dur = 18): number =>
  interpolate(frame, [desde, desde + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: suave,
  });
