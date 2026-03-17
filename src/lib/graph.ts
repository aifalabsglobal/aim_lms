type GraphTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GraphDateTime = {
  dateTime?: string;
  timeZone?: string;
};

type GraphItemBody = {
  contentType?: string;
  content?: string;
};

type GraphOrganizer = {
  emailAddress?: {
    name?: string;
    address?: string;
  };
};

type GraphOnlineMeetingRef = {
  id?: string;
  joinUrl?: string;
};

type GraphAttendee = {
  emailAddress?: {
    name?: string;
    address?: string;
  };
};

type GraphEvent = {
  id?: string;
  subject?: string;
  body?: GraphItemBody;
  start?: GraphDateTime;
  end?: GraphDateTime;
  webLink?: string;
  onlineMeetingUrl?: string;
  isOnlineMeeting?: boolean;
  organizer?: GraphOrganizer;
  attendees?: GraphAttendee[];
  onlineMeeting?: GraphOnlineMeetingRef;
};

type GraphEventsResponse = {
  value?: GraphEvent[];
  "@odata.nextLink"?: string;
};

type GraphEventCreateResponse = {
  id?: string;
  subject?: string;
  body?: GraphItemBody;
  webLink?: string;
  onlineMeetingUrl?: string;
  start?: GraphDateTime;
  end?: GraphDateTime;
};

export type TrainingCardItem = {
  id: string;
  title: string;
  startDateTime: string | null;
  endDateTime: string | null;
  timeZone: string | null;
  organizerName: string | null;
  organizerEmail: string | null;
  joinUrl: string | null;
  eventUrl: string | null;
};

export type TrainingParticipant = {
  name: string | null;
  email: string | null;
  role: "Organizer" | "Attendee";
  durationInSeconds: number | null;
};

export type TrainingRecordingItem = {
  id: string;
  title: string;
  startDateTime: string | null;
  endDateTime: string | null;
  timeZone: string | null;
  recordingUrl: string | null;
  eventUrl: string | null;
  source: "teams_artifact" | "event_link";
};

export type TrainingDetails = {
  training: TrainingCardItem;
  participants: TrainingParticipant[];
  recordings: TrainingRecordingItem[];
  diagnostics: TrainingDiagnostics;
};

export type TrainingRecordingDetails = {
  training: TrainingCardItem;
  recording: TrainingRecordingItem;
  participants: TrainingParticipant[];
  diagnostics: TrainingDiagnostics;
};

export type CreateMeetingInput = {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  attendeeEmails?: string[];
  ownerUserId?: string;
};

export type CreateMeetingResult = {
  id: string;
  title: string;
  joinUrl: string | null;
  eventUrl: string | null;
  ownerUserId: string;
  startDateTime: string | null;
  endDateTime: string | null;
};

export type EditMeetingDetails = {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
  ownerUserId: string;
};

export type UpdateMeetingInput = {
  meetingId: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  ownerUserId?: string;
};

export type TrainingDiagnostics = {
  onlineMeetingResolved: boolean;
  recordingSource: "teams_artifact" | "event_link" | "none";
  participantSource: "attendance_report" | "call_records" | "event_attendees" | "none";
  onlineMeetingOwnerUserId: string | null;
  meetingResolutionAttempts: string[];
  warnings: string[];
};

type GraphOnlineMeeting = {
  id?: string;
  joinWebUrl?: string;
};

type GraphOnlineMeetingsResponse = {
  value?: GraphOnlineMeeting[];
};

type GraphAttendanceReport = {
  id?: string;
};

type GraphAttendanceReportsResponse = {
  value?: GraphAttendanceReport[];
};

type GraphAttendanceRecord = {
  emailAddress?: string;
  role?: string;
  totalAttendanceInSeconds?: number;
  attendanceIntervals?: Array<{
    joinDateTime?: string;
    leaveDateTime?: string;
  }>;
  identity?: {
    displayName?: string;
    id?: string;
  };
};

type GraphAttendanceRecordsResponse = {
  value?: GraphAttendanceRecord[];
};

type GraphCallRecording = {
  id?: string;
  createdDateTime?: string;
  recordingContentUrl?: string;
  contentUrl?: string;
};

type GraphCallRecordingsResponse = {
  value?: GraphCallRecording[];
};

type GraphCallRecordSummary = {
  id?: string;
  startDateTime?: string;
  endDateTime?: string;
};

type GraphCallRecordsResponse = {
  value?: GraphCallRecordSummary[];
};

type GraphCallRecordParticipant = {
  id?: string;
  identity?: {
    user?: {
      id?: string;
      displayName?: string;
      userPrincipalName?: string;
    };
  };
  info?: {
    identity?: {
      user?: {
        id?: string;
        displayName?: string;
        userPrincipalName?: string;
      };
    };
  };
};

type GraphCallRecordParticipantsResponse = {
  value?: GraphCallRecordParticipant[];
};

