import React from "react";
import {Composition, Folder} from "remotion";
import {Toma, type MetaToma} from "./components/Toma";
import "./fonts";
import clips from "./generated/clips.json";
import manifestJson from "./generated/manifest.json";
import type {Manifest} from "./types";
import {Video} from "./Video";

const FPS = 30;
const tomas = clips as unknown as Record<string, MetaToma>;
const manifest = manifestJson as unknown as Manifest;

/** Cada grabación real de escritorio, sola, para revisarla en el Studio (la de móvil va dentro del teléfono). */
const TomaSuelta: React.FC<{clip: string}> = ({clip}) => <Toma meta={tomas[clip]} />;
const Completo: React.FC<{subtitulos: boolean}> = ({subtitulos}) => <Video manifest={manifest} tomas={tomas} subtitulos={subtitulos} />;

export const Raiz: React.FC = () => (
  <>
    {/* --props '{"subtitulos":false}' para la versión sin subtítulos quemados (YouTube con el .srt aparte) */}
    <Composition id="ARGOS" component={Completo} defaultProps={{subtitulos: true}} durationInFrames={manifest.duracion} fps={manifest.fps} width={1920} height={1080} />
    <Folder name="Tomas-reales">
      {Object.values(tomas).filter((m) => m.ancho >= 800).map((m) => (
        <Composition key={m.clip} id={`toma-${m.clip.replace(/_/g, "-")}`} component={TomaSuelta} defaultProps={{clip: m.clip}}
          durationInFrames={Math.max(1, Math.round(m.duracion * FPS))} fps={FPS} width={1920} height={1080} />
      ))}
    </Folder>
  </>
);
