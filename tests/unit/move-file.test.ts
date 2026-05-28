import { describe, it, expect, afterEach } from "vitest";
import {
  writeFileSync,
  existsSync,
  readFileSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { moveFile } from "@/lib/paths";

const dirs: string[] = [];
function freshDir() {
  const d = join(tmpdir(), `ttdl-move-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(d, { recursive: true });
  dirs.push(d);
  return d;
}

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("moveFile", () => {
  it("moves a file within the same volume", () => {
    const dir = freshDir();
    const src = join(dir, "a.txt");
    const dest = join(dir, "b.txt");
    writeFileSync(src, "conteudo");
    moveFile(src, dest);
    expect(existsSync(src)).toBe(false);
    expect(existsSync(dest)).toBe(true);
    expect(readFileSync(dest, "utf-8")).toBe("conteudo");
  });

  it("overwrites destination if it exists", () => {
    const dir = freshDir();
    const src = join(dir, "a.txt");
    const dest = join(dir, "b.txt");
    writeFileSync(src, "novo");
    writeFileSync(dest, "antigo");
    moveFile(src, dest);
    expect(readFileSync(dest, "utf-8")).toBe("novo");
    expect(existsSync(src)).toBe(false);
  });

  it("throws on non-EXDEV errors (source missing)", () => {
    const dir = freshDir();
    expect(() =>
      moveFile(join(dir, "inexistente.txt"), join(dir, "x.txt")),
    ).toThrow();
  });
});