type GraphUser = {
  id?: string;
  userPrincipalName?: string;
  mail?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function getMicrosoftGraphAccessToken(): Promise<string> {
  const tenantId = getRequiredEnv("AZURE_TENANT_ID");
  const clientId = getRequiredEnv("AZURE_CLIENT_ID");
  const clientSecret = getRequiredEnv("AZURE_CLIENT_SECRET");
  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default",
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const json = (await response.json()) as GraphTokenResponse;
  if (!response.ok || !json.access_token) {
    throw new Error(
      `Graph token request failed: ${json.error ?? "unknown_error"} ${
        json.error_description ?? ""
      }`.trim(),
    );
  }

  return json.access_token;
}

export async function getGraphAppAccessToken(): Promise<string> {
  return getMicrosoftGraphAccessToken();
}

function getTargetMailbox(): string {
  const admins = process.env.ADMIN_EMAILS ?? "";
  const first = admins
    .split(",")
    .map((entry) => entry.trim())
    .find(Boolean);
  if (!first) {
    throw new Error("Missing ADMIN_EMAILS mailbox for Graph query target");
  }
  return first;
}

export function getDefaultMeetingOwner(): string {
  return getTargetMailbox();
}

async function graphGet<T>(token: string, url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Prefer: 'outlook.timezone="UTC"',
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Graph request failed: ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}

async function graphPost<T>(token: string, url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: 'outlook.timezone="UTC"',
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Graph request failed: ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}

async function graphPostNoContent(
  token: string,
  url: string,
  body: unknown,
): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: 'outlook.timezone="UTC"',
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Graph request failed: ${response.status} ${text}`);
  }
}

async function graphPatchNoContent(
  token: string,
  url: string,
  body: unknown,
): Promise<void> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: 'outlook.timezone="UTC"',
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Graph request failed: ${response.status} ${text}`);
  }
}

async function graphDeleteNoContent(token: string, url: string): Promise<void> {
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Prefer: 'outlook.timezone="UTC"',
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Graph request failed: ${response.status} ${text}`);
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function getGraphContext() {
  return {
    mailbox: getTargetMailbox(),
  };
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) {
      continue;
    }
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(trimmed);
  }
  return result;
}

async function resolveUserIdentifiers(
  token: string,
  mailboxOrUserId: string,
): Promise<string[]> {
  try {
    const user = await graphGet<GraphUser>(
      token,
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        mailboxOrUserId,
      )}?$select=id,userPrincipalName,mail`,
    );
    return uniqueNonEmpty([
      user.id,
      user.userPrincipalName,
      user.mail,
      mailboxOrUserId,
    ]);
  } catch {
    return uniqueNonEmpty([mailboxOrUserId]);
  }
}

function mapEventToTraining(event: GraphEvent): TrainingCardItem | null {
  const id = event.id?.trim();
  if (!id) {
    return null;
  }

  return {
    id,
    title: event.subject?.trim() || "Untitled Training",
    startDateTime: event.start?.dateTime ?? null,
    endDateTime: event.end?.dateTime ?? null,
    timeZone: event.start?.timeZone ?? event.end?.timeZone ?? null,
    organizerName: event.organizer?.emailAddress?.name ?? null,
    organizerEmail: event.organizer?.emailAddress?.address ?? null,
    joinUrl: event.onlineMeetingUrl ?? null,
    eventUrl: event.webLink ?? null,
  };
}

function mapParticipantsFromEvent(event: GraphEvent): TrainingParticipant[] {
  const participants = [] as TrainingParticipant[];
  const seen = new Set<string>();

  const organizerEmail = event.organizer?.emailAddress?.address?.trim() ?? null;
  const organizerName = event.organizer?.emailAddress?.name?.trim() ?? null;
  if (organizerEmail || organizerName) {
    const key = organizerEmail?.toLowerCase() || organizerName || "organizer";
    seen.add(key);
    participants.push({
      name: organizerName,
      email: organizerEmail,
      role: "Organizer",
      durationInSeconds: null,
    });
  }

  for (const attendee of event.attendees ?? []) {
    const email = attendee.emailAddress?.address?.trim() ?? null;
    const name = attendee.emailAddress?.name?.trim() ?? null;
    const key = email?.toLowerCase() || name;
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    participants.push({
      name,
      email,
      role: "Attendee",
      durationInSeconds: null,
    });
  }

  return participants;
}

function isPastEvent(event: GraphEvent): boolean {
  if (!event.end?.dateTime) {
    return false;
  }
  const end = new Date(event.end.dateTime);
  if (Number.isNaN(end.getTime())) {
    return false;
  }
  return end.getTime() < Date.now();
}

function mapEventToRecording(event: GraphEvent): TrainingRecordingItem | null {
  const id = event.id?.trim();
  if (!id) {
    return null;
  }

  return {
    id: `event-${id}`,
    title: event.subject?.trim() || "Past Training Session",
    startDateTime: event.start?.dateTime ?? null,
    endDateTime: event.end?.dateTime ?? null,
    timeZone: event.start?.timeZone ?? event.end?.timeZone ?? null,
    recordingUrl: event.webLink ?? event.onlineMeetingUrl ?? null,
    eventUrl: event.webLink ?? null,
    source: "event_link",
  };
}

function getIsoMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString();
}

type FetchTrainingEventsOptions = {
  startFromIso?: string;
  maxPages?: number;
  top?: number;
};

