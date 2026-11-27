// news-image-20261127 — "Sum up 27 November's world news in one image"
// Draws a one-day newspaper front page for Friday 27 November 2026:
// a dated masthead, six illustrated stories from that day (Kuwait drone
// strike, US Thanksgiving storms, Gaza, World Chess Championship, UK net
// migration, Ibiza tanker), and a ticker of further stories from the day.
// Pure Node standard library: a small raster canvas, a 5x7 bitmap font and
// a hand-written PNG encoder. No network, no assets, no randomness — the
// same run always writes the same bytes to $MAKEFUN_OUTPUT_DIR/entry.png
// (default /output).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

// ---------------------------------------------------------------- PNG out

const CRC_TABLE: Uint32Array = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(w: number, h: number, rgba: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter: none
    rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ font
// 5x7 bitmap font, uppercase only (a news-poster look). Each glyph is 7
// rows of 5 bits written as "1"/"0" strings.

const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "\u2022": ["00000", "00000", "01110", "01110", "01110", "00000", "00000"],
  "\u2014": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
};

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function wrapText(s: string, scale: number, maxW: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (textWidth(next, scale) <= maxW || !cur) cur = next;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- canvas

type RGB = [number, number, number];

class Canvas {
  readonly w: number;
  readonly h: number;
  readonly data: Buffer;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 4, 255);
  }
  px(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
    this.data[i + 3] = 255;
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) this.px(i, j, c);
  }
  hgrad(x: number, y: number, w: number, h: number, top: RGB, bot: RGB): void {
    for (let j = 0; j < h; j++) {
      const t = h <= 1 ? 0 : j / (h - 1);
      const c: RGB = [
        Math.round(top[0] + (bot[0] - top[0]) * t),
        Math.round(top[1] + (bot[1] - top[1]) * t),
        Math.round(top[2] + (bot[2] - top[2]) * t),
      ];
      this.rect(x, y + j, w, 1, c);
    }
  }
  circle(cx: number, cy: number, r: number, c: RGB): void {
    for (let j = -r; j <= r; j++)
      for (let i = -r; i <= r; i++)
        if (i * i + j * j <= r * r) this.px(cx + i, cy + j, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, th = 1): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(x0 + (dx * s) / steps);
      const y = Math.round(y0 + (dy * s) / steps);
      for (let a = 0; a < th; a++)
        for (let b = 0; b < th; b++) this.px(x + a, y + b, c);
    }
  }
  // Filled triangle via scanlines.
  tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      const edges: [number, number, number, number][] = [
        [x0, y0, x1, y1],
        [x1, y1, x2, y2],
        [x2, y2, x0, y0],
      ];
      for (const [ax, ay, bx, by] of edges) {
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
        }
      }
      if (xs.length >= 2) {
        const lo = Math.ceil(Math.min(...xs));
        const hi = Math.floor(Math.max(...xs));
        for (let x = lo; x <= hi; x++) this.px(x, y, c);
      }
    }
  }
  text(s: string, x: number, y: number, scale: number, c: RGB): void {
    const up = s.toUpperCase();
    for (let ci = 0; ci < up.length; ci++) {
      const g = FONT[up[ci]] ?? FONT["?"];
      for (let r = 0; r < 7; r++)
        for (let col = 0; col < 5; col++)
          if (g[r][col] === "1")
            this.rect(x + ci * 6 * scale + col * scale, y + r * scale, scale, scale, c);
    }
  }
  textCentered(s: string, cx: number, y: number, scale: number, c: RGB): void {
    this.text(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
  }
}

// ------------------------------------------------------------- scenes
// Each scene fills a 500x140 box at (x, y). Flat vector shapes only.

