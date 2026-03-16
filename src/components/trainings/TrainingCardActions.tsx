"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type Props = {
  trainingId: string;
};

export default function TrainingCardActions({ trainingId }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this meeting from Teams? This will notify attendees.",
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/trainings/meetings/${encodeURIComponent(trainingId)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { message?: string; details?: string };
      if (!response.ok) {
        throw new Error(
          data.message
            ? `${data.message}${data.details ? `: ${data.details}` : ""}`
            : "Failed to delete meeting",
        );
      }
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Link
        href={`/trainings/${encodeURIComponent(trainingId)}/edit`}
        className="inline-flex items-center rounded-lg border border-warning-300 px-3 py-2 text-xs font-medium text-warning-700 hover:bg-warning-50 dark:border-warning-500/40 dark:text-warning-300 dark:hover:bg-warning-500/10"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex items-center rounded-lg border border-error-300 px-3 py-2 text-xs font-medium text-error-700 hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-error-500/40 dark:text-error-300 dark:hover:bg-error-500/10"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
      {error && (
        <span className="text-xs text-error-600 dark:text-error-400">{error}</span>
      )}
    </>
  );
}
