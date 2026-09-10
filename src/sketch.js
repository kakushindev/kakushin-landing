// Hand-drawn bits that wired-elements does not ship: the 革新 stamp and
// the RPG-menu pointing hand. Both use Rough.js, the same engine that
// draws the wired components, so the wobble matches.
// The package's browser field points at a UMD build with no ES default export; use the ESM bundle.
import rough from 'roughjs/bundled/rough.esm.js';

export const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

// A gloved hand pointing right, in a 32×32 box. Drawn for this page.
const HAND_PATH =
  'M2.5 12.5 L8 12.5 L8 7 Q8 4.5 10.5 4.5 Q13 4.5 13 7 L13 12.5 L28.5 12.5 ' +
  'Q31 12.5 31 15 Q31 17.5 28.5 17.5 L20.5 17.5 ' +
  'Q23.8 17.5 23.8 19.2 Q23.8 20.8 20.8 20.8 ' +
  'Q23.5 20.8 23.5 22.5 Q23.5 24.1 20.6 24.1 ' +
  'Q23.2 24.1 23.2 25.8 Q23.2 27.4 20.2 27.4 L2.5 27.4 Z';

/** Draws the pointing hand into an <svg viewBox="0 0 32 32">. */
export function drawHand(svg, seed = randomSeed()) {
  svg.replaceChildren();
  const rc = rough.svg(svg);
  const stroke = {
    seed,
    roughness: 0.7,
    bowing: 0.5,
    stroke: 'currentColor',
    strokeWidth: 1.5,
    disableMultiStroke: true,
  };
  // The solid fill path gets stroke="none"; style.css recolours it to the page background.
  svg.appendChild(rc.path(HAND_PATH, { ...stroke, fill: '#000', fillStyle: 'solid' }));
  svg.appendChild(rc.line(7.5, 12.5, 7.5, 27.4, stroke)); // cuff
  return seed;
}

/** Draws a rough red seal frame into an <svg viewBox="0 0 100 100">. */
export function drawStamp(svg, { ink = '#c8102e', seed = randomSeed() } = {}) {
  svg.replaceChildren();
  const rc = rough.svg(svg);
  const pad = 9;
  svg.appendChild(
    rc.rectangle(pad, pad, 100 - pad * 2, 100 - pad * 2, {
      seed,
      roughness: 2.6,
      bowing: 2,
      stroke: ink,
      strokeWidth: 2.4,
      fill: ink,
      fillStyle: 'hachure',
      hachureAngle: -38,
      hachureGap: 8,
      fillWeight: 0.7,
    }),
  );
  return seed;
}