function sceneKuwait(cv: Canvas, x: number, y: number): void {
  cv.hgrad(x, y, 500, 140, [214, 96, 48], [242, 178, 92]); // dusk sky
  cv.circle(x + 415, y + 34, 22, [255, 214, 120]); // low sun
  cv.circle(x + 415, y + 34, 16, [255, 232, 160]);
  // skyline
  const ink: RGB = [58, 32, 24];
  cv.rect(x + 10, y + 96, 60, 44, ink);
  cv.rect(x + 80, y + 78, 46, 62, ink);
  cv.rect(x + 136, y + 104, 70, 36, ink);
  cv.rect(x + 216, y + 86, 52, 54, ink);
  cv.rect(x + 278, y + 100, 66, 40, ink);
  cv.rect(x + 354, y + 72, 44, 68, ink);
  cv.rect(x + 408, y + 92, 82, 48, ink);
  // lit windows
  const win: RGB = [255, 205, 110];
  for (const [wx, wy] of [[22, 106], [40, 118], [92, 90], [104, 106], [228, 96], [240, 112], [366, 84], [420, 102], [448, 114]]) {
    cv.rect(x + wx, y + wy, 6, 8, win);
  }
  // oil derrick
  cv.line(x + 470, y + 140, x + 478, y + 84, ink, 3);
  cv.line(x + 486, y + 140, x + 478, y + 84, ink, 3);
  cv.line(x + 468, y + 118, x + 488, y + 118, ink, 2);
  // drone
  const dr: RGB = [30, 30, 34];
  cv.rect(x + 150, y + 30, 34, 8, dr);
  cv.line(x + 142, y + 26, x + 192, y + 26, dr, 2);
  cv.line(x + 150, y + 40, x + 158, y + 52, dr, 2);
  cv.line(x + 176, y + 40, x + 184, y + 52, dr, 2);
  cv.circle(x + 167, y + 46, 3, dr);
  // explosion burst over the skyline
  const ex = x + 300;
  const ey = y + 66;
  cv.circle(ex, ey, 20, [255, 190, 60]);
  cv.circle(ex, ey, 13, [255, 120, 30]);
  cv.circle(ex, ey, 7, [255, 230, 140]);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    cv.tri(
      ex, ey,
      Math.round(ex + Math.cos(a) * 30), Math.round(ey + Math.sin(a) * 30),
      Math.round(ex + Math.cos(a + 0.35) * 12), Math.round(ey + Math.sin(a + 0.35) * 12),
      [255, 120, 30],
    );
  }
  // smoke
  cv.circle(x + 300, y + 30, 12, [90, 70, 60]);
  cv.circle(x + 316, y + 22, 9, [110, 88, 76]);
}

function sceneStorm(cv: Canvas, x: number, y: number): void {
  cv.hgrad(x, y, 500, 140, [38, 52, 74], [74, 106, 138]); // storm sky
  // clouds
  const cl: RGB = [28, 38, 56];
  cv.circle(x + 70, y + 26, 26, cl);
  cv.circle(x + 110, y + 18, 32, cl);
  cv.circle(x + 160, y + 28, 24, cl);
  cv.circle(x + 330, y + 22, 28, cl);
  cv.circle(x + 380, y + 16, 34, cl);
  cv.circle(x + 430, y + 26, 24, cl);
  // lightning
  const bolt: RGB = [255, 226, 80];
  cv.line(x + 240, y + 30, x + 224, y + 62, bolt, 4);
  cv.line(x + 224, y + 62, x + 238, y + 66, bolt, 4);
  cv.line(x + 238, y + 66, x + 220, y + 96, bolt, 4);
  // rain
  const rain: RGB = [170, 205, 230];
  for (let i = 0; i < 46; i++) {
    const rx = x + ((i * 37) % 500);
    const ry = y + 44 + ((i * 53) % 88);
    cv.line(rx, ry, rx - 6, ry + 12, rain, 1);
  }
  // ground + house
  cv.rect(x, y + 118, 500, 22, [24, 30, 40]);
  const house: RGB = [52, 42, 36];
  cv.rect(x + 36, y + 92, 72, 48, house);
  cv.tri(x + 28, y + 94, x + 72, y + 66, x + 116, y + 94, [36, 28, 26]);
  cv.rect(x + 62, y + 112, 18, 28, [255, 205, 110]); // lit door
  cv.rect(x + 44, y + 100, 12, 12, [255, 205, 110]);
  // bent tree in the wind
  cv.line(x + 420, y + 140, x + 436, y + 92, [40, 52, 32], 5);
  cv.circle(x + 448, y + 82, 16, [46, 90, 52]);
  cv.circle(x + 430, y + 74, 12, [56, 104, 60]);
  // fallen power line
  cv.line(x + 150, y + 70, x + 330, y + 118, [20, 22, 28], 2);
}

