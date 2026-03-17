"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GraphRequestProgressBar from "./GraphRequestProgressBar";

type EditableMeeting = {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
  attendeeEmails: string[];
};

function toLocalDateTimeInputValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

export default function EditMeetingForm({ meeting }: { meeting: EditableMeeting }) {
  const router = useRouter();
  const defaultStart = useMemo(
    () => toLocalDateTimeInputValue(meeting.startDateTime),
    [meeting.startDateTime],
  );
  const defaultEnd = useMemo(
    () => toLocalDateTimeInputValue(meeting.endDateTime),
    [meeting.endDateTime],
  );

  const [title, setTitle] = useState(meeting.title);
  const [description, setDescription] = useState(meeting.description);
  const [startDateTime, setStartDateTime] = useState(defaultStart);
  const [endDateTime, setEndDateTime] = useState(defaultEnd);
  const [timeZone, setTimeZone] = useState(meeting.timeZone || "Asia/Kolkata");
  const [attendees, setAttendees] = useState((meeting.attendeeEmails ?? []).join(", "));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const attendeeEmails = attendees
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await fetch(
        `/api/admin/trainings/meetings/${encodeURIComponent(meeting.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            startDateTime,
            endDateTime,
            timeZone,
            attendeeEmails,
          }),
        },
      );

      const data = (await response.json()) as { message?: string; details?: string };
      if (!response.ok) {
        throw new Error(
          data.message
            ? `${data.message}${data.details ? `: ${data.details}` : ""}`
            : "Failed to update meeting",
        );
      }

      setSuccess("Meeting updated successfully.");
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
    >
      <GraphRequestProgressBar active={isSubmitting} label="Updating meeting in Microsoft Graph..." />
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Edit Teams Meeting
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Start</label>
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            required
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">End</label>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            required
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Time Zone</label>
          <input
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
            Eligible attendee emails (comma separated)
          </label>
          <input
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
            placeholder="user1@org.com, user2@org.com"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Only these attendees (plus organizers/admins) will be eligible to view this training.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Updating..." : "Update Meeting"}
      </button>
    </form>
  );
}
