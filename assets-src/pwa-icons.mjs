import { deflateSync } from 'node:zlib';

// Render the existing SmartTap diamond mark without a third-party image service.
export function createAppIcon(size) {
  if (![180, 192, 512].includes(size)) throw new Error('Unsupported app icon size.');
  const palette = [[23, 59, 51], [255, 250, 244], [214, 177, 92]];
  const row = size * 4 + 1;
  const pixels = Buffer.alloc(row * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = [0, 0, 0];
      for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
        const dx = Math.abs((x + (sx + .5) / 4) * 512 / size - 256);
        const dy = Math.abs((y + (sy + .5) / 4) * 512 / size - 256);
        const diamond = dx + dy;
        const sample = palette[diamond <= 68 ? 2 : diamond <= 116 ? 0 : diamond <= 152 ? 1 : 0];
        for (let c = 0; c < 3; c++) color[c] += sample[c] / 16;
      }
      const offset = y * row + 1 + x * 4;
      for (let c = 0; c < 3; c++) pixels[offset + c] = Math.round(color[c]);
      pixels[offset + 3] = 255;
    }
  }
  function chunk(type, data) {
    const name = Buffer.from(type), content = Buffer.concat([name, data]);
    let crc = 0xffffffff;
    for (const byte of content) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    const result = Buffer.alloc(data.length + 12);
    result.writeUInt32BE(data.length); content.copy(result, 4);
    result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4);
    return result;
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
