"use client";

import React, { useMemo, useState } from "react";

type CreatedMeeting = {
  id: string;
  title: string;
  joinUrl: string | null;
  eventUrl: string | null;
  ownerUserId: string;
  startDateTime: string | null;
  endDateTime: string | null;
};

type CreateMeetingApiResponse = {
  meeting: CreatedMeeting;
  inviteWarning?: string | null;
};

function toLocalDateTimeInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

export default function CreateMeetingForm() {
  const now = useMemo(() => new Date(), []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDateTime, setStartDateTime] = useState(toLocalDateTimeInputValue(now));
  const [endDateTime, setEndDateTime] = useState(
    toLocalDateTimeInputValue(new Date(now.getTime() + 60 * 60 * 1000)),
  );
  const [timeZone, setTimeZone] = useState("Asia/Kolkata");
  const [attendees, setAttendees] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [createdMeeting, setCreatedMeeting] = useState<CreatedMeeting | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setWarning(null);
    setCreatedMeeting(null);

    try {
      const attendeeEmails = attendees
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await fetch("/api/admin/trainings/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startDateTime,
          endDateTime,
          timeZone,
          attendeeEmails,
        }),
      });

      const data = (await response.json()) as
        | { message?: string; details?: string }
        | CreateMeetingApiResponse;
      if (!response.ok) {
        const message =
          "message" in data && data.message
            ? `${data.message}${data.details ? `: ${data.details}` : ""}`
            : "Failed to create meeting";
        throw new Error(message);
      }

      if ("meeting" in data) {
        setCreatedMeeting(data.meeting);
        if (data.inviteWarning) {
          setWarning(`Meeting created, but invite email warning: ${data.inviteWarning}`);
        }
        setTitle("");
        setDescription("");
        setAttendees("");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Create Teams Training Meeting
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
              placeholder="AIM LMS - React Fundamentals"
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
              placeholder="Training agenda and notes"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
              Start
            </label>
            <input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
              End
            </label>
            <input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
              Time Zone
            </label>
            <input
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
              placeholder="UTC"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
              Attendees (comma separated emails)
            </label>
            <input
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
              placeholder="user1@org.com, user2@org.com"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
            {error}
          </div>
        )}
        {warning && (
          <div className="mt-4 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
            {warning}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Creating..." : "Create Meeting"}
        </button>
      </form>

      {createdMeeting && (
        <div className="rounded-2xl border border-success-200 bg-success-50 p-5 dark:border-success-500/30 dark:bg-success-500/10">
          <h3 className="text-base font-semibold text-success-800 dark:text-success-200">
            Meeting Created
          </h3>
          <p className="mt-1 text-sm text-success-700 dark:text-success-300">
            {createdMeeting.title}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {createdMeeting.joinUrl && (
              <a
                href={createdMeeting.joinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
              >
                Join Link
              </a>
            )}
            {createdMeeting.eventUrl && (
              <a
                href={createdMeeting.eventUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Event Link
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
