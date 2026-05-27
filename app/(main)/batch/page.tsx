"use client";

import { useState } from "react";
import { UrlListInput } from "@/components/batch/url-list-input";
import { JobList } from "@/components/batch/job-list";
import { startBatch } from "@/app/actions/batch";

export default function BatchPage() {
  const [jobIds, setJobIds] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-start justify-center p-6 pt-20">
      {!jobIds ? (
        <div className="w-full flex flex-col items-center">
          <UrlListInput
            onSubmit={async (text) => {
              const res = await startBatch(text);
              if (res.ok) setJobIds(res.jobIds);
              else setError(res.message);
            }}
          />
          {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        </div>
      ) : (
        <JobList jobIds={jobIds} />
      )}
    </div>
  );
}
