/**
 * Card text is sized in container-query units (cqw: 1% of the card's width), so
 * the same layout works for a gallery thumbnail, the editor preview and a
 * 2.5-inch print. Long text shrinks smoothly down to a readable minimum, after
 * which CSS truncates it.
 */
export function fitFontSize(text: string, base: number, comfortableChars: number, min: number): number {
  const length = [...text].length; // count emoji/accents as one character
  if (length <= comfortableChars) return base;
  return Math.max(min, Math.round(((base * comfortableChars) / length) * 100) / 100);
}

export const cqw = (value: number) => `${value}cqw`;
