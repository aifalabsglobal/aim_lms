"use client";

import { useEffect, useMemo, useState } from "react";

type FolderAccessManagerProps = {
  folderId: string;
};

type AccessResponse = {
  emails: string[];
};

export default function FolderAccessManager({ folderId }: FolderAccessManagerProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(
    () => `/api/admin/recordings/folders/${encodeURIComponent(folderId)}/access`,
    [folderId],
  );

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        const data = (await response.json()) as AccessResponse & { message?: string };
        if (!response.ok) {
          throw new Error(data.message ?? "Failed to load access list");
        }
        if (isMounted) {
          setEmails(data.emails ?? []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load access list");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  async function addEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!email) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as AccessResponse & { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to add email");
      }
      setEmails(data.emails ?? []);
      setNewEmail("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to add email");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeEmail(email: string) {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as AccessResponse & { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to remove email");
      }
      setEmails(data.emails ?? []);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to remove email");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Manage Folder Access
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add allowed email addresses for this recordings folder.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="user@company.com"
            className="h-10 min-w-[280px] rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
          />
          <button
            type="button"
            onClick={addEmail}
            disabled={isSaving}
            className="inline-flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            Add Access
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Allowed Emails
        </h3>

        {isLoading ? (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        ) : emails.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            No explicit access configured yet.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {emails.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
              >
                <span className="text-sm text-gray-700 dark:text-gray-200">{email}</span>
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  disabled={isSaving}
                  className="inline-flex items-center rounded-lg border border-error-300 px-3 py-1.5 text-xs font-medium text-error-700 hover:bg-error-50 disabled:opacity-60 dark:border-error-600/40 dark:text-error-300 dark:hover:bg-error-500/10"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
