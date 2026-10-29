import { Composition } from 'remotion';
import { Trailer, DURACION } from './Trailer.jsx';

export const Root = () => (
  <>
    <Composition id="Trailer" component={Trailer} durationInFrames={DURACION} fps={30} width={1920} height={1080} />
    <Composition id="TrailerVertical" component={Trailer} durationInFrames={DURACION} fps={30} width={1080} height={1350} />
  </>
);
