import {getInputProps, staticFile} from "remotion";

/**
 * Ruta de una toma según el render:
 * - --props '{"proxy":true}'          → copias ligeras (revisión rápida)
 * - --props '{"dir":"clips_final"}'   → originales con keyframes cada 10 fotogramas (render final, salta rápido)
 * - sin props                         → originales tal cual se grabaron
 */
export const srcClip = (clip: string) => {
  const p = getInputProps() as {proxy?: boolean; dir?: string};
  const dir = p.dir ?? (p.proxy ? "clips_proxy" : "clips");
  return staticFile(`${dir}/${clip}.mp4`);
};
