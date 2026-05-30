import type { NextRequest } from "next/server";
import { progressBus } from "@/lib/progress-bus";
import { db } from "@/lib/db";
import type { JobProgress } from "@/lib/downloader/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const { jobId } = params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: JobProgress) => {
        const terminal =
          data.status === "COMPLETED" ||
          data.status === "FAILED" ||
          data.status === "CANCELLED";
        const eventName = terminal ? "done" : "progress";
        controller.enqueue(encoder.encode(`event: ${eventName}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      const handler = (p: JobProgress) => {
        send(p);
        if (
          p.status === "COMPLETED" ||
          p.status === "FAILED" ||
          p.status === "CANCELLED"
        ) {
          progressBus.off(jobId, handler);
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      };
      progressBus.on(jobId, handler);

      const current = await db.job.findUnique({ where: { id: jobId } });
      if (current) {
        send({
          jobId,
          status: current.status as JobProgress["status"],
          percent: current.status === "COMPLETED" ? 100 : 0,
          message: current.errorMessage ?? undefined,
          filePath: current.filePath ?? undefined,
        });
        if (
          current.status === "COMPLETED" ||
          current.status === "FAILED" ||
          current.status === "CANCELLED"
        ) {
          progressBus.off(jobId, handler);
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