async function fetchTrainingEvents(
  options: FetchTrainingEventsOptions = {},
): Promise<GraphEvent[]> {
  const token = await getMicrosoftGraphAccessToken();
  const { mailbox } = getGraphContext();
  const select =
    "id,subject,start,end,webLink,onlineMeetingUrl,isOnlineMeeting,organizer,attendees,onlineMeeting";

  const buildEventsUrl = (startFromIso?: string): string => {
    const params = new URLSearchParams();
    params.set("$top", String(options.top ?? 100));
    params.set("$orderby", "start/dateTime desc");
    params.set("$select", select);
    if (startFromIso) {
      const safeStart = startFromIso.replace(/'/g, "''");
      params.set("$filter", `start/dateTime ge '${safeStart}'`);
    }
    return `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      mailbox,
    )}/events?${params.toString()}`;
  };

  const readPages = async (initialUrl: string, maxPages: number): Promise<GraphEvent[]> => {
    let nextUrl: string | null = initialUrl;
    const allEvents: GraphEvent[] = [];
    const seenEventIds = new Set<string>();
    let pageCount = 0;

    while (nextUrl && pageCount < maxPages) {
      const page: GraphEventsResponse = await graphGet<GraphEventsResponse>(token, nextUrl);
      for (const event of page.value ?? []) {
        const eventId = event.id?.trim();
        if (eventId) {
          if (seenEventIds.has(eventId)) {
            continue;
          }
          seenEventIds.add(eventId);
        }
        allEvents.push(event);
      }

      nextUrl = page["@odata.nextLink"] ?? null;
      pageCount += 1;
    }

    return allEvents;
  };

  const maxPages = Math.max(1, options.maxPages ?? 10);

  try {
    return await readPages(buildEventsUrl(options.startFromIso), maxPages);
  } catch (error) {
    if (!options.startFromIso) {
      throw error;
    }

    const fallbackEvents = await readPages(
      buildEventsUrl(undefined),
      Math.min(maxPages, 6),
    );
    const fromBoundary = new Date(options.startFromIso);
    if (Number.isNaN(fromBoundary.getTime())) {
      return fallbackEvents;
    }
    return fallbackEvents.filter((event) => {
      const value = event.start?.dateTime;
      if (!value) {
        return false;
      }
      const start = new Date(value);
      return !Number.isNaN(start.getTime()) && start >= fromBoundary;
    });
  }
}

async function fetchTrainingEventById(trainingId: string): Promise<GraphEvent | null> {
  const token = await getMicrosoftGraphAccessToken();
  const { mailbox } = getGraphContext();
  try {
    return await graphGet<GraphEvent>(
      token,
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        mailbox,
      )}/events/${encodeURIComponent(
        trainingId,
      )}?$select=id,subject,start,end,webLink,onlineMeetingUrl,isOnlineMeeting,organizer,attendees,onlineMeeting`,
    );
  } catch {
    return null;
  }
}

async function resolveOnlineMeetingId(
  token: string,
  mailbox: string,
  event: GraphEvent,
): Promise<{
  meetingId: string | null;
  ownerUserId: string | null;
  attempts: string[];
}> {
  const attempts: string[] = [];
  const baseCandidates = uniqueNonEmpty([
    event.organizer?.emailAddress?.address,
    mailbox,
  ]);
  const resolvedCandidates: string[] = [];

  for (const candidate of baseCandidates) {
    const expanded = await resolveUserIdentifiers(token, candidate);
    resolvedCandidates.push(...expanded);
  }
  const candidateUsers = uniqueNonEmpty(resolvedCandidates);
  attempts.push(`User candidates for onlineMeetings lookup: ${candidateUsers.join(", ")}`);

  if (event.onlineMeeting?.id) {
    attempts.push("event.onlineMeeting.id present directly on event payload");
    return {
      meetingId: event.onlineMeeting.id,
      ownerUserId: candidateUsers[0] ?? null,
      attempts,
    };
  }

  const joinUrl = event.onlineMeeting?.joinUrl ?? event.onlineMeetingUrl;
  if (!joinUrl) {
    attempts.push(
      "No join URL on event (onlineMeeting.joinUrl/onlineMeetingUrl missing)",
    );
    return { meetingId: null, ownerUserId: null, attempts };
  }

  const safeJoinUrl = joinUrl.replace(/'/g, "''");
  const filter = encodeURIComponent(`JoinWebUrl eq '${safeJoinUrl}'`);
  for (const apiVersion of ["v1.0", "beta"]) {
    for (const userId of candidateUsers) {
      const url = `https://graph.microsoft.com/${apiVersion}/users/${encodeURIComponent(
        userId,
      )}/onlineMeetings?$filter=${filter}`;

      try {
        const data = await graphGet<GraphOnlineMeetingsResponse>(token, url);
        const meetingId = data.value?.[0]?.id ?? null;
        if (meetingId) {
          attempts.push(
            `Resolved via ${apiVersion} /users/${userId}/onlineMeetings (JoinWebUrl filter)`,
          );
          return { meetingId, ownerUserId: userId, attempts };
        }
        attempts.push(
          `No match via ${apiVersion} /users/${userId}/onlineMeetings (JoinWebUrl filter returned 0 rows)`,
        );
      } catch (error) {
        attempts.push(
          `Error calling ${apiVersion} /users/${userId}/onlineMeetings (JoinWebUrl filter): ${toErrorMessage(
            error,
          )}`,
        );
      }
    }
  }

  // Fallback: query event by ID and inspect onlineMeeting.id directly.
  const eventId = event.id?.trim();
  if (eventId) {
    for (const userId of candidateUsers) {
      const eventUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        userId,
      )}/events/${encodeURIComponent(
        eventId,
      )}?$select=id,onlineMeeting,onlineMeetingUrl,isOnlineMeeting,subject`;
      try {
        const eventData = await graphGet<GraphEvent>(token, eventUrl);
        if (eventData.onlineMeeting?.id) {
          attempts.push(`Resolved via /users/${userId}/events/{eventId} onlineMeeting.id`);
          return {
            meetingId: eventData.onlineMeeting.id,
            ownerUserId: userId,
            attempts,
          };
        }
        attempts.push(
          `No onlineMeeting.id via /users/${userId}/events/{eventId} (event exists but meeting data absent)`,
        );
      } catch (error) {
        attempts.push(
          `Error calling /users/${userId}/events/{eventId}: ${toErrorMessage(error)}`,
        );
      }
    }
  }

  return {
    meetingId: null,
    ownerUserId: candidateUsers[0] ?? null,
    attempts,
  };
}

