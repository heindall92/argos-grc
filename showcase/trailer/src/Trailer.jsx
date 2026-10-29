import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import datos from './datos.json';

/* Paleta de ARGOS (app/src/styles.css, tema oscuro). Un solo acento; el iridiscente solo en el logo y la línea. */
const C = { bg: '#05070d', card: '#0e1422', line: 'rgba(255,255,255,.09)', ink: '#f5f5f7', ink2: '#d1d1d6', muted: '#a1a1a8', accent: '#3fd0d6', ens: '#ff7a85', iso: '#a3a0ff', cont: '#5fdc8c' };
const IRI = 'linear-gradient(90deg, #0fb5ba 0%, #2f6bff 45%, #8b5cf6 75%, #14b8a6 100%)';
const F = '"Geist Variable", -apple-system, "Segoe UI", sans-serif';
const M = '"Geist Mono Variable", ui-monospace, monospace';

/* Escenas: [desde, duración] en fotogramas a 30 fps */
const E = { logo: [0, 120], problema: [120, 210], caso: [330, 270], fallo: [600, 240], hallazgo: [840, 270], cifras: [1110, 270], marcos: [1380, 240], cierre: [1620, 360] };
export const DURACION = 1980;

/* Entrada con muelle sin rebote y salida con fundido; con movimiento reducido sería solo el fundido */
function useEntrada(retraso = 0, duracion) {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const s = spring({ frame: f - retraso, fps, config: { damping: 200, mass: .8 } });
  const salida = duracion ? interpolate(f, [duracion - 12, duracion], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  return { opacity: Math.min(s, salida), transform: `translateY(${(1 - s) * 24}px)` };
}
const useVertical = () => { const { width, height } = useVideoConfig(); return height > width; };

const Fondo = ({ children }) => <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: F }}>{children}</AbsoluteFill>;
const Antetitulo = ({ children, style }) => <div style={{ fontFamily: M, fontSize: 30, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: C.accent, ...style }}>{children}</div>;
const Linea = ({ style }) => <div style={{ width: 180, height: 7, borderRadius: 4, background: IRI, ...style }} />;

function Logo({ d }) {
  const v = useVertical(); const a = useEntrada(0, d); const b = useEntrada(10, d); const c = useEntrada(22, d);
  return <Fondo><AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 36 }}>
    <Img src={staticFile('logo.svg')} style={{ width: v ? 260 : 240, height: v ? 260 : 240, ...a }} />
    <div style={{ fontSize: v ? 150 : 170, fontWeight: 760, letterSpacing: '.04em', ...b }}>ARGOS</div>
    <div style={{ ...c, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}><Linea /><div style={{ fontSize: v ? 40 : 44, color: C.ink2 }}>Laboratorio de práctica GRC</div></div>
  </AbsoluteFill></Fondo>;
}

function Problema({ d }) {
  const v = useVertical(); const a = useEntrada(0, d); const b = useEntrada(54, d);
  const t = { fontSize: v ? 76 : 96, fontWeight: 740, letterSpacing: '-.02em', lineHeight: 1.08 };
  return <Fondo><AbsoluteFill style={{ padding: v ? 90 : 160, justifyContent: 'center', gap: 48 }}>
    <div style={{ ...t, color: C.muted, ...a }}>GRC se estudia leyendo normas.</div>
    <div style={{ ...t, ...b }}>En el trabajo se evalúa <span style={{ color: C.accent }}>decidiendo con evidencias.</span></div>
  </AbsoluteFill></Fondo>;
}

/* Fragmento de la grabación dentro de una ventana, con un zoom lento sobre la zona que importa */
function Fragmento({ d, desde, hasta, y0, velocidad = 1, antetitulo, rotulo }) {
  const v = useVertical(); const { width, height } = useVideoConfig(); const f = useCurrentFrame();
  const ventana = useEntrada(0, d); const texto = useEntrada(14, d);
  const W = v ? width - 80 : 1640; const H = v ? 860 : 780;
  const columna = 1120;                      // ancho de la columna de contenido de la app que queremos llenar
  const escala = (W / columna) * interpolate(f, [0, d], [1, 1.035]);
  const x0 = (1920 - columna) / 2;
  return <Fondo><AbsoluteFill style={{ alignItems: 'center', paddingTop: v ? 70 : 56 }}>
    <div style={{ width: W, height: H, borderRadius: 28, overflow: 'hidden', border: `1px solid ${C.line}`, boxShadow: '0 30px 80px rgba(0,0,0,.6)', position: 'relative', background: '#000', ...ventana }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `scale(${escala}) translate(${-x0}px, ${-y0}px)` }}>
        <OffthreadVideo src={staticFile('demo.mp4')} startFrom={Math.round(desde * 30)} endAt={Math.round(hasta * 30)} playbackRate={velocidad} muted style={{ width: 1920, height: 1080 }} />
      </div>
    </div>
    <div style={{ width: W, marginTop: v ? 48 : 40, ...texto }}>
      <Antetitulo>{antetitulo}</Antetitulo>
      <div style={{ fontSize: v ? 58 : 60, fontWeight: 720, letterSpacing: '-.015em', lineHeight: 1.12, marginTop: 14 }}>{rotulo}</div>
    </div>
  </AbsoluteFill></Fondo>;
}

