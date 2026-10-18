/**
 * Zero-dependency Offline QR Code & 1D Barcode SVG Generator
 * Generates ISO/IEC 18004 compliant QR code matrices and Code 39 barcodes.
 * Operates locally with zero external network requests or dependencies.
 */

import React from 'react';

// ==========================================
// REED-SOLOMON & GF(256) ARITHMETIC
// ==========================================

const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d; // QR standard primitive polynomial
    }
  }
  for (let i = 255; i < 512; i++) {
    GF256_EXP[i] = GF256_EXP[i - 255];
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF256_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMultiply(poly[j], factor);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsCalculateRemainder(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const remainder = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[ecCount - 1] = 0;
    for (let j = 0; j < ecCount; j++) {
      remainder[j] ^= gfMultiply(gen[j], factor);
    }
  }
  return remainder;
}

// Version specifications (Version 1, 2, 3, 4 with Low / Medium Error Correction)
interface QRVersionSpec {
  version: number;
  size: number;
  totalBytes: number;
  dataBytes: number;
  ecBytes: number;
  alignPos?: number;
}

const QR_SPECS: QRVersionSpec[] = [
  { version: 1, size: 21, totalBytes: 26, dataBytes: 19, ecBytes: 7 }, // V1-L
  { version: 2, size: 25, totalBytes: 44, dataBytes: 34, ecBytes: 10, alignPos: 18 }, // V2-L
  { version: 3, size: 29, totalBytes: 70, dataBytes: 55, ecBytes: 15, alignPos: 22 }, // V3-L
  { version: 4, size: 33, totalBytes: 100, dataBytes: 80, ecBytes: 20, alignPos: 26 }, // V4-L
];

export function generateQRCodeMatrix(text: string): boolean[][] {
  const rawBytes = new TextEncoder().encode(text);
  const spec = QR_SPECS.find((s) => s.dataBytes >= rawBytes.length + 3) || QR_SPECS[QR_SPECS.length - 1];
  const { size, dataBytes, ecBytes, alignPos } = spec;

  // 1. Bitstream encoding: 4-bit mode (Byte: 0100) + 8-bit length + data
  const bits: number[] = [];
  const appendBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  appendBits(0b0100, 4); // Byte mode indicator
  appendBits(Math.min(rawBytes.length, dataBytes - 3), 8); // character count

  for (let i = 0; i < Math.min(rawBytes.length, dataBytes - 3); i++) {
    appendBits(rawBytes[i], 8);
  }

  // Terminator
  appendBits(0, Math.min(4, dataBytes * 8 - bits.length));

  // Align to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Convert to bytes
  const dataBuf = new Uint8Array(dataBytes);
  let byteIdx = 0;
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i + j];
    }
    dataBuf[byteIdx++] = b;
  }

  // Pad bytes: alternating 0xEC and 0x11
  let padByte = 0xec;
  while (byteIdx < dataBytes) {
    dataBuf[byteIdx++] = padByte;
    padByte = padByte === 0xec ? 0x11 : 0xec;
  }

  // 2. Reed-Solomon Error Correction Code
  const ecBuf = rsCalculateRemainder(dataBuf, ecBytes);
  const totalCodewords = new Uint8Array(dataBytes + ecBytes);
  totalCodewords.set(dataBuf, 0);
  totalCodewords.set(ecBuf, dataBytes);

  // 3. Matrix allocation
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean, fn = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (fn) isFunction[r][c] = true;
    }
  };

  // Place Finder Pattern (7x7) + Separator
  const placeFinder = (startR: number, startC: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = startR + r;
        const col = startC + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          setModule(row, col, false);
        } else if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          setModule(row, col, true);
        } else {
          setModule(row, col, false);
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // Alignment Pattern for Version >= 2
  if (alignPos) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isBlack = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        setModule(alignPos + r, alignPos + c, isBlack);
      }
    }
  }

  // Reserve format info area
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      setModule(8, i, false);
      setModule(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setModule(8, size - 1 - i, false);
    setModule(size - 1 - i, 8, false);
  }
  setModule(size - 8, 8, true); // Dark module

  // 4. Place Data Codewords (Zigzag 2-column paths)
  let bitIndex = 0;
  const allBits: number[] = [];
  for (let i = 0; i < totalCodewords.length; i++) {
    for (let b = 7; b >= 0; b--) {
      allBits.push((totalCodewords[i] >>> b) & 1);
    }
  }

  let upward = true;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--; // Skip vertical timing pattern column
    const colList = [rightCol, rightCol - 1];

    const rowStart = upward ? size - 1 : 0;
    const rowEnd = upward ? -1 : size;
    const rowStep = upward ? -1 : 1;

    for (let row = rowStart; row !== rowEnd; row += rowStep) {
      for (const col of colList) {
        if (!isFunction[row][col]) {
          const bit = bitIndex < allBits.length ? allBits[bitIndex++] : 0;
          // Apply Standard Mask 0: (row + col) % 2 === 0
          const mask = (row + col) % 2 === 0;
          matrix[row][col] = (bit === 1) !== mask;
        }
      }
    }
    upward = !upward;
  }

  // 5. Write Format Information (Error Correction Level L + Mask 000 = 0b111011111000100)
  const formatBits = 0x77c4; // Precomputed BCH(15,5) for L-mask 000
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >>> (14 - i)) & 1) === 1;

    // Top-left finder region
    if (i < 6) {
      matrix[8][i] = bit;
    } else if (i === 6) {
      matrix[8][7] = bit;
    } else if (i === 7) {
      matrix[8][8] = bit;
    } else if (i === 8) {
      matrix[7][8] = bit;
    } else {
      matrix[14 - i][8] = bit; // skips timing row 6
    }

    // Split between bottom-left (7 bits: 0..6) and top-right (8 bits: 7..14)
    if (i < 7) {
      matrix[size - 1 - i][8] = bit;
    } else {
      matrix[8][size - 15 + i] = bit; // starts at size - 8
    }
  }

  // Ensure fixed dark module at (size - 8, 8) is always true
  matrix[size - 8][8] = true;

  return matrix;
}