function mapRecordingArtifactToItem(
  recording: GraphCallRecording,
  index: number,
): TrainingRecordingItem | null {
  const id = recording.id?.trim();
  if (!id) {
    return null;
  }

  const artifactUrl = recording.recordingContentUrl ?? recording.contentUrl ?? null;

  return {
    id: `artifact-${id}`,
    title: `Recording ${index + 1}`,
    startDateTime: recording.createdDateTime ?? null,
    endDateTime: null,
    timeZone: "UTC",
    recordingUrl: artifactUrl,
    eventUrl: null,
    source: "teams_artifact",
  };
}

async function fetchMeetingRecordings(
  token: string,
  mailbox: string,
  onlineMeetingId: string,
): Promise<{ recordings: TrainingRecordingItem[]; error: string | null }> {
  const url = `https://graph.microsoft.com/beta/users/${encodeURIComponent(
    mailbox,
  )}/onlineMeetings/${encodeURIComponent(onlineMeetingId)}/recordings?$top=200`;

  try {
    const data = await graphGet<GraphCallRecordingsResponse>(token, url);
    const recordings = (data.value ?? [])
      .map((recording, index) => mapRecordingArtifactToItem(recording, index))
      .filter((recording): recording is TrainingRecordingItem => Boolean(recording));
    return { recordings, error: null };
  } catch (error) {
    return {
      recordings: [],
      error: error instanceof Error ? error.message : "Unknown recordings error",
    };
  }
}

function normalizeRole(role: string | undefined): "Organizer" | "Attendee" {
  const normalized = (role ?? "").toLowerCase();
  return normalized.includes("organizer") ? "Organizer" : "Attendee";
}

function dedupeParticipants(
  participants: TrainingParticipant[],
): TrainingParticipant[] {
  const dedupedMap = new Map<string, TrainingParticipant>();
  for (const participant of participants) {
    const key = `${participant.email ?? ""}|${participant.name ?? ""}|${participant.role}`;
    const existing = dedupedMap.get(key);
    if (!existing) {
      dedupedMap.set(key, participant);
      continue;
    }

    const existingDuration = existing.durationInSeconds ?? 0;
    const incomingDuration = participant.durationInSeconds ?? 0;
    if (incomingDuration > existingDuration) {
      dedupedMap.set(key, participant);
    }
  }

  return Array.from(dedupedMap.values());
}

function deriveAttendanceSeconds(record: GraphAttendanceRecord): number | null {
  if (
    typeof record.totalAttendanceInSeconds === "number" &&
    Number.isFinite(record.totalAttendanceInSeconds)
  ) {
    return Math.max(0, Math.round(record.totalAttendanceInSeconds));
  }

  if (!record.attendanceIntervals?.length) {
    return null;
  }

  let total = 0;
  for (const interval of record.attendanceIntervals) {
    const join = interval.joinDateTime ? new Date(interval.joinDateTime) : null;
    const leave = interval.leaveDateTime ? new Date(interval.leaveDateTime) : null;
    if (!join || !leave) {
      continue;
    }
    if (Number.isNaN(join.getTime()) || Number.isNaN(leave.getTime())) {
      continue;
    }
    const seconds = Math.floor((leave.getTime() - join.getTime()) / 1000);
    if (seconds > 0) {
      total += seconds;
    }
  }

  return total > 0 ? total : null;
}

