/** Converts "#RRGGBB" to the "H S% L%" triplet our CSS vars expect (e.g. `--primary: 217 91% 40%`). */
export function hexToHslTriplet(hex: string): string | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  const hexDigits = match?.[1];
  if (!hexDigits) return null;

  const r = parseInt(hexDigits.slice(0, 2), 16) / 255;
  const g = parseInt(hexDigits.slice(2, 4), 16) / 255;
  const b = parseInt(hexDigits.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return `0 0% ${Math.round(l * 100)}%`;

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  h *= 60;

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
