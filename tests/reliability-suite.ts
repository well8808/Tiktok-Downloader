import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { probeUrl } from "../app/actions/probe";

type Expect = "success" | "private_or_deleted" | "geo_blocked" | "invalid_url";

const CASES: Array<{ name: string; url: string; expect: Expect }> = [
  { name: "1 - vídeo curto público", url: "PASTE_PUBLIC_SHORT_URL_HERE", expect: "success" },
  { name: "2 - vídeo longo público", url: "PASTE_PUBLIC_LONG_URL_HERE", expect: "success" },
  { name: "3 - vídeo com música popular", url: "PASTE_MUSIC_URL_HERE", expect: "success" },
  { name: "4 - vídeo sem música original", url: "PASTE_NO_MUSIC_URL_HERE", expect: "success" },
  { name: "5 - slideshow", url: "PASTE_SLIDESHOW_URL_HERE", expect: "success" },
  { name: "6 - conta verificada", url: "PASTE_VERIFIED_URL_HERE", expect: "success" },
  { name: "7 - handle com chars especiais", url: "PASTE_SPECIAL_HANDLE_URL_HERE", expect: "success" },
  { name: "8 - vídeo privado", url: "PASTE_PRIVATE_URL_HERE", expect: "private_or_deleted" },
  { name: "9 - vídeo deletado", url: "PASTE_DELETED_URL_HERE", expect: "private_or_deleted" },
  { name: "10 - URL curta vm.tiktok", url: "PASTE_VM_SHORT_URL_HERE", expect: "success" },
  { name: "11 - URL com query share", url: "PASTE_URL_WITH_QUERY_HERE", expect: "success" },
  { name: "12 - caption não-ASCII", url: "PASTE_NON_ASCII_URL_HERE", expect: "success" },
  { name: "13 - URL random tiktok.com", url: "https://www.tiktok.com/random", expect: "invalid_url" },
  { name: "14 - URL de outro site", url: "https://youtube.com/watch?v=abc", expect: "invalid_url" },
  { name: "15 - URL malformada", url: "tiktok/@user/video/123", expect: "invalid_url" },
];

async function main() {
  const results: Array<{
    name: string;
    url: string;
    expected: Expect;
    got: string;
    pass: boolean;
  }> = [];
  for (const c of CASES) {
    const r = await probeUrl(c.url);
    const got = r.ok ? "success" : r.errorCode;
    const pass = got === c.expect;
    results.push({ name: c.name, url: c.url, expected: c.expect, got, pass });
    console.log(
      `${pass ? "[OK]" : "[XX]"} ${c.name} — expected ${c.expect}, got ${got}`,
    );
  }
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} passed`);
  mkdirSync(join(process.cwd(), "tests/runs"), { recursive: true });
  const file = join(process.cwd(), "tests/runs", `${Date.now()}.json`);
  writeFileSync(file, JSON.stringify({ ts: Date.now(), results }, null, 2));
  process.exit(passed >= 13 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
