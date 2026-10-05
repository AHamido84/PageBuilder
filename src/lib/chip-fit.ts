/**
 * How many chips stay visible so a wrapping chip row never needs more than `maxRows` lines,
 * leaving room for a trailing «+n» chip when some are hidden. Simulates flex-wrap from measured
 * widths (pure, so it's testable without a browser). Always keeps at least one chip.
 */
export function fitChips(widths: number[], moreWidth: number, rowWidth: number, gap: number, maxRows = 2): number {
  const rowsFor = (ws: number[]) => {
    let rows = 0;
    let x = 0;
    for (const raw of ws) {
      const w = Math.min(raw, rowWidth);
      if (rows === 0 || x + gap + w > rowWidth) {
        rows += 1;
        x = w;
      } else x += gap + w;
    }
    return rows;
  };
  if (rowsFor(widths) <= maxRows) return widths.length;
  for (let k = widths.length - 1; k >= 1; k--) if (rowsFor([...widths.slice(0, k), moreWidth]) <= maxRows) return k;
  return Math.min(1, widths.length);
}
