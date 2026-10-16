/**
 * PNG helpers. A PNG's pHYs chunk records its physical resolution; with it,
 * a 750 x 1050 pixel card prints at exactly 2.5 x 3.5 inches in apps that
 * honor it (most photo and print dialogs).
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const SIGNATURE_LENGTH = 8;

export function pngSize(png: Uint8Array): { width: number; height: number } {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/** Return a copy of `png` with a pHYs chunk declaring `dpi` (replacing any existing one). */
export function setPngDpi(png: Uint8Array, dpi: number): Uint8Array {
  const pixelsPerMeter = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(4 + 4 + 9 + 4);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  view.setUint32(8, pixelsPerMeter);
  view.setUint32(12, pixelsPerMeter);
  chunk[16] = 1; // unit: meter
  view.setUint32(17, crc32(chunk.subarray(4, 17)));

  // Copy every chunk except an existing pHYs, inserting ours right after IHDR.
  const parts: Uint8Array[] = [png.subarray(0, SIGNATURE_LENGTH)];
  const source = new DataView(png.buffer, png.byteOffset, png.byteLength);
  let offset = SIGNATURE_LENGTH;
  while (offset < png.length) {
    const length = source.getUint32(offset);
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
    const end = offset + 12 + length;
    if (type !== "pHYs") parts.push(png.subarray(offset, end));
    if (type === "IHDR") parts.push(chunk);
    offset = end;
  }
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let position = 0;
  for (const part of parts) {
    out.set(part, position);
    position += part.length;
  }
  return out;
}

export function readPngDpi(png: Uint8Array): number | null {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  let offset = SIGNATURE_LENGTH;
  while (offset < png.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
    if (type === "pHYs" && png[offset + 16] === 1) return Math.round(view.getUint32(offset + 8) * 0.0254);
    offset += 12 + length;
  }
  return null;
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}
