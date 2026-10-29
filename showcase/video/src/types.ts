export type Frase = {inicio: number; fin: number};
export type Subtitulo = {texto: string; inicio: number; fin: number};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Visual = {tipo: string; [k: string]: any};

export type Escena = {
  id: string;
  bloque: string;
  titulo: string;
  visual: Visual;
  inicio: number;
  duracion: number;
  frases: Frase[];
  subtitulos: Subtitulo[];
  clip: {src: string; duracion: number} | null;
};

export type Manifest = {
  fps: number;
  duracion: number;
  voz: "kokoro" | "clonada" | "propia";
  audio: string;
  bloques: Record<string, string>;
  escenas: Escena[];
};
