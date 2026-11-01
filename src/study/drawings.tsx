// Study Book drawings. Static ones are generated from the legacy file; these two are parametric,
// ported line by line from qattSVG() and weaveSVG() in legacy/studybook/index.html.
import type { ReactElement } from "react";
import { STATIC_DRAWINGS } from "./drawings.generated";

/** Al-Qatt style wall band (a drawing based on UNESCO's description, not a copy of a real wall). */
export function QattSVG({ on, mono }: { on: boolean[]; mono: boolean }) {
  const W = 360, H = 300;
  const C = mono
    ? ["var(--qatt-black)", "var(--qatt-sand)", "var(--qatt-black)", "var(--qatt-sand)"]
    : ["var(--qatt-red)", "var(--qatt-yellow)", "var(--qatt-blue)", "var(--qatt-black)"];
  const g: ReactElement[] = [<rect key="bg" width={W} height={H} fill={mono ? "var(--qatt-wall-mono)" : "var(--qatt-wall)"} />];
  // layer 0: kufuf ("palms"): finger-width horizontal bands at the bottom
  if (on[0]) for (let k = 0; k < 4; k++) g.push(<rect key={"b" + k} x="0" y={H - 18 - k * 16} width={W} height="9" fill={C[k % 4]} />);
  // layer 1: a row of triangles above the bands
  if (on[1]) for (let k = 0; k < 12; k++) { const x = k * 30; g.push(<path key={"t" + k} d={`M${x} 214 L${x + 15} 168 L${x + 30} 214 Z`} fill={C[k % 3]} stroke="var(--qatt-black)" strokeWidth="1" />); }
  // layer 2: amshat ("combs"): thin vertical lines between triangles
  if (on[2]) for (let k = 0; k < 12; k++) { const x = k * 30 + 30; g.push(<path key={"c" + k} d={`M${x} 168 L${x} 214 M${x - 4} 176 L${x - 4} 214 M${x + 4} 176 L${x + 4} 214`} stroke={C[3]} strokeWidth="1.4" />); }
  // layer 3: an upper band of small diamonds
  if (on[3]) for (let k = 0; k < 18; k++) { const x = k * 20 + 10; g.push(<path key={"d" + k} d={`M${x} 120 L${x + 10} 132 L${x} 144 L${x - 10} 132 Z`} fill={C[(k + 1) % 3]} />); }
  if (!on.some(Boolean)) g.push(<text key="e" x={W / 2} y={H / 2} fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="var(--qatt-text)" textAnchor="middle">White gypsum wall. Add a layer.</text>);
  return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Al-Qatt style wall band drawing">{g}</svg>;
}

// rule(row, col) -> true when the warp (lengthwise) thread is on top at that crossing
export const WEAVE_RULES: Record<string, (r: number, c: number) => boolean> = {
  plain: (r, c) => (r + c) % 2 === 0,
  twill: (r, c) => ((c - r) % 4 + 4) % 4 < 2,
  satin: (r, c) => ((c * 2 - r) % 5 + 5) % 5 !== 0,
};
export function WeaveSVG({ rule, label }: { rule: string; label: string }) {
  const f = WEAVE_RULES[rule], n = 12, cell = 26, pad = 4, size = n * cell + pad * 2;
  const cells: ReactElement[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const warp = f(r, c), x = pad + c * cell, y = pad + r * cell;
    cells.push(warp
      ? <rect key={r + "-" + c} x={x + 5} y={y} width={cell - 10} height={cell} rx="3" fill="var(--accent)" />
      : <rect key={r + "-" + c} x={x} y={y + 5} width={cell} height={cell - 10} rx="3" fill="var(--gold)" />);
  }
  return <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label} weave pattern`}><rect width={size} height={size} fill="var(--surface)" />{cells}</svg>;
}

const DRAWINGS: Record<string, () => ReactElement> = {
  ...STATIC_DRAWINGS,
  qattMono: () => <QattSVG on={[true, true, true, false]} mono />,
  qattColor: () => <QattSVG on={[true, true, true, true]} mono={false} />,
  qattBlank: () => <QattSVG on={[false, true, false, false]} mono />,
};
export const drawingNames = () => Object.keys(DRAWINGS);
export function Drawing({ name }: { name: string }) {
  const D = DRAWINGS[name];
  return D ? <D /> : null;
}