function sceneGaza(cv: Canvas, x: number, y: number): void {
  cv.hgrad(x, y, 500, 140, [138, 134, 122], [176, 168, 150]); // dusty sky
  // smoke columns
  cv.circle(x + 120, y + 30, 18, [120, 116, 106]);
  cv.circle(x + 140, y + 18, 14, [140, 136, 126]);
  cv.circle(x + 380, y + 34, 16, [120, 116, 106]);
  cv.circle(x + 400, y + 20, 12, [140, 136, 126]);
  // broken buildings
  const b1: RGB = [74, 70, 64];
  const b2: RGB = [96, 92, 84];
  cv.rect(x + 20, y + 70, 70, 70, b1);
  cv.tri(x + 20, y + 70, x + 55, y + 44, x + 90, y + 70, b1);
  cv.rect(x + 100, y + 92, 56, 48, b2);
  cv.tri(x + 100, y + 92, x + 128, y + 70, x + 156, y + 92, b2);
  cv.rect(x + 166, y + 60, 64, 80, b1);
  cv.tri(x + 166, y + 60, x + 198, y + 36, x + 230, y + 60, b1);
  cv.rect(x + 240, y + 96, 60, 44, b2);
  cv.rect(x + 310, y + 74, 72, 66, b1);
  cv.tri(x + 310, y + 74, x + 346, y + 50, x + 382, y + 74, b1);
  cv.rect(x + 392, y + 88, 88, 52, b2);
  cv.tri(x + 392, y + 88, x + 436, y + 62, x + 480, y + 88, b2);
  // dark windows
  const dw: RGB = [30, 28, 26];
  for (const [wx, wy] of [[34, 84], [58, 84], [180, 76], [204, 96], [324, 88], [348, 108], [410, 100], [446, 100]]) {
    cv.rect(x + wx, y + wy, 10, 12, dw);
  }
  // rubble piles
  cv.tri(x + 60, y + 140, x + 96, y + 118, x + 132, y + 140, [110, 104, 94]);
  cv.tri(x + 250, y + 140, x + 290, y + 120, x + 330, y + 140, [110, 104, 94]);
  cv.tri(x + 400, y + 140, x + 436, y + 122, x + 472, y + 140, [110, 104, 94]);
}

function sceneChess(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 500, 140, [36, 84, 58]); // green felt
  const bx = x + 176;
  const by = y + 6;
  const sq = 16;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      cv.rect(bx + c * sq, by + r * sq, sq, sq, (r + c) % 2 === 0 ? [240, 217, 181] : [120, 86, 58]);
  // white king (left) and black king (right) standing on the board
  const wk: RGB = [245, 240, 225];
  const bk: RGB = [28, 22, 18];
  const gold: RGB = [212, 175, 55];
  // white king
  cv.rect(bx + 8, by + 34, 20, 8, wk);
  cv.rect(bx + 12, by + 42, 12, 26, wk);
  cv.rect(bx + 6, by + 66, 24, 8, wk);
  cv.circle(bx + 18, by + 26, 8, wk);
  cv.line(bx + 18, by + 14, bx + 18, by + 30, gold, 3);
  cv.line(bx + 12, by + 20, bx + 24, by + 20, gold, 3);
  // black king
  cv.rect(bx + 92, by + 34, 20, 8, bk);
  cv.rect(bx + 96, by + 42, 12, 26, bk);
  cv.rect(bx + 90, by + 66, 24, 8, bk);
  cv.circle(bx + 102, by + 26, 8, bk);
  cv.line(bx + 102, by + 14, bx + 102, by + 30, gold, 3);
  cv.line(bx + 96, by + 20, bx + 108, by + 20, gold, 3);
  // pawns at the edges
  cv.circle(bx + 42, by + 96, 7, wk);
  cv.rect(bx + 36, by + 102, 12, 8, wk);
  cv.circle(bx + 78, by + 96, 7, bk);
  cv.rect(bx + 72, by + 102, 12, 8, bk);
  // clocks either side of the board: the match score after three draws
  for (const [cx, score] of [[x + 96, "1.5"], [x + 404, "1.5"]] as const) {
    cv.rect(cx - 34, y + 44, 68, 44, [24, 24, 28]);
    cv.rect(cx - 28, y + 50, 56, 32, [245, 240, 225]);
    cv.text(score, cx - 17, y + 58, 2, [20, 20, 24]);
  }
}

