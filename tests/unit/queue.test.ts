import { describe, it, expect } from "vitest";
import { Queue } from "@/lib/queue";

describe("Queue", () => {
  it("runs up to N jobs concurrently", async () => {
    const q = new Queue(2);
    const inFlight: number[] = [];
    const peak = { value: 0 };
    const makeJob = (ms: number) => async () => {
      inFlight.push(1);
      peak.value = Math.max(peak.value, inFlight.length);
      await new Promise((r) => setTimeout(r, ms));
      inFlight.pop();
    };
    await Promise.all([
      q.add(makeJob(30)),
      q.add(makeJob(30)),
      q.add(makeJob(30)),
      q.add(makeJob(30)),
    ]);
    expect(peak.value).toBeLessThanOrEqual(2);
  });

  it("propagates errors per-job without halting queue", async () => {
    const q = new Queue(2);
    const results = await Promise.allSettled([
      q.add(async () => {
        throw new Error("boom");
      }),
      q.add(async () => "ok"),
    ]);
    expect(results[0]?.status).toBe("rejected");
    expect(results[1]?.status).toBe("fulfilled");
  });
});