async function fetchMeetingAttendanceParticipants(
  token: string,
  mailbox: string,
  onlineMeetingId: string,
): Promise<{ participants: TrainingParticipant[]; error: string | null }> {
  const versionErrors: string[] = [];
  for (const version of ["v1.0", "beta"]) {
    const reportsUrl = `https://graph.microsoft.com/${version}/users/${encodeURIComponent(
      mailbox,
    )}/onlineMeetings/${encodeURIComponent(
      onlineMeetingId,
    )}/attendanceReports?$top=50`;

    try {
      const reports = await graphGet<GraphAttendanceReportsResponse>(token, reportsUrl);
      const participants: TrainingParticipant[] = [];

      for (const report of reports.value ?? []) {
        if (!report.id) {
          continue;
        }
        const recordsUrl = `https://graph.microsoft.com/${version}/users/${encodeURIComponent(
          mailbox,
        )}/onlineMeetings/${encodeURIComponent(
          onlineMeetingId,
        )}/attendanceReports/${encodeURIComponent(report.id)}/attendanceRecords?$top=1000`;

        const records = await graphGet<GraphAttendanceRecordsResponse>(
          token,
          recordsUrl,
        );

        for (const record of records.value ?? []) {
          participants.push({
            name: record.identity?.displayName ?? null,
            email: record.emailAddress ?? null,
            role: normalizeRole(record.role),
            durationInSeconds: deriveAttendanceSeconds(record),
          });
        }
      }

      return { participants: dedupeParticipants(participants), error: null };
    } catch (error) {
      versionErrors.push(
        `${version}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return {
    participants: [],
    error: versionErrors.join(" | "),
  };
}

function parseParticipantIdentity(participant: GraphCallRecordParticipant): {
  id: string | null;
  name: string | null;
  email: string | null;
} {
  const user =
    participant.identity?.user ??
    participant.info?.identity?.user ??
    null;

  return {
    id: user?.id ?? null,
    name: user?.displayName ?? null,
    email: user?.userPrincipalName ?? null,
  };
}

async function fetchParticipantsFromCallRecords(
  token: string,
  ownerUserId: string,
  startDateTime: string | null,
): Promise<{ participants: TrainingParticipant[]; error: string | null }> {
  if (!startDateTime) {
    return { participants: [], error: "Missing training startDateTime" };
  }

  const start = new Date(startDateTime);
  if (Number.isNaN(start.getTime())) {
    return { participants: [], error: "Invalid training startDateTime" };
  }

  // Fetch call records without query options because some tenants reject
  // `$top`/`$filter` on this endpoint; narrow candidates in application code.
  const from = new Date(start.getTime() - 12 * 60 * 60 * 1000).toISOString();
  const to = new Date(start.getTime() + 12 * 60 * 60 * 1000).toISOString();
  const recordsUrl = "https://graph.microsoft.com/v1.0/communications/callRecords";

  try {
    const records = await graphGet<GraphCallRecordsResponse>(token, recordsUrl);
    const candidates = (records.value ?? []).filter((record) => {
      if (!record.id || !record.startDateTime) {
        return false;
      }
      const recordStart = new Date(record.startDateTime);
      if (Number.isNaN(recordStart.getTime())) {
        return false;
      }
      return recordStart.toISOString() >= from && recordStart.toISOString() <= to;
    });
    if (candidates.length === 0) {
      return { participants: [], error: "No call records found in time window" };
    }

    // Pick nearest call record by start time.
    const nearest = candidates
      .map((record) => {
        const recordStart = record.startDateTime ? new Date(record.startDateTime) : null;
        const diff =
          recordStart && !Number.isNaN(recordStart.getTime())
            ? Math.abs(recordStart.getTime() - start.getTime())
            : Number.MAX_SAFE_INTEGER;
        return { record, diff };
      })
      .sort((a, b) => a.diff - b.diff)[0]?.record;

    if (!nearest?.id) {
      return { participants: [], error: "No suitable call record candidate" };
    }

    const participantsUrl = `https://graph.microsoft.com/v1.0/communications/callRecords/${encodeURIComponent(
      nearest.id,
    )}/participants`;
    const participantsResponse = await graphGet<GraphCallRecordParticipantsResponse>(
      token,
      participantsUrl,
    );

    const participants = (participantsResponse.value ?? [])
      .map((participant) => parseParticipantIdentity(participant))
      .filter((identity) => identity.name || identity.email)
      .map((identity) => ({
        name: identity.name,
        email: identity.email,
        role:
          identity.id && identity.id.toLowerCase() === ownerUserId.toLowerCase()
            ? ("Organizer" as const)
            : ("Attendee" as const),
        durationInSeconds: null,
      }));

    return { participants: dedupeParticipants(participants), error: null };
  } catch (error) {
    return {
      participants: [],
      error: error instanceof Error ? error.message : "Unknown callRecords error",
    };
  }
}

export async function fetchTeamsTrainings(): Promise<TrainingCardItem[]> {
  const events = await fetchTrainingEvents({
    startFromIso: getIsoMonthsAgo(4),
    maxPages: 10,
    top: 100,
  });
  return events
    .filter((event) => event.isOnlineMeeting || Boolean(event.onlineMeetingUrl))
    .map(mapEventToTraining)
    .filter((event): event is TrainingCardItem => Boolean(event));
}

export async function fetchTrainingDetails(
  trainingId: string,
): Promise<TrainingDetails> {
  const token = await getMicrosoftGraphAccessToken();
  const { mailbox } = getGraphContext();
  const trainingEvent = await fetchTrainingEventById(trainingId);

  if (!trainingEvent) {
    throw new Error("Training not found");
  }

  const training = mapEventToTraining(trainingEvent);
  if (!training) {
    throw new Error("Invalid training payload");
  }

  const normalizedSubject = (trainingEvent.subject ?? "").trim().toLowerCase();
  const onlineMeetingResolution = await resolveOnlineMeetingId(
    token,
    mailbox,
    trainingEvent,
  );
  const onlineMeetingId = onlineMeetingResolution.meetingId;
  const onlineMeetingOwnerUserId = onlineMeetingResolution.ownerUserId;
  const meetingResolutionAttempts = onlineMeetingResolution.attempts;
  const warnings: string[] = [];

  if (!onlineMeetingId || !onlineMeetingOwnerUserId) {
    warnings.push(
      "Could not resolve Teams onlineMeeting ID from this event. Check OnlineMeetings.Read.All permission, verify organizer mailbox access, and ensure this is a Teams meeting.",
    );
  }
  for (const attempt of meetingResolutionAttempts) {
    warnings.push(`Meeting resolution: ${attempt}`);
  }

  const recordingResult = onlineMeetingId && onlineMeetingOwnerUserId
    ? await fetchMeetingRecordings(
        token,
        onlineMeetingOwnerUserId,
        onlineMeetingId,
      )
    : { recordings: [], error: null };
  const artifactRecordings = recordingResult.recordings;
  if (recordingResult.error) {
    warnings.push(
      `Teams recording artifact endpoint failed. Check OnlineMeetingArtifact.Read.All permission and application access policy scope. Details: ${recordingResult.error}`,
    );
  }

  const relatedEvents = await fetchTrainingEvents({
    startFromIso: getIsoMonthsAgo(6),
    maxPages: 8,
    top: 100,
  });
  const fallbackEventRecordings = relatedEvents
    .filter((event) => {
      const sameSubject =
        (event.subject ?? "").trim().toLowerCase() === normalizedSubject;
      return sameSubject && isPastEvent(event);
    })
    .map(mapEventToRecording)
    .filter((event): event is TrainingRecordingItem => Boolean(event))
    .sort((a, b) => {
      const aTime = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
      const bTime = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
      return bTime - aTime;
    });

  const recordings =
    artifactRecordings.length > 0 ? artifactRecordings : fallbackEventRecordings;
  if (recordings.length === 0) {
    warnings.push(
      "No recordings found from Teams artifacts or past event links for this training.",
    );
  } else if (artifactRecordings.length === 0 && fallbackEventRecordings.length > 0) {
    warnings.push(
      "Using fallback event links instead of Teams recording artifacts. Grant OnlineMeetingArtifact.Read.All for direct recording artifacts.",
    );
  }

  const attendanceResult = onlineMeetingId
    && onlineMeetingOwnerUserId
    ? await fetchMeetingAttendanceParticipants(
        token,
        onlineMeetingOwnerUserId,
        onlineMeetingId,
      )
    : { participants: [], error: null };
  const attendanceParticipants = attendanceResult.participants;
  if (attendanceResult.error) {
    warnings.push(
      `Attendance report endpoint failed. Check OnlineMeetingArtifact.Read.All permission and confirm the owner is organizer/co-organizer. Details: ${attendanceResult.error}`,
    );
  }

  const callRecordsResult =
    attendanceParticipants.length === 0 && onlineMeetingOwnerUserId
      ? await fetchParticipantsFromCallRecords(
          token,
          onlineMeetingOwnerUserId,
          trainingEvent.start?.dateTime ?? null,
        )
      : { participants: [], error: null };
  const callRecordParticipants = callRecordsResult.participants;
  if (callRecordsResult.error) {
    warnings.push(
      `Call records participant fallback failed. Check CallRecords.Read.All permission. Details: ${callRecordsResult.error}`,
    );
  }

  const participants =
    attendanceParticipants.length > 0
      ? attendanceParticipants
      : callRecordParticipants.length > 0
      ? callRecordParticipants
      : mapParticipantsFromEvent(trainingEvent);
  if (participants.length === 0) {
    warnings.push("No participants were returned from attendance reports or event attendees.");
  } else if (attendanceParticipants.length === 0) {
    if (callRecordParticipants.length > 0) {
      warnings.push(
        "Using call records fallback for joined participants because attendance reports are blocked.",
      );
    } else {
      warnings.push(
        "Using event attendees fallback instead of joined attendees. Ensure OnlineMeetingArtifact.Read.All is consented and attendance reports are available for this meeting owner.",
      );
    }
  }

  const diagnostics: TrainingDiagnostics = {
    onlineMeetingResolved: Boolean(onlineMeetingId),
    recordingSource:
      artifactRecordings.length > 0
        ? "teams_artifact"
        : fallbackEventRecordings.length > 0
        ? "event_link"
        : "none",
    participantSource:
      attendanceParticipants.length > 0
        ? "attendance_report"
        : callRecordParticipants.length > 0
        ? "call_records"
        : participants.length > 0
        ? "event_attendees"
        : "none",
    onlineMeetingOwnerUserId,
    meetingResolutionAttempts,
    warnings,
  };

  return {
    training,
    participants,
    recordings,
    diagnostics,
  };
}

export async function fetchTrainingRecordingDetails(
  trainingId: string,
  recordingId: string,
): Promise<TrainingRecordingDetails> {
  const details = await fetchTrainingDetails(trainingId);
  const recording = details.recordings.find((item) => item.id === recordingId);
  if (!recording) {
    throw new Error("Recording not found");
  }

  return {
    training: details.training,
    recording,
    participants: details.participants,
    diagnostics: details.diagnostics,
  };
}

export async function createTeamsMeeting(
  input: CreateMeetingInput,
): Promise<CreateMeetingResult> {
  const token = await getMicrosoftGraphAccessToken();
  const ownerUserId = input.ownerUserId?.trim() || getTargetMailbox();
  const timeZone = input.timeZone?.trim() || "Asia/Kolkata";
  const attendeeEmails = uniqueNonEmpty(input.attendeeEmails ?? []);
  const description =
    input.description?.trim() || "Training session scheduled via AIM LMS.";
  const initialHtmlBody = buildMeetingInviteBodyHtml({
    title: input.title.trim(),
    description,
    startDateTime: input.startDateTime,
    endDateTime: input.endDateTime,
    joinUrl: null,
    eventUrl: null,
  });

  const eventBody = {
    subject: input.title.trim(),
    body: {
      contentType: "HTML",
      content: initialHtmlBody,
    },
    start: {
      dateTime: input.startDateTime,
      timeZone,
    },
    end: {
      dateTime: input.endDateTime,
      timeZone,
    },
    attendees: attendeeEmails.map((email) => ({
      emailAddress: { address: email },
      type: "required",
    })),
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
  };

  const created = await graphPost<GraphEventCreateResponse>(
    token,
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(ownerUserId)}/events`,
    eventBody,
  );

  if (!created.id) {
    throw new Error("Meeting creation returned an empty event id");
  }

  const joinUrl = created.onlineMeetingUrl ?? null;
  const eventUrl = created.webLink ?? null;
  const finalHtmlBody = buildMeetingInviteBodyHtml({
    title: created.subject?.trim() || input.title.trim(),
    description,
    startDateTime: created.start?.dateTime ?? input.startDateTime,
    endDateTime: created.end?.dateTime ?? input.endDateTime,
    joinUrl,
    eventUrl,
  });
  try {
    const sendUpdates = attendeeEmails.length > 0 ? "all" : "none";
    await graphPatchNoContent(
      token,
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        ownerUserId,
      )}/events/${encodeURIComponent(created.id)}?sendUpdates=${sendUpdates}`,
      {
        body: {
          contentType: "HTML",
          content: finalHtmlBody,
        },
      },
    );
  } catch {
    // Meeting is already created; email body update is best effort.
  }

  return {
    id: created.id,
    title: created.subject?.trim() || input.title.trim(),
    joinUrl,
    eventUrl,
    ownerUserId,
    startDateTime: created.start?.dateTime ?? null,
    endDateTime: created.end?.dateTime ?? null,
  };
}

export async function fetchMeetingForEdit(meetingId: string): Promise<EditMeetingDetails> {
  const token = await getMicrosoftGraphAccessToken();
  const ownerUserId = getTargetMailbox();
  const event = await graphGet<GraphEventCreateResponse>(
    token,
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      ownerUserId,
    )}/events/${encodeURIComponent(
      meetingId,
    )}?$select=id,subject,body,start,end,webLink,onlineMeetingUrl`,
  );

  const startDateTime = event.start?.dateTime?.trim();
  const endDateTime = event.end?.dateTime?.trim();
  if (!event.id || !startDateTime || !endDateTime) {
    throw new Error("Meeting payload is incomplete");
  }

  return {
    id: event.id,
    title: event.subject?.trim() || "Untitled Meeting",
    description: htmlToText(event.body?.content),
    startDateTime,
    endDateTime,
    timeZone: event.start?.timeZone || event.end?.timeZone || "Asia/Kolkata",
    ownerUserId,
  };
}