function sceneLondon(cv: Canvas, x: number, y: number): void {
  cv.hgrad(x, y, 500, 140, [168, 198, 222], [214, 226, 232]); // pale sky
  cv.circle(x + 430, y + 30, 18, [255, 240, 180]);
  // Big Ben
  const stone: RGB = [176, 158, 120];
  const dark: RGB = [52, 44, 36];
  cv.rect(x + 60, y + 30, 52, 110, stone);
  cv.tri(x + 56, y + 32, x + 86, y + 2, x + 116, y + 32, dark);
  cv.circle(x + 86, y + 58, 17, [245, 240, 225]);
  cv.circle(x + 86, y + 58, 14, [30, 30, 34]);
  cv.line(x + 86, y + 58, x + 86, y + 48, [245, 240, 225], 2);
  cv.line(x + 86, y + 58, x + 94, y + 62, [245, 240, 225], 2);
  cv.rect(x + 78, y + 92, 16, 10, dark);
  // parliament block
  cv.rect(x + 126, y + 96, 150, 44, [150, 134, 100]);
  for (let i = 0; i < 6; i++) cv.rect(x + 136 + i * 24, y + 104, 10, 16, dark);
  // red double-decker bus
  const bus: RGB = [178, 34, 34];
  cv.rect(x + 300, y + 96, 150, 44, bus);
  for (let i = 0; i < 5; i++) {
    cv.rect(x + 308 + i * 28, y + 102, 18, 12, [200, 225, 240]);
    cv.rect(x + 308 + i * 28, y + 120, 18, 12, [200, 225, 240]);
  }
  cv.circle(x + 322, y + 140, 9, [20, 20, 24]);
  cv.circle(x + 428, y + 140, 9, [20, 20, 24]);
  // ground
  cv.rect(x, y + 140 - 2, 500, 2, [90, 84, 76]);
}

function sceneTanker(cv: Canvas, x: number, y: number): void {
  cv.hgrad(x, y, 500, 84, [186, 214, 232], [226, 238, 242]); // sky
  cv.circle(x + 70, y + 24, 16, [255, 244, 190]);
  // smoke from the wreck
  cv.circle(x + 300, y + 34, 16, [90, 88, 84]);
  cv.circle(x + 322, y + 22, 12, [110, 108, 104]);
  cv.circle(x + 342, y + 32, 10, [128, 126, 122]);
  // sea
  cv.hgrad(x, y + 84, 500, 56, [28, 96, 138], [16, 62, 96]);
  // capsized hull: dark belly-up shape with a red keel line
  const hull: RGB = [32, 34, 38];
  cv.rect(x + 170, y + 78, 170, 26, hull);
  cv.tri(x + 170, y + 78, x + 170, y + 104, x + 200, y + 104, hull);
  cv.tri(x + 340, y + 78, x + 340, y + 104, x + 310, y + 104, hull);
  cv.rect(x + 170, y + 76, 170, 4, [178, 34, 34]); // keel stripe
  // propeller + rudder sticking up out of the water
  cv.line(x + 330, y + 78, x + 344, y + 56, hull, 4);
  cv.circle(x + 348, y + 52, 7, [212, 175, 55]);
  // waves
  const foam: RGB = [220, 238, 246];
  for (const [wx, wy, ww] of [[30, 112, 60], [120, 124, 70], [380, 116, 64], [430, 128, 56]]) {
    cv.line(x + wx, y + wy, x + wx + ww, y + wy, foam, 2);
  }
  // slick
  cv.rect(x + 200, y + 108, 110, 4, [20, 24, 30]);
  cv.rect(x + 230, y + 116, 70, 3, [20, 24, 30]);
  // distant island
  cv.tri(x + 420, y + 84, x + 450, y + 62, x + 480, y + 84, [96, 118, 96]);
}

// ------------------------------------------------------------- layout

const PAPER: RGB = [247, 241, 227];
const INK: RGB = [22, 22, 26];
const NAVY: RGB = [16, 29, 51];
const GOLD: RGB = [212, 175, 55];
const RED: RGB = [178, 34, 34];
const MUTED: RGB = [84, 78, 70];

interface Story {
  kicker: string;
  headline: string;
  caption: string;
  scene: (cv: Canvas, x: number, y: number) => void;
}