function Cifras({ d }) {
  const v = useVertical(); const f = useCurrentFrame();
  const items = [[datos.preguntas, `preguntas en ${datos.salas} salas`], [datos.maquinas, `máquinas con ${datos.flags} flags`], [datos.simulacros, 'simulacros con reloj'], [0, 'cuentas, servidores y rastreadores']];
  const t = useEntrada(0, d);
  return <Fondo><AbsoluteFill style={{ padding: v ? 80 : 150, justifyContent: 'center' }}>
    <div style={t}><Antetitulo>ARGOS {datos.version}</Antetitulo><div style={{ fontSize: v ? 84 : 96, fontWeight: 740, letterSpacing: '-.02em', marginTop: 18 }}>Lo que hay dentro</div></div>
    <div style={{ display: 'grid', gridTemplateColumns: v ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 28, marginTop: 60 }}>
      {items.map(([n, txt], i) => {
        const e = useEntrada(14 + i * 8, d);
        const cuenta = Math.round(n * interpolate(f, [14 + i * 8, 44 + i * 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
        return <div key={txt} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 32, padding: 40, ...e }}>
          <div style={{ fontSize: 120, fontWeight: 760, letterSpacing: '-.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{cuenta}</div>
          <div style={{ fontSize: 30, color: C.muted, marginTop: 16 }}>{txt}</div>
        </div>;
      })}
    </div>
  </AbsoluteFill></Fondo>;
}

function Marcos({ d }) {
  const v = useVertical(); const a = useEntrada(0, d); const b = useEntrada(30, d);
  const chip = (t, c) => <span style={{ fontSize: v ? 38 : 42, fontWeight: 650, color: c, padding: '18px 34px', borderRadius: 999, background: C.card, border: `1px solid ${C.line}` }}>{t}</span>;
  return <Fondo><AbsoluteFill style={{ padding: v ? 80 : 150, justifyContent: 'center', gap: 56 }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, ...a }}>{chip('Esquema Nacional de Seguridad', C.ens)}{chip('ISO/IEC 27001:2022', C.iso)}{chip('Continuidad de negocio', C.cont)}</div>
    <div style={{ fontSize: v ? 84 : 100, fontWeight: 740, letterSpacing: '-.02em', lineHeight: 1.08, ...b }}>Gratis, de código abierto y en español.<br /><span style={{ color: C.muted }}>Todo en tu navegador.</span></div>
  </AbsoluteFill></Fondo>;
}

function Cierre({ d }) {
  const v = useVertical(); const a = useEntrada(0, d); const b = useEntrada(16, d); const c = useEntrada(34, d);
  return <Fondo><AbsoluteFill style={{ padding: v ? 80 : 150, justifyContent: 'center' }}>
    <div style={a}><Antetitulo>NicaHackFest 2026 · NicaBuilds</Antetitulo>
      <div style={{ fontSize: v ? 96 : 120, fontWeight: 760, letterSpacing: '-.025em', lineHeight: 1.04, marginTop: 22 }}>Domingo 22 de noviembre</div></div>
    <div style={{ ...b, marginTop: 40 }}><Linea /><div style={{ fontSize: v ? 44 : 48, color: C.ink2, marginTop: 34 }}>Demo en directo y taller: decides tú.</div></div>
    <div style={{ ...c, marginTop: 70, display: 'flex', flexDirection: v ? 'column' : 'row', gap: v ? 18 : 40, alignItems: v ? 'flex-start' : 'center' }}>
      <span style={{ fontFamily: M, fontSize: v ? 36 : 40, color: C.accent }}>heindall92.github.io/argos-grc</span>
      <span style={{ fontSize: v ? 34 : 36, color: C.muted }}>Yoandy Ramírez Delgado</span>
    </div>
  </AbsoluteFill></Fondo>;
}

export const Trailer = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Sequence from={E.logo[0]} durationInFrames={E.logo[1]}><Logo d={E.logo[1]} /></Sequence>
    <Sequence from={E.problema[0]} durationInFrames={E.problema[1]}><Problema d={E.problema[1]} /></Sequence>
    <Sequence from={E.caso[0]} durationInFrames={E.caso[1]}><Fragmento d={E.caso[1]} desde={11} hasta={20} y0={70} antetitulo="Máquinas" rotulo="Casos de organizaciones ficticias, con evidencias como las reales." /></Sequence>
    <Sequence from={E.fallo[0]} durationInFrames={E.fallo[1]}><Fragmento d={E.fallo[1]} desde={23} hasta={31} y0={600} antetitulo="Flags" rotulo="Equivocarte aquí no cuesta nada. Y aprendes por qué." /></Sequence>
    <Sequence from={E.hallazgo[0]} durationInFrames={E.hallazgo[1]}><Fragmento d={E.hallazgo[1]} desde={70} hasta={86} velocidad={1.7} y0={520} antetitulo="Laboratorio" rotulo="Hallazgos defendibles, contrastados con una rúbrica." /></Sequence>
    <Sequence from={E.cifras[0]} durationInFrames={E.cifras[1]}><Cifras d={E.cifras[1]} /></Sequence>
    <Sequence from={E.marcos[0]} durationInFrames={E.marcos[1]}><Marcos d={E.marcos[1]} /></Sequence>
    <Sequence from={E.cierre[0]} durationInFrames={E.cierre[1]}><Cierre d={E.cierre[1]} /></Sequence>
  </AbsoluteFill>
);
