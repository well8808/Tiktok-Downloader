import { spawn } from "node:child_process";
import { dirname } from "node:path";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return new Response("missing path", { status: 400 });
  spawn("explorer.exe", [dirname(path)], {
    detached: true,
    stdio: "ignore",
  }).unref();
  return new Response("ok");
}
