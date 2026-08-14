// 5bit符号化 (ADR-002): A-Zとスペースの27文字を5ビットバイナリ文字列に写像する

export const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ "; // A=00000(0), Z=11001(25), space=11010(26)
export const BITS_PER_CHAR = 5;
export const MAX_TARGET_LEN = 20;

// エンコード方向は厳格に: 未知文字は黙って補正せず throw する (ADR-019)
// 寛容な入力補正は sanitize() に一元化されている
export function charToBin(char: string): string {
  const index = CHARS.indexOf(char);
  if (index === -1) {
    throw new Error(`charToBin: unsupported character: ${JSON.stringify(char)}`);
  }
  // eslint-disable-next-line no-magic-numbers
  return index.toString(2).padStart(BITS_PER_CHAR, "0");
}

export function binToChar(bin: string): string {
  const index = parseInt(bin, 2);
  // 0-26 are mapped, 27-31 are space as requested
  return CHARS[index] || " ";
}

export function encode(text: string): string {
  return [...text].map(charToBin).join("");
}

export function decode(bin: string): string {
  return Array.from({ length: bin.length / BITS_PER_CHAR }, (_, i) =>
    binToChar(bin.slice(i * BITS_PER_CHAR, i * BITS_PER_CHAR + BITS_PER_CHAR)),
  ).join("");
}

export function sanitize(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .slice(0, MAX_TARGET_LEN);
}
