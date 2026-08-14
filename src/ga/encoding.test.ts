import { describe, it, expect } from "vitest";

import { CHARS, charToBin, binToChar, encode, decode, sanitize, MAX_TARGET_LEN } from "./encoding";

// ─── 定数 ───────────────────────────────────────────────────

describe("constants", () => {
  it("CHARS はA-Zとスペースの27文字", () => {
    expect(CHARS).toHaveLength(27);
    expect(CHARS).toContain(" ");
    for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      expect(CHARS).toContain(c);
    }
  });
});

// ─── charToBin / binToChar ──────────────────────────────────

describe("charToBin / binToChar", () => {
  it("charToBin('A') === '00000'", () => {
    expect(charToBin("A")).toBe("00000");
  });

  it("charToBin('Z') === '11001'", () => {
    expect(charToBin("Z")).toBe("11001");
  });

  it("charToBin(' ') === '11010'", () => {
    expect(charToBin(" ")).toBe("11010");
  });

  it("charToBin は未知文字で throw する（黙って補正しない）", () => {
    expect(() => charToBin("a")).toThrow();
    expect(() => charToBin("1")).toThrow();
    expect(() => charToBin("!")).toThrow();
  });

  it("binToChar('00000') === 'A'", () => {
    expect(binToChar("00000")).toBe("A");
  });

  it("binToChar('11001') === 'Z'", () => {
    expect(binToChar("11001")).toBe("Z");
  });

  it("binToChar('11010') === ' '", () => {
    expect(binToChar("11010")).toBe(" ");
  });

  it("binToChar('11111') === ' ' (index 31 はスペース)", () => {
    expect(binToChar("11111")).toBe(" ");
  });
});

// ─── encode / decode ────────────────────────────────────────

describe("encode / decode", () => {
  it("encode('A') === '00000'", () => {
    expect(encode("A")).toBe("00000");
  });

  it("decode('00000') === 'A'", () => {
    expect(decode("00000")).toBe("A");
  });

  it("encode/decode ラウンドトリップ（A-Z, スペース）", () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ";
    expect(decode(encode(chars))).toBe(chars);
  });
});

// ─── sanitize ───────────────────────────────────────────────

describe("sanitize", () => {
  it("小文字を大文字に変換する", () => {
    expect(sanitize("hello")).toBe("HELLO");
  });

  it("A-Z とスペース以外の文字を除去する", () => {
    expect(sanitize("HELLO123!world")).toBe("HELLOWORLD");
  });

  it("MAX_TARGET_LEN 文字に切り詰める", () => {
    expect(sanitize("ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toHaveLength(MAX_TARGET_LEN);
  });

  it("スペースは保持する", () => {
    expect(sanitize("HELLO WORLD")).toBe("HELLO WORLD");
  });
});