const STORIES: Story[] = [
  {
    kicker: "MIDDLE EAST \u2022 KUWAIT",
    headline: "DRONE STRIKE IN KUWAIT KILLS TWO",
    caption: "Two Italian workers dead in a drone attack; Iran denies it was behind it.",
    scene: sceneKuwait,
  },
  {
    kicker: "UNITED STATES \u2022 THANKSGIVING",
    headline: "THANKSGIVING STORMS BLACK OUT 800,000",
    caption: "Macy's 100th parade postponed; 1,000+ flights cancelled in the storms.",
    scene: sceneStorm,
  },
  {
    kicker: "GAZA",
    headline: "ISRAEL KILLS 10 IN GAZA",
    caption: "Hamas weighs its response as strikes continue across the Strip.",
    scene: sceneGaza,
  },
  {
    kicker: "CHESS \u2022 WORLD TITLE",
    headline: "WORLD CHESS: GAME 3 A MARATHON DRAW",
    caption: "Gukesh and Sindarov still level after three games of the title match.",
    scene: sceneChess,
  },
  {
    kicker: "UNITED KINGDOM",
    headline: "UK NET MIGRATION LOWEST SINCE 1997",
    caption: "Biggest fall in decades, new figures show.",
    scene: sceneLondon,
  },
  {
    kicker: "MEDITERRANEAN \u2022 IBIZA",
    headline: "TANKER CAPSIZES OFF IBIZA, ONE DEAD",
    caption: "Diesel ship carrying 7,000 tonnes of fuel sinks in the Mediterranean.",
    scene: sceneTanker,
  },
];

const TICKER =
  "ALSO TODAY: EBOLA IN CONGO PASSES 12,000 CASES \u2022 BANGKOK REFINERY BLAST INJURES NINE \u2022 " +
  "DEPARDIEU TO STAND TRIAL \u2022 TRUMP DEMANDS PROBE OF 'FAKE' GDP FIGURES";

function drawPanel(cv: Canvas, px: number, py: number, s: Story): void {
  // white card with a thin ink frame
  cv.rect(px, py, 500, 254, [255, 255, 255]);
  cv.rect(px, py, 500, 2, INK);
  cv.rect(px, py + 252, 500, 2, INK);
  cv.rect(px, py, 2, 254, INK);
  cv.rect(px + 498, py, 2, 254, INK);
  // illustrated scene
  s.scene(cv, px, py);
  const ty = py + 140;
  // kicker
  cv.text(s.kicker, px + 14, ty + 8, 2, RED);
  cv.rect(px + 14, ty + 26, 64, 3, GOLD);
  // headline, up to 2 lines
  const head = wrapText(s.headline, 3, 472);
  let hy = ty + 33;
  for (const line of head) {
    cv.text(line, px + 14, hy, 3, INK);
    hy += 22;
  }
  // caption, up to 2 lines
  const cap = wrapText(s.caption, 2, 472);
  let cy = hy + 4;
  for (const line of cap) {
    cv.text(line, px + 14, cy, 2, MUTED);
    cy += 14;
  }
}

function build(): Buffer {
  const W = 1024;
  const H = 1024;
  const cv = new Canvas(W, H);
  cv.rect(0, 0, W, H, PAPER);

  // ---- masthead
  cv.rect(0, 0, W, 148, NAVY);
  cv.textCentered("THE WORLD IN ONE DAY", 512, 16, 2, GOLD);
  cv.textCentered("FRIDAY 27 NOVEMBER 2026", 512, 44, 5, [255, 255, 255]);
  cv.rect(312, 106, 400, 3, GOLD);
  cv.textCentered("SIX STORIES THAT DEFINED THE DAY", 512, 120, 2, [200, 210, 225]);

  // ---- six panels, 2 x 3
  const xs = [8, 516];
  const ys = [156, 418, 680];
  for (let i = 0; i < 6; i++) {
    drawPanel(cv, xs[i % 2], ys[Math.floor(i / 2)], STORIES[i]);
  }

  // ---- ticker
  cv.rect(0, 942, W, 82, NAVY);
  cv.rect(0, 942, W, 3, GOLD);
  const lines = wrapText(TICKER, 2, 992);
  let ty = 956;
  for (const line of lines) {
    cv.text(line, 16, ty, 2, [235, 238, 242]);
    ty += 16;
  }

  return encodePng(W, H, cv.data);
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const png = build();
  writeFileSync(join(outDir, "entry.png"), png);
}

main();