export async function updateTeamsMeeting(
  input: UpdateMeetingInput,
): Promise<CreateMeetingResult> {
  const token = await getMicrosoftGraphAccessToken();
  const ownerUserId = input.ownerUserId?.trim() || getTargetMailbox();
  const description = input.description?.trim() || "Training session updated via AIM LMS.";

  const existing = await graphGet<GraphEventCreateResponse>(
    token,
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      ownerUserId,
    )}/events/${encodeURIComponent(
      input.meetingId,
    )}?$select=id,subject,start,end,webLink,onlineMeetingUrl`,
  );

  const bodyHtml = buildMeetingInviteBodyHtml({
    title: input.title.trim(),
    description,
    startDateTime: input.startDateTime,
    endDateTime: input.endDateTime,
    joinUrl: existing.onlineMeetingUrl ?? null,
    eventUrl: existing.webLink ?? null,
  });

  await graphPatchNoContent(
    token,
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      ownerUserId,
    )}/events/${encodeURIComponent(input.meetingId)}?sendUpdates=all`,
    {
      subject: input.title.trim(),
      body: {
        contentType: "HTML",
        content: bodyHtml,
      },
      start: {
        dateTime: input.startDateTime,
        timeZone: input.timeZone?.trim() || "Asia/Kolkata",
      },
      end: {
        dateTime: input.endDateTime,
        timeZone: input.timeZone?.trim() || "Asia/Kolkata",
      },
    },
  );

  const updated = await graphGet<GraphEventCreateResponse>(
    token,
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      ownerUserId,
    )}/events/${encodeURIComponent(
      input.meetingId,
    )}?$select=id,subject,start,end,webLink,onlineMeetingUrl`,
  );

  if (!updated.id) {
    throw new Error("Meeting update returned an empty event id");
  }

  return {
    id: updated.id,
    title: updated.subject?.trim() || input.title.trim(),
    joinUrl: updated.onlineMeetingUrl ?? null,
    eventUrl: updated.webLink ?? null,
    ownerUserId,
    startDateTime: updated.start?.dateTime ?? null,
    endDateTime: updated.end?.dateTime ?? null,
  };
}

export async function deleteTeamsMeeting(
  meetingId: string,
  ownerUserId?: string,
): Promise<void> {
  const token = await getMicrosoftGraphAccessToken();
  const owner = ownerUserId?.trim() || getTargetMailbox();
  await graphDeleteNoContent(
    token,
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      owner,
    )}/events/${encodeURIComponent(meetingId)}?sendUpdates=all`,
  );
}