// ==========================================
// CODE 39 1D BARCODE GENERATOR
// ==========================================

const CODE39_PATTERNS: Record<string, string> = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100',
};

export function generateBarcode39Bars(text: string): { isBar: boolean; isWide: boolean }[] {
  const clean = '*' + text.toUpperCase().replace(/[^0-9A-Z\-.$/+% ]/g, '-') + '*';
  const bars: { isBar: boolean; isWide: boolean }[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const pat = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];
    for (let j = 0; j < 9; j++) {
      const isBar = j % 2 === 0;
      const isWide = pat[j] === '1';
      bars.push({ isBar, isWide });
    }
    // Narrow inter-character gap
    bars.push({ isBar: false, isWide: false });
  }

  return bars;
}

// ==========================================
// REACT COMPONENTS
// ==========================================

export interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
  ariaLabel?: string;
}

export const QRCodeSVG: React.FC<QRCodeSVGProps> = ({
  value,
  size = 140,
  className = '',
  fgColor = '#0f172a',
  bgColor = '#ffffff',
  ariaLabel = 'Scannable QR Code',
}) => {
  const matrix = React.useMemo(() => generateQRCodeMatrix(value), [value]);
  const matrixSize = matrix.length;
  const padding = 2; // quiet zone
  const totalGrid = matrixSize + padding * 2;

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${totalGrid} ${totalGrid}`}
      width={size}
      height={size}
      className={`inline-block select-none ${className}`}
      style={{ shapeRendering: 'crispEdges' }}
    >
      {/* Background */}
      <rect x="0" y="0" width={totalGrid} height={totalGrid} fill={bgColor} rx="1" />
      {/* Modules */}
      {matrix.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c + padding}
              y={r + padding}
              width="1"
              height="1"
              fill={fgColor}
            />
          ) : null
        )
      )}
    </svg>
  );
};

export interface BarcodeSVGProps {
  value: string;
  height?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
  showText?: boolean;
}

export const BarcodeSVG: React.FC<BarcodeSVGProps> = ({
  value,
  height = 42,
  className = '',
  fgColor = '#0f172a',
  bgColor = 'transparent',
  showText = true,
}) => {
  const bars = React.useMemo(() => generateBarcode39Bars(value), [value]);

  let currentX = 10;
  const rects: { x: number; width: number; isBar: boolean }[] = [];
  for (const b of bars) {
    const width = b.isWide ? 2.5 : 1;
    if (b.isBar) {
      rects.push({ x: currentX, width, isBar: true });
    }
    currentX += width;
  }
  const totalWidth = currentX + 10;
  const barHeight = showText ? height - 14 : height;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        role="img"
        aria-label={`Barcode: ${value}`}
        viewBox={`0 0 ${totalWidth} ${height}`}
        style={{ width: '100%', maxHeight: height, shapeRendering: 'crispEdges' }}
      >
        <rect x="0" y="0" width={totalWidth} height={height} fill={bgColor} />
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y="2" width={r.width} height={barHeight} fill={fgColor} />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-widest font-bold uppercase text-neutral-800 -mt-1">
          {value}
        </span>
      )}
    </div>
  );
};