function formatForIst(value: string | null): string {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function htmlToText(html: string | undefined): string {
  if (!html) {
    return "";
  }
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMeetingInviteBodyHtml(input: {
  title: string;
  description: string;
  startDateTime: string | null;
  endDateTime: string | null;
  joinUrl: string | null;
  eventUrl: string | null;
}): string {
  const safeTitle = input.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeDescription = (input.description || "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const start = formatForIst(input.startDateTime);
  const end = formatForIst(input.endDateTime);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const joinUrl = input.joinUrl ?? input.eventUrl;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f7fb;padding:24px;">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5eaf1;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(90deg,#0f2b74,#2563eb);padding:20px 24px;color:#ffffff;">
        <div style="font-size:22px;font-weight:700;">AIM Technologies</div>
        <div style="font-size:14px;opacity:0.95;margin-top:6px;">AIM LMS Training Session</div>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 10px 0;font-size:20px;color:#0f172a;">${safeTitle}</h2>
        <p style="margin:0 0 16px 0;font-size:14px;color:#334155;line-height:1.6;">
          ${safeDescription || "You are invited to attend this training session on AIM LMS."}
        </p>
        <table style="width:100%;border-collapse:collapse;margin:8px 0 20px 0;">
          <tr>
            <td style="padding:6px 0;width:90px;color:#64748b;font-size:13px;">Start</td>
            <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${start} IST</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;">End</td>
            <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${end} IST</td>
          </tr>
        </table>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${
            joinUrl
              ? `<a href="${joinUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:11px 16px;border-radius:8px;font-size:14px;font-weight:600;">Join Meeting</a>`
              : ""
          }
          <a href="${appUrl}/trainings" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:11px 16px;border-radius:8px;font-size:14px;font-weight:600;">Open AIM LMS</a>
        </div>
      </div>
      <div style="padding:12px 24px;border-top:1px solid #e5eaf1;background:#f8fafc;color:#64748b;font-size:12px;">
        &copy; ${new Date().getFullYear()} AIM Technologies
      </div>
    </div>
  </div>`;
}

function buildAimTechnologiesInviteHtml(meeting: CreateMeetingResult): string {
  const joinUrl = meeting.joinUrl ?? meeting.eventUrl ?? "#";
  const safeTitle = meeting.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const start = formatForIst(meeting.startDateTime);
  const end = formatForIst(meeting.endDateTime);

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e6ebf2;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(90deg,#1f3c88,#2563eb);padding:20px 24px;color:#ffffff;">
        <div style="font-size:22px;font-weight:700;letter-spacing:0.3px;">AIM Technologies</div>
        <div style="font-size:14px;opacity:0.95;margin-top:4px;">AIM LMS Training Invitation</div>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 12px 0;color:#0f172a;font-size:20px;">${safeTitle}</h2>
        <p style="margin:0 0 14px 0;color:#334155;font-size:14px;line-height:1.6;">
          You are invited to join a training session on AIM LMS.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0 20px 0;">
          <tr>
            <td style="padding:8px 0;color:#475569;font-size:13px;width:120px;">Start</td>
            <td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${start} IST</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#475569;font-size:13px;">End</td>
            <td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${end} IST</td>
          </tr>
        </table>
        <a href="${joinUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
          Join Training
        </a>
        <p style="margin:18px 0 0 0;color:#64748b;font-size:12px;line-height:1.6;">
          If the button does not work, copy this link into your browser:<br/>
          <span style="color:#1d4ed8;">${joinUrl}</span>
        </p>
      </div>
      <div style="padding:14px 24px;border-top:1px solid #e6ebf2;background:#f8fafc;color:#64748b;font-size:12px;">
        &copy; ${new Date().getFullYear()} AIM Technologies. All rights reserved.
      </div>
    </div>
  </div>`;
}

export async function sendTrainingInviteEmails(
  meeting: CreateMeetingResult,
  attendeeEmails: string[],
): Promise<void> {
  const recipients = uniqueNonEmpty(attendeeEmails);
  if (recipients.length === 0) {
    return;
  }

  const token = await getMicrosoftGraphAccessToken();
  const subject = `AIM LMS Training Invite: ${meeting.title}`;
  const html = buildAimTechnologiesInviteHtml(meeting);
  const owner = meeting.ownerUserId;

  for (const recipient of recipients) {
    await graphPostNoContent(
      token,
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(owner)}/sendMail`,
      {
        message: {
          subject,
          body: {
            contentType: "HTML",
            content: html,
          },
          toRecipients: [
            {
              emailAddress: {
                address: recipient,
              },
            },
          ],
        },
        saveToSentItems: true,
      },
    );
  }
}
