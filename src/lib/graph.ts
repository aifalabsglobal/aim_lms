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
  seriesMasterId?: string;
  iCalUId?: string;
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

function getSortableDateMs(value: string | null): number {
  if (!value) {
    return Number.MIN_SAFE_INTEGER;
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.MIN_SAFE_INTEGER : time;
}

function mapDriveItemToMyFile(item: GraphDriveItem): MyFileItem | null {
  const id = item.id?.trim();
  if (!id) {
    return null;
  }
  const name = item.name?.trim() || "Untitled";
  const isFolder = Boolean(item.folder);
  const mimeType = item.file?.mimeType?.trim() ?? null;
  const lowerName = name.toLowerCase();
  const isVideo =
    !isFolder &&
    (Boolean(mimeType && mimeType.startsWith("video/")) ||
      [".mp4", ".mkv", ".webm", ".mov", ".m4v", ".avi", ".wmv"].some((ext) =>
        lowerName.endsWith(ext),
      ));
  return {
    id,
    name,
    kind: isFolder ? "folder" : "file",
    mimeType,
    isVideo,
    webUrl: item.webUrl ?? null,
    downloadUrl: item["@microsoft.graph.downloadUrl"] ?? null,
    modifiedAt: item.lastModifiedDateTime ?? item.createdDateTime ?? null,
    size: typeof item.size === "number" ? item.size : null,
    childCount: isFolder ? (item.folder?.childCount ?? null) : null,
  };
}

function getKeywordScore(name: string, keywords: string[]): number {
  if (keywords.length === 0) {
    return 0;
  }
  const normalizedName = normalizeSubjectForFamilyMatch(name);
  let score = 0;
  for (const keyword of keywords) {
    if (normalizedName.includes(keyword)) {
      score += 1;
    }
  }
  return score;
}

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
  source: "teams_artifact" | "event_link" | "drive_file";
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

export type TrainingViewerContext = {
  email: string | null;
  role: string | null;
  userId?: string | null;
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
  attendeeEmails: string[];
  ownerUserId: string;
};

export type UpdateMeetingInput = {
  meetingId: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  attendeeEmails?: string[];
  ownerUserId?: string;
};

export type TrainingDiagnostics = {
  onlineMeetingResolved: boolean;
  recordingSource: "teams_artifact" | "drive_file" | "event_link" | "none";
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

type GraphDriveItem = {
  id?: string;
  name?: string;
  webUrl?: string;
  size?: number;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  "@microsoft.graph.downloadUrl"?: string;
  parentReference?: {
    id?: string;
  };
  folder?: {
    childCount?: number;
  };
  file?: {
    mimeType?: string;
  };
};

type GraphDriveSearchResponse = {
  value?: GraphDriveItem[];
  "@odata.nextLink"?: string;
};

type GraphDriveChildrenResponse = {
  value?: GraphDriveItem[];
  "@odata.nextLink"?: string;
};

type GraphDrivePermission = {
  id?: string;
  invitation?: {
    email?: string;
  };
  grantedToV2?: {
    user?: {
      email?: string;
      userPrincipalName?: string;
    };
    siteUser?: {
      email?: string;
      userPrincipalName?: string;
    };
  };
  grantedTo?: {
    user?: {
      email?: string;
      userPrincipalName?: string;
    };
    siteUser?: {
      email?: string;
      userPrincipalName?: string;
    };
  };
  grantedToIdentitiesV2?: Array<{
    user?: {
      email?: string;
      userPrincipalName?: string;
    };
    siteUser?: {
      email?: string;
      userPrincipalName?: string;
    };
  }>;
  grantedToIdentities?: Array<{
    user?: {
      email?: string;
      userPrincipalName?: string;
    };
    siteUser?: {
      email?: string;
      userPrincipalName?: string;
    };
  }>;
};

type GraphInvitationResponse = {
  invitedUser?: {
    id?: string;
  };
};

type GraphDriveRecipient = {
  email?: string;
  objectId?: string;
};

type GraphDrivePermissionsResponse = {
  value?: GraphDrivePermission[];
  "@odata.nextLink"?: string;
};

type GraphDriveFolderMeta = {
  id?: string;
  name?: string;
  parentReference?: {
    id?: string;
  };
};

export type MyFileItem = {
  id: string;
  name: string;
  kind: "folder" | "file";
  mimeType: string | null;
  isVideo: boolean;
  webUrl: string | null;
  downloadUrl: string | null;
  modifiedAt: string | null;
  size: number | null;
  childCount: number | null;
};

export type MyFilesResult = {
  currentFolderId: string | null;
  currentFolderName: string;
  parentFolderId: string | null;
  items: MyFileItem[];
};

export type TrainingsRecordingFilesResult = {
  folderId: string | null;
  folderName: string;
  items: MyFileItem[];
};

export type TrainingRelatedFilesResult = {
  trainingId: string;
  trainingTitle: string;
  items: MyFileItem[];
  keywordHints: string[];
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

function getGraphErrorCode(error: unknown): string | null {
  const message = error instanceof Error ? error.message : "";
  const jsonStart = message.indexOf("{");
  if (jsonStart === -1) {
    return null;
  }
  try {
    const parsed = JSON.parse(message.slice(jsonStart)) as {
      error?: { code?: string };
    };
    const code = parsed.error?.code?.trim();
    return code ? code.toLowerCase() : null;
  } catch {
    return null;
  }
}

async function inviteExternalUserForSharing(token: string, email: string): Promise<boolean> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://portal.office.com";
  try {
    await graphPost<GraphInvitationResponse>(token, "https://graph.microsoft.com/v1.0/invitations", {
      invitedUserEmailAddress: email,
      inviteRedirectUrl: appUrl,
      sendInvitationMessage: false,
    });
    return true;
  } catch (error) {
    const message = toErrorMessage(error).toLowerCase();
    // Tenant may block guest invites or app may not have User.Invite.All.
    if (
      message.includes("insufficient privileges") ||
      message.includes("authorization_requestdenied") ||
      message.includes("forbidden")
    ) {
      throw new Error(
        "Cannot auto-invite external user. Grant Microsoft Graph application permission User.Invite.All and allow B2B guest invitations in Entra ID.",
      );
    }
    return false;
  }
}

async function resolveGraphUserObjectIdByEmail(
  token: string,
  email: string,
): Promise<string | null> {
  const escaped = email.replace(/'/g, "''");
  const url = `https://graph.microsoft.com/v1.0/users?$top=1&$select=id,mail,userPrincipalName&$filter=${encodeURIComponent(
    `mail eq '${escaped}' or userPrincipalName eq '${escaped}'`,
  )}`;
  try {
    const response = await graphGet<{ value?: GraphUser[] }>(token, url);
    const id = response.value?.[0]?.id?.trim();
    return id || null;
  } catch {
    return null;
  }
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

const ELIGIBLE_EMAILS_MARKER = "AIM_ELIGIBLE_EMAILS";

function parseEligibleEmailsFromBodyHtml(html: string | undefined): string[] {
  if (!html) {
    return [];
  }
  const markerRegex = new RegExp(`${ELIGIBLE_EMAILS_MARKER}:([^<\\n\\r]+)`, "i");
  const match = html.match(markerRegex) ?? htmlToText(html).match(markerRegex);
  if (!match?.[1]) {
    return [];
  }
  return uniqueNonEmpty(match[1].split(",").map((item) => item.trim()));
}

function getEligibleEmailsFromEvent(event: GraphEvent): string[] {
  const attendeeEmails = uniqueNonEmpty(
    (event.attendees ?? []).map((attendee) => attendee.emailAddress?.address ?? null),
  );
  const metadataEmails = parseEligibleEmailsFromBodyHtml(event.body?.content);
  return uniqueNonEmpty([...attendeeEmails, ...metadataEmails]);
}

function isPrivilegedRole(role: string | null): boolean {
  const normalized = (role ?? "").trim().toLowerCase();
  return normalized === "admin" || normalized === "super_admin";
}

function normalizeEmailAddress(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase().replace(/^mailto:/, "") ?? "";
  return normalized || null;
}

export async function isCourseFolderUnlockedForViewer(
  folderId: string,
  _folderName: string | null,
  viewer?: TrainingViewerContext,
): Promise<boolean> {
  if (isPrivilegedRole(viewer?.role ?? null)) {
    return true;
  }

  const normalizedFolderId = folderId.trim();
  const email = normalizeEmailAddress(viewer?.email);
  if (!normalizedFolderId || !email) {
    return false;
  }

  const token = await getMicrosoftGraphAccessToken();
  const ownerUserId = getTargetMailbox();
  const directEntries = await listFolderPermissionEntries(token, ownerUserId, normalizedFolderId).catch(
    (error): Array<{ id: string; email: string }> => {
      if (isLikelyGraphPermissionError(error)) {
        return [];
      }
      throw error;
    },
  );
  return directEntries.some((entry) => entry.email === email);
}

function canViewerAccessEvent(
  viewer: TrainingViewerContext | undefined,
  event: GraphEvent,
): boolean {
  if (!viewer) {
    return false;
  }
  if (isPrivilegedRole(viewer.role)) {
    return true;
  }

  const email = viewer.email?.trim().toLowerCase();
  if (!email) {
    return false;
  }

  const organizerEmail = event.organizer?.emailAddress?.address?.trim().toLowerCase();
  if (organizerEmail === email) {
    return true;
  }

  return getEligibleEmailsFromEvent(event).some((eligible) => eligible.toLowerCase() === email);
}

async function getAllowedFolderIdsForViewer(
  viewer: TrainingViewerContext | undefined,
  ownerUserId: string,
  token: string,
  folderIds: string[],
): Promise<Set<string>> {
  const allowed = new Set<string>();
  if (!viewer || isPrivilegedRole(viewer.role)) {
    folderIds.forEach((id) => allowed.add(id));
    return allowed;
  }
  if (folderIds.length === 0) {
    return allowed;
  }

  const permissionCache = createPermissionLookupCache();
  const checks = await mapWithConcurrency(
    folderIds,
    8,
    async (folderId): Promise<{ folderId: string; canAccess: boolean }> => {
      const canAccess = await isViewerAllowedForFolder(
        viewer,
        ownerUserId,
        token,
        folderId,
        permissionCache,
      );
      return { folderId, canAccess };
    },
  );
  for (const check of checks) {
    if (check.canAccess) {
      allowed.add(check.folderId);
    }
  }
  return allowed;
}

function extractEmailsFromPermission(permission: GraphDrivePermission): string[] {
  return uniqueNonEmpty([
    permission.invitation?.email,
    permission.grantedToV2?.user?.email,
    permission.grantedToV2?.user?.userPrincipalName,
    permission.grantedToV2?.siteUser?.email,
    permission.grantedToV2?.siteUser?.userPrincipalName,
    permission.grantedTo?.user?.email,
    permission.grantedTo?.user?.userPrincipalName,
    permission.grantedTo?.siteUser?.email,
    permission.grantedTo?.siteUser?.userPrincipalName,
    ...(permission.grantedToIdentitiesV2 ?? []).flatMap((entry) => [
      entry.user?.email ?? null,
      entry.user?.userPrincipalName ?? null,
      entry.siteUser?.email ?? null,
      entry.siteUser?.userPrincipalName ?? null,
    ]),
    ...(permission.grantedToIdentities ?? []).flatMap((entry) => [
      entry.user?.email ?? null,
      entry.user?.userPrincipalName ?? null,
      entry.siteUser?.email ?? null,
      entry.siteUser?.userPrincipalName ?? null,
    ]),
  ])
    .map((value) => normalizeEmailAddress(value))
    .filter((value): value is string => Boolean(value));
}

async function listFolderPermissionEntries(
  token: string,
  ownerUserId: string,
  folderId: string,
): Promise<Array<{ id: string; email: string }>> {
  let nextUrl: string | null = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
    ownerUserId,
  )}/drive/items/${encodeURIComponent(folderId)}/permissions?$top=200`;
  let pageCount = 0;
  const entries: Array<{ id: string; email: string }> = [];

  while (nextUrl && pageCount < 10) {
    const page: GraphDrivePermissionsResponse = await graphGet<GraphDrivePermissionsResponse>(
      token,
      nextUrl,
    );
    for (const permission of page.value ?? []) {
      const permissionId = permission.id?.trim();
      if (!permissionId) {
        continue;
      }
      const emails = extractEmailsFromPermission(permission);
      for (const email of emails) {
        entries.push({ id: permissionId, email });
      }
    }
    nextUrl = page["@odata.nextLink"] ?? null;
    pageCount += 1;
  }

  return entries;
}

function isLikelyGraphPermissionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("accessdenied") ||
    message.includes("forbidden") ||
    message.includes("insufficient privileges")
  );
}

type PermissionLookupCache = {
  permissionEntriesByFolderId: Map<string, Promise<Array<{ id: string; email: string }>>>;
  parentIdByFolderId: Map<string, Promise<string | null>>;
  viewerAllowanceByFolderAndEmail: Map<string, Promise<boolean>>;
};

function createPermissionLookupCache(): PermissionLookupCache {
  return {
    permissionEntriesByFolderId: new Map(),
    parentIdByFolderId: new Map(),
    viewerAllowanceByFolderAndEmail: new Map(),
  };
}

async function getFolderPermissionEntriesCached(
  token: string,
  ownerUserId: string,
  folderId: string,
  cache: PermissionLookupCache,
): Promise<Array<{ id: string; email: string }>> {
  const existing = cache.permissionEntriesByFolderId.get(folderId);
  if (existing) {
    return existing;
  }
  const pending = listFolderPermissionEntries(token, ownerUserId, folderId);
  cache.permissionEntriesByFolderId.set(folderId, pending);
  return pending;
}

async function getParentFolderIdCached(
  token: string,
  ownerUserId: string,
  folderId: string,
  cache: PermissionLookupCache,
): Promise<string | null> {
  const existing = cache.parentIdByFolderId.get(folderId);
  if (existing) {
    return existing;
  }
  const pending = graphGet<GraphDriveFolderMeta>(
    token,
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      ownerUserId,
    )}/drive/items/${encodeURIComponent(folderId)}?$select=id,parentReference`,
  )
    .then((meta) => meta.parentReference?.id?.trim() ?? null)
    .catch(() => null);
  cache.parentIdByFolderId.set(folderId, pending);
  return pending;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  const limit = Math.max(1, concurrency);
  let cursor = 0;

  const worker = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await mapper(items[index], index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      await worker();
    }),
  );
  return results;
}

async function isViewerAllowedForFolder(
  viewer: TrainingViewerContext | undefined,
  ownerUserId: string,
  token: string,
  folderId: string,
  cache: PermissionLookupCache = createPermissionLookupCache(),
): Promise<boolean> {
  if (!viewer) {
    return false;
  }
  if (isPrivilegedRole(viewer.role)) {
    return true;
  }

  const email = normalizeEmailAddress(viewer.email);
  if (!email) {
    return false;
  }
  const allowanceKey = `${folderId.toLowerCase()}|${email}`;
  const cachedAllowance = cache.viewerAllowanceByFolderAndEmail.get(allowanceKey);
  if (cachedAllowance) {
    return cachedAllowance;
  }

  const pendingAllowance = (async (): Promise<boolean> => {
    const directPermissions = await getFolderPermissionEntriesCached(
      token,
      ownerUserId,
      folderId,
      cache,
    ).catch((error) => {
      if (isLikelyGraphPermissionError(error)) {
        return null;
      }
      throw error;
    });

    if (directPermissions === null) {
      // If Graph does not allow reading permission entries, do not block listing;
      // the actual children/content requests will enforce real access server-side.
      return true;
    }
    if (directPermissions.some((entry) => entry.email === email)) {
      return true;
    }

    let currentId: string | null = folderId;
    let hops = 0;
    while (currentId && hops < 10) {
      const parentId = await getParentFolderIdCached(token, ownerUserId, currentId, cache);
      if (!parentId) {
        return false;
      }

      const inheritedPermissions = await getFolderPermissionEntriesCached(
        token,
        ownerUserId,
        parentId,
        cache,
      ).catch((error) => {
        if (isLikelyGraphPermissionError(error)) {
          return null;
        }
        throw error;
      });
      if (inheritedPermissions === null) {
        return true;
      }
      if (inheritedPermissions.some((entry) => entry.email === email)) {
        return true;
      }

      currentId = parentId;
      hops += 1;
    }

    return false;
  })();
  cache.viewerAllowanceByFolderAndEmail.set(allowanceKey, pendingAllowance);
  return pendingAllowance;
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
  endAtIso?: string;
  maxPages?: number;
  top?: number;
  select?: string;
  useCalendarView?: boolean;
};

async function fetchTrainingEvents(
  options: FetchTrainingEventsOptions = {},
): Promise<GraphEvent[]> {
  const token = await getMicrosoftGraphAccessToken();
  const { mailbox } = getGraphContext();
  const select =
    options.select ??
    "id,seriesMasterId,iCalUId,subject,start,end,webLink,onlineMeetingUrl,isOnlineMeeting,organizer,attendees,onlineMeeting";

  const buildEventsUrl = (startFromIso?: string): string => {
    const params = new URLSearchParams();
    params.set("$top", String(options.top ?? 100));
    params.set("$select", select);

    if (options.useCalendarView) {
      params.set("startDateTime", startFromIso ?? getIsoMonthsAgo(24));
      params.set("endDateTime", options.endAtIso ?? new Date().toISOString());
      return `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        mailbox,
      )}/calendarView?${params.toString()}`;
    }

    params.set("$orderby", "start/dateTime desc");
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
    if (!options.startFromIso || options.useCalendarView) {
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

async function fetchTrainingEventById(
  token: string,
  mailbox: string,
  trainingId: string,
): Promise<GraphEvent | null> {
  try {
    return await graphGet<GraphEvent>(
      token,
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        mailbox,
      )}/events/${encodeURIComponent(
        trainingId,
      )}?$select=id,seriesMasterId,iCalUId,subject,start,end,webLink,onlineMeetingUrl,isOnlineMeeting,organizer,attendees,onlineMeeting,body`,
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
    return {
      meetingId: null,
      ownerUserId: candidateUsers[0] ?? null,
      attempts,
    };
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

function normalizeForComparison(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeSubjectForFamilyMatch(value: string | null | undefined): string {
  return normalizeForComparison(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIsoToMs(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function getSubjectKeywords(subject: string | null | undefined): string[] {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that",
    "session",
    "meeting",
    "training",
    "teams",
    "aim",
    "lms",
  ]);
  return Array.from(
    new Set(
      normalizeSubjectForFamilyMatch(subject)
        .split(" ")
        .map((token) => token.trim())
        .filter((token) => token.length >= 4 && !stopWords.has(token)),
    ),
  );
}

function isLikelyRecordingFile(item: GraphDriveItem): boolean {
  const mime = normalizeForComparison(item.file?.mimeType);
  const name = normalizeForComparison(item.name);
  const videoExts = [".mp4", ".mkv", ".webm", ".mov", ".m4v"];
  return (
    mime.startsWith("video/") ||
    videoExts.some((ext) => name.endsWith(ext)) ||
    name.includes("recording")
  );
}

function mapDriveItemToRecording(
  ownerUserId: string,
  item: GraphDriveItem,
): TrainingRecordingItem | null {
  const id = item.id?.trim();
  if (!id) {
    return null;
  }

  const time = item.createdDateTime ?? item.lastModifiedDateTime ?? null;
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
    ownerUserId,
  )}/drive/items/${encodeURIComponent(id)}/content`;
  return {
    id: `drive-${id}`,
    title: item.name?.trim() || "Recording File",
    startDateTime: time,
    endDateTime: null,
    timeZone: "UTC",
    recordingUrl: url,
    eventUrl: item.webUrl ?? null,
    source: "drive_file",
  };
}

async function fetchDriveRecordingFiles(
  token: string,
  ownerUserId: string,
  trainingEvent: GraphEvent,
): Promise<{ recordings: TrainingRecordingItem[]; error: string | null }> {
  const keywords = getSubjectKeywords(trainingEvent.subject);
  const selectedStartMs = parseIsoToMs(trainingEvent.start?.dateTime ?? null);
  const minMs =
    selectedStartMs === null ? null : selectedStartMs - 1000 * 60 * 60 * 24 * 730;
  const maxMs =
    selectedStartMs === null ? null : selectedStartMs + 1000 * 60 * 60 * 24 * 30;

  const matched: TrainingRecordingItem[] = [];
  const seenIds = new Set<string>();

  const considerItem = (item: GraphDriveItem, requireKeywordMatch: boolean): void => {
    const mapped = mapDriveItemToRecording(ownerUserId, item);
    if (!mapped) {
      return;
    }
    if (seenIds.has(mapped.id)) {
      return;
    }
    if (!isLikelyRecordingFile(item)) {
      return;
    }

    const nameNorm = normalizeForComparison(item.name);
    const hasKeywordMatch =
      keywords.length === 0 || keywords.some((keyword) => nameNorm.includes(keyword));
    if (requireKeywordMatch && !hasKeywordMatch) {
      return;
    }

    const fileMs = parseIsoToMs(mapped.startDateTime);
    if (minMs !== null && maxMs !== null && fileMs !== null) {
      if (fileMs < minMs || fileMs > maxMs) {
        return;
      }
    }

    seenIds.add(mapped.id);
    matched.push(mapped);
  };

  try {
    // Strategy 1: indexed search (fast) with subject keyword guard.
    const params = new URLSearchParams();
    params.set("$top", "200");
    let nextUrl: string | null = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      ownerUserId,
    )}/drive/root/search(q='recording')?${params.toString()}`;
    let pages = 0;
    while (nextUrl && pages < 10) {
      const page: GraphDriveSearchResponse = await graphGet<GraphDriveSearchResponse>(
        token,
        nextUrl,
      );
      for (const item of page.value ?? []) {
        considerItem(item, true);
      }
      nextUrl = page["@odata.nextLink"] ?? null;
      pages += 1;
    }

    // Strategy 2: direct folder crawl where Teams usually stores recordings.
    // This handles cases where search indexing misses files.
    const rootPaths = ["Recordings", "Microsoft Teams Chat Files", "Meetings"];
    for (const rootPath of rootPaths) {
      const rootUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        ownerUserId,
      )}/drive/root:/${encodeURIComponent(rootPath)}:/children?$top=200`;
      try {
        const queue: Array<{ url: string; depth: number }> = [{ url: rootUrl, depth: 0 }];
        while (queue.length > 0) {
          const current = queue.shift();
          if (!current) {
            continue;
          }
          const page: GraphDriveChildrenResponse = await graphGet<GraphDriveChildrenResponse>(
            token,
            current.url,
          );
          for (const item of page.value ?? []) {
            if (item.folder?.childCount && current.depth < 3 && item.id) {
              queue.push({
                url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
                  ownerUserId,
                )}/drive/items/${encodeURIComponent(item.id)}/children?$top=200`,
                depth: current.depth + 1,
              });
            } else {
              // Folder-crawl matches are trusted; keyword can be missing in filenames.
              considerItem(item, false);
            }
          }
          const next = page["@odata.nextLink"] ?? null;
          if (next) {
            queue.push({ url: next, depth: current.depth });
          }
        }
      } catch {
        // Ignore missing folders and continue with other known roots.
      }
    }

    return { recordings: matched, error: null };
  } catch (error) {
    return {
      recordings: matched,
      error: error instanceof Error ? error.message : "Unknown drive search error",
    };
  }
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

export async function fetchMyFiles(
  folderId?: string,
  viewer?: TrainingViewerContext,
): Promise<MyFilesResult> {
  const token = await getMicrosoftGraphAccessToken();
  const ownerUserId = getTargetMailbox();
  const normalizedFolderId = folderId?.trim() || null;
  const items: MyFileItem[] = [];
  const seenIds = new Set<string>();

  if (normalizedFolderId && viewer && !isPrivilegedRole(viewer.role ?? null)) {
    const allowed = await isViewerAllowedForFolder(
      viewer,
      ownerUserId,
      token,
      normalizedFolderId,
    );
    if (!allowed) {
      throw new Error("Forbidden");
    }
  }

  let nextUrl = normalizedFolderId
    ? `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        ownerUserId,
      )}/drive/items/${encodeURIComponent(
        normalizedFolderId,
      )}/children?$top=200&$select=id,name,webUrl,size,createdDateTime,lastModifiedDateTime,folder,file,parentReference,@microsoft.graph.downloadUrl`
    : `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        ownerUserId,
      )}/drive/root/children?$top=200&$select=id,name,webUrl,size,createdDateTime,lastModifiedDateTime,folder,file,parentReference,@microsoft.graph.downloadUrl`;

  let pageCount = 0;
  while (nextUrl && pageCount < 10) {
    const page: GraphDriveChildrenResponse = await graphGet<GraphDriveChildrenResponse>(
      token,
      nextUrl,
    );
    for (const raw of page.value ?? []) {
      const mapped = mapDriveItemToMyFile(raw);
      if (!mapped || seenIds.has(mapped.id)) {
        continue;
      }
      seenIds.add(mapped.id);
      items.push(mapped);
    }
    nextUrl = page["@odata.nextLink"] ?? "";
    pageCount += 1;
  }

  let currentFolderName = "My Files";
  let parentFolderId: string | null = null;
  if (normalizedFolderId) {
    try {
      const folderMeta = await graphGet<GraphDriveFolderMeta>(
        token,
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
          ownerUserId,
        )}/drive/items/${encodeURIComponent(
          normalizedFolderId,
        )}?$select=id,name,parentReference`,
      );
      currentFolderName = folderMeta.name?.trim() || "Folder";
      parentFolderId = folderMeta.parentReference?.id?.trim() || null;
    } catch {
      currentFolderName = "Folder";
      parentFolderId = null;
    }
  }

  items.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === "folder" ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  if (!isPrivilegedRole(viewer?.role ?? null) && !normalizedFolderId) {
    const folderIds = items
      .filter((item) => item.kind === "folder")
      .map((item) => item.id);
    const allowedIds = await getAllowedFolderIdsForViewer(
      viewer,
      ownerUserId,
      token,
      folderIds,
    );
    const filtered = items.filter((item) => item.kind === "folder" && allowedIds.has(item.id));
    return {
      currentFolderId: normalizedFolderId,
      currentFolderName,
      parentFolderId,
      items: filtered,
    };
  }

  return {
    currentFolderId: normalizedFolderId,
    currentFolderName,
    parentFolderId,
    items,
  };
}

export async function fetchMyFileById(
  itemId: string,
  viewer?: TrainingViewerContext,
): Promise<MyFileItem> {
  const token = await getMicrosoftGraphAccessToken();
  const ownerUserId = getTargetMailbox();
  const normalizedItemId = itemId.trim();
  if (!normalizedItemId) {
    throw new Error("Invalid file id");
  }

  const raw = await graphGet<GraphDriveItem>(
    token,
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      ownerUserId,
    )}/drive/items/${encodeURIComponent(
      normalizedItemId,
    )}?$select=id,name,webUrl,size,createdDateTime,lastModifiedDateTime,folder,file,parentReference,@microsoft.graph.downloadUrl`,
  );
  const mapped = mapDriveItemToMyFile(raw);
  if (!mapped) {
    throw new Error("File not found");
  }
  if (!isPrivilegedRole(viewer?.role ?? null)) {
    const parentFolderId = raw.parentReference?.id?.trim() ?? null;
    if (!parentFolderId) {
      throw new Error("Forbidden");
    }

    const parentFolderMeta = await graphGet<GraphDriveFolderMeta>(
      token,
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        ownerUserId,
      )}/drive/items/${encodeURIComponent(parentFolderId)}?$select=id,name,parentReference`,
    );
    const isUnlocked = await isCourseFolderUnlockedForViewer(
      parentFolderId,
      parentFolderMeta.name ?? null,
      viewer,
    );
    if (!isUnlocked && mapped.isVideo) {
      const children = await fetchMyFiles(parentFolderId);
      const orderedVideos = children.items
        .filter((item) => item.kind === "file" && item.isVideo)
        .slice()
        .sort((a, b) => {
          const aTime = a.modifiedAt ? Date.parse(a.modifiedAt) : Number.POSITIVE_INFINITY;
          const bTime = b.modifiedAt ? Date.parse(b.modifiedAt) : Number.POSITIVE_INFINITY;
          const timeDiff =
            (Number.isNaN(aTime) ? Number.POSITIVE_INFINITY : aTime) -
            (Number.isNaN(bTime) ? Number.POSITIVE_INFINITY : bTime);
          if (timeDiff !== 0) {
            return timeDiff;
          }
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        });
      const previewVideoId = orderedVideos[0]?.id ?? null;
      if (!previewVideoId || previewVideoId !== mapped.id) {
        throw new Error("Locked: Ask an admin to grant folder access.");
      }
    }
  }
  return mapped;
}

export async function listRecordingFolderAccess(folderId: string): Promise<string[]> {
  const normalizedFolderId = folderId.trim();
  if (!normalizedFolderId) {
    return [];
  }
  const token = await getMicrosoftGraphAccessToken();
  const ownerUserId = getTargetMailbox();
  const entries = await listFolderPermissionEntries(token, ownerUserId, normalizedFolderId);
  return Array.from(new Set(entries.map((entry) => entry.email))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export async function addRecordingFolderAccess(
  folderId: string,
  email: string,
): Promise<string[]> {
  const normalizedFolderId = folderId.trim();
  const normalizedEmail = normalizeEmailAddress(email);
  if (!normalizedFolderId || !normalizedEmail) {
    throw new Error("Invalid folderId or email");
  }
  const token = await getMicrosoftGraphAccessToken();
  const ownerUserId = getTargetMailbox();
  const resolvedObjectId = await resolveGraphUserObjectIdByEmail(token, normalizedEmail);
  const recipient: GraphDriveRecipient = resolvedObjectId
    ? { objectId: resolvedObjectId }
    : { email: normalizedEmail };
  const existing = await listFolderPermissionEntries(token, ownerUserId, normalizedFolderId).catch(
    () => [],
  );
  if (existing.some((entry) => entry.email === normalizedEmail)) {
    return listRecordingFolderAccess(normalizedFolderId);
  }

  const inviteUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
    ownerUserId,
  )}/drive/items/${encodeURIComponent(normalizedFolderId)}/invite`;

  try {
    await graphPost(token, inviteUrl, {
      recipients: [recipient],
      requireSignIn: true,
      sendInvitation: false,
      roles: ["read"],
    });
  } catch (firstError) {
    const code = getGraphErrorCode(firstError);
    if (code === "sharingfailed") {
      try {
        await graphPost(token, inviteUrl, {
          recipients: [recipient],
          requireSignIn: true,
          sendInvitation: true,
          roles: ["read"],
        });
      } catch (secondError) {
        const secondCode = getGraphErrorCode(secondError);
        if (secondCode === "sharingfailed") {
          const invited = await inviteExternalUserForSharing(token, normalizedEmail);
          if (invited) {
            try {
              await graphPost(token, inviteUrl, {
                recipients: [{ email: normalizedEmail }],
                requireSignIn: true,
                sendInvitation: true,
                roles: ["read"],
              });
            } catch (thirdError) {
              const thirdCode = getGraphErrorCode(thirdError);
              if (thirdCode === "sharingfailed") {
                throw new Error(
                  `Sharing failed for ${normalizedEmail}. Tenant sharing policy is still blocking this user/domain.`,
                );
              }
              throw thirdError;
            }
          } else {
            throw new Error(
              `Sharing failed for ${normalizedEmail}. This email may be blocked by tenant sharing policy or not available as an allowed guest user.`,
            );
          }
        }
        throw secondError;
      }
    } else {
      throw firstError;
    }
  }
  return listRecordingFolderAccess(normalizedFolderId);
}

export async function removeRecordingFolderAccess(
  folderId: string,
  email: string,
): Promise<string[]> {
  const normalizedFolderId = folderId.trim();
  const normalizedEmail = normalizeEmailAddress(email);
  if (!normalizedFolderId || !normalizedEmail) {
    throw new Error("Invalid folderId or email");
  }
  const token = await getMicrosoftGraphAccessToken();
  const ownerUserId = getTargetMailbox();
  const entries = await listFolderPermissionEntries(token, ownerUserId, normalizedFolderId);
  const permissionIds = Array.from(
    new Set(
      entries
        .filter((entry) => entry.email === normalizedEmail)
        .map((entry) => entry.id),
    ),
  );
  for (const permissionId of permissionIds) {
    await graphDeleteNoContent(
      token,
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        ownerUserId,
      )}/drive/items/${encodeURIComponent(
        normalizedFolderId,
      )}/permissions/${encodeURIComponent(permissionId)}`,
    ).catch(() => {
      // Ignore undeletable permission rows (owner/system).
    });
  }
  return listRecordingFolderAccess(normalizedFolderId);
}

export async function fetchTrainingsRecordingFiles(
  viewer?: TrainingViewerContext,
): Promise<TrainingsRecordingFilesResult> {
  // Resolve Recordings folder from full root (unfiltered), then apply
  // per-user UI rules at page level.
  const root = await fetchMyFiles(undefined);
  const recordingsFolder = root.items.find(
    (item) => item.kind === "folder" && item.name.trim().toLowerCase() === "recordings",
  );

  if (!recordingsFolder) {
    return {
      folderId: null,
      folderName: "Recordings",
      items: [],
    };
  }

  const recordings = await fetchMyFiles(recordingsFolder.id, isPrivilegedRole(viewer?.role ?? null) ? viewer : undefined);

  return {
    folderId: recordingsFolder.id,
    folderName: recordings.currentFolderName || "Recordings",
    items: recordings.items,
  };
}

export async function fetchTrainingRelatedMyFiles(
  trainingId: string,
  viewer?: TrainingViewerContext,
): Promise<TrainingRelatedFilesResult> {
  const token = await getMicrosoftGraphAccessToken();
  const ownerUserId = getTargetMailbox();
  const trainingEvent = await fetchTrainingEventById(token, ownerUserId, trainingId);
  if (!trainingEvent) {
    throw new Error("Training not found");
  }
  if (!canViewerAccessEvent(viewer, trainingEvent)) {
    throw new Error("Forbidden");
  }

  const training = mapEventToTraining(trainingEvent);
  if (!training) {
    throw new Error("Invalid training payload");
  }

  const keywordHints = getSubjectKeywords(trainingEvent.subject);
  const folderSeeds = ["Recordings", "Microsoft Teams Chat Files", "Meetings"];
  const queue: Array<{ folderId: string; depth: number }> = [];
  const visitedFolders = new Set<string>();

  for (const seed of folderSeeds) {
    try {
      const folderMeta = await graphGet<GraphDriveItem>(
        token,
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
          ownerUserId,
        )}/drive/root:/${encodeURIComponent(seed)}?$select=id,name,folder`,
      );
      const seedId = folderMeta.id?.trim();
      if (seedId) {
        queue.push({ folderId: seedId, depth: 0 });
      }
    } catch {
      // Ignore missing seed folders.
    }
  }

  if (queue.length === 0) {
    queue.push({ folderId: "root", depth: 0 });
  }

  const scoredItems: Array<{ item: MyFileItem; score: number; modifiedMs: number }> = [];
  let scannedPages = 0;
  while (queue.length > 0 && scannedPages < 60) {
    const next = queue.shift();
    if (!next) {
      continue;
    }
    if (visitedFolders.has(next.folderId)) {
      continue;
    }
    visitedFolders.add(next.folderId);

    let nextUrl =
      next.folderId === "root"
        ? `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
            ownerUserId,
          )}/drive/root/children?$top=200&$select=id,name,webUrl,size,createdDateTime,lastModifiedDateTime,folder,file,parentReference,@microsoft.graph.downloadUrl`
        : `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
            ownerUserId,
          )}/drive/items/${encodeURIComponent(
            next.folderId,
          )}/children?$top=200&$select=id,name,webUrl,size,createdDateTime,lastModifiedDateTime,folder,file,parentReference,@microsoft.graph.downloadUrl`;

    let pageCountForFolder = 0;
    while (nextUrl && pageCountForFolder < 6 && scannedPages < 60) {
      const page: GraphDriveChildrenResponse = await graphGet<GraphDriveChildrenResponse>(
        token,
        nextUrl,
      );
      for (const raw of page.value ?? []) {
        const mapped = mapDriveItemToMyFile(raw);
        if (!mapped) {
          continue;
        }

        const score = getKeywordScore(mapped.name, keywordHints);
        if (score > 0) {
          const modifiedMs = parseIsoToMs(mapped.modifiedAt) ?? 0;
          scoredItems.push({ item: mapped, score, modifiedMs });
        }

        if (mapped.kind === "folder" && next.depth < 3) {
          queue.push({ folderId: mapped.id, depth: next.depth + 1 });
        }
      }

      nextUrl = page["@odata.nextLink"] ?? "";
      pageCountForFolder += 1;
      scannedPages += 1;
    }
  }

  const deduped = new Map<string, { item: MyFileItem; score: number; modifiedMs: number }>();
  for (const entry of scoredItems) {
    const existing = deduped.get(entry.item.id);
    if (!existing || entry.score > existing.score) {
      deduped.set(entry.item.id, entry);
    }
  }

  const items = Array.from(deduped.values())
    .sort((a, b) => {
      if (a.item.kind !== b.item.kind) {
        return a.item.kind === "folder" ? -1 : 1;
      }
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return b.modifiedMs - a.modifiedMs;
    })
    .slice(0, 120)
    .map((entry) => entry.item);

  return {
    trainingId: training.id,
    trainingTitle: training.title,
    items,
    keywordHints,
  };
}

export async function fetchTeamsTrainings(
  viewer?: TrainingViewerContext,
): Promise<TrainingCardItem[]> {
  const needsAttendees = !isPrivilegedRole(viewer?.role ?? null);
  const events = await fetchTrainingEvents({
    // List all available calendar meetings, not only a recent window.
    maxPages: 20,
    top: 100,
    select: needsAttendees
      ? "id,subject,start,end,webLink,onlineMeetingUrl,isOnlineMeeting,organizer,attendees,body"
      : "id,subject,start,end,webLink,onlineMeetingUrl,isOnlineMeeting,organizer",
  });
  return events
    .filter((event) => canViewerAccessEvent(viewer, event))
    .map(mapEventToTraining)
    .filter((event): event is TrainingCardItem => Boolean(event))
    .sort(
      (a, b) => getSortableDateMs(b.startDateTime) - getSortableDateMs(a.startDateTime),
    );
}

export async function fetchTrainingDetails(
  trainingId: string,
  viewer?: TrainingViewerContext,
): Promise<TrainingDetails> {
  const token = await getMicrosoftGraphAccessToken();
  const { mailbox } = getGraphContext();
  const trainingEvent = await fetchTrainingEventById(token, mailbox, trainingId);

  if (!trainingEvent) {
    throw new Error("Training not found");
  }
  if (!canViewerAccessEvent(viewer, trainingEvent)) {
    throw new Error("Forbidden");
  }

  const training = mapEventToTraining(trainingEvent);
  if (!training) {
    throw new Error("Invalid training payload");
  }

  const normalizedSubject = normalizeForComparison(trainingEvent.subject);
  const normalizedSubjectFamily = normalizeSubjectForFamilyMatch(trainingEvent.subject);
  const selectedSeriesMasterId = trainingEvent.seriesMasterId?.trim() ?? null;
  const selectedICalUId = normalizeForComparison(trainingEvent.iCalUId);
  const selectedJoinUrl = normalizeForComparison(
    trainingEvent.onlineMeeting?.joinUrl ?? trainingEvent.onlineMeetingUrl,
  );
  const selectedEventAccessible = canViewerAccessEvent(viewer, trainingEvent);
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

  const emptyResult = { recordings: [], error: null } as {
    recordings: TrainingRecordingItem[];
    error: string | null;
  };
  const emptyParticipantsResult = { participants: [], error: null } as {
    participants: TrainingParticipant[];
    error: string | null;
  };
  const [recordingResult, attendanceResult] =
    onlineMeetingId && onlineMeetingOwnerUserId
      ? await Promise.all([
          fetchMeetingRecordings(token, onlineMeetingOwnerUserId, onlineMeetingId),
          fetchMeetingAttendanceParticipants(token, onlineMeetingOwnerUserId, onlineMeetingId),
        ])
      : [emptyResult, emptyParticipantsResult];
  const artifactRecordings = recordingResult.recordings;
  if (recordingResult.error) {
    warnings.push(
      `Teams recording artifact endpoint failed. Check OnlineMeetingArtifact.Read.All permission and application access policy scope. Details: ${recordingResult.error}`,
    );
  }

  const driveRecordingsResult = await fetchDriveRecordingFiles(
    token,
    onlineMeetingOwnerUserId ?? mailbox,
    trainingEvent,
  );
  const driveRecordings = driveRecordingsResult.recordings;
  if (driveRecordingsResult.error) {
    warnings.push(
      `Drive recording fallback failed. Check Files.Read.All/Sites.Read.All permissions. Details: ${driveRecordingsResult.error}`,
    );
  }

  const relatedEvents = await fetchTrainingEvents({
    // Use calendarView so recurring instances are expanded and discoverable.
    startFromIso: getIsoMonthsAgo(24),
    endAtIso: new Date().toISOString(),
    useCalendarView: true,
    maxPages: 20,
    top: 100,
    select:
      "id,seriesMasterId,iCalUId,subject,start,end,webLink,onlineMeetingUrl,isOnlineMeeting,onlineMeeting,organizer,attendees,body",
  });
  const fallbackScanCount = relatedEvents.length;
  let matchedLineageCount = 0;
  let accessibleSiblingCount = 0;
  const fallbackEventRecordings = relatedEvents
    .filter((event) => {
      const eventSeriesMasterId = event.seriesMasterId?.trim() ?? null;
      const sameSeries =
        Boolean(selectedSeriesMasterId) &&
        (eventSeriesMasterId === selectedSeriesMasterId ||
          event.id?.trim() === selectedSeriesMasterId ||
          eventSeriesMasterId === trainingEvent.id?.trim());

      const eventICalUId = normalizeForComparison(event.iCalUId);
      const sameICal = Boolean(selectedICalUId) && eventICalUId === selectedICalUId;

      const eventJoinUrl = normalizeForComparison(
        event.onlineMeeting?.joinUrl ?? event.onlineMeetingUrl,
      );
      const sameJoinUrl = Boolean(selectedJoinUrl) && eventJoinUrl === selectedJoinUrl;

      const eventSubject = normalizeForComparison(event.subject);
      const sameSubject = eventSubject === normalizedSubject;
      const eventSubjectFamily = normalizeSubjectForFamilyMatch(event.subject);
      const sameSubjectFamily =
        normalizedSubjectFamily.length >= 8 &&
        eventSubjectFamily.length >= 8 &&
        (normalizedSubjectFamily.includes(eventSubjectFamily) ||
          eventSubjectFamily.includes(normalizedSubjectFamily));

      const matchesLineage =
        sameSeries || sameICal || sameJoinUrl || sameSubject || sameSubjectFamily;
      if (!matchesLineage) {
        return false;
      }
      matchedLineageCount += 1;

      // If the selected event is accessible, allow lineage-matched sibling events
      // even when attendee metadata is missing on those sibling instances.
      const canIncludeSibling =
        isPrivilegedRole(viewer?.role ?? null) ||
        canViewerAccessEvent(viewer, event) ||
        selectedEventAccessible;
      if (!canIncludeSibling) {
        return false;
      }
      accessibleSiblingCount += 1;

      return (
        isPastEvent(event) &&
        canIncludeSibling
      );
    })
    .map(mapEventToRecording)
    .filter((event): event is TrainingRecordingItem => Boolean(event));

  const recordingMap = new Map<string, TrainingRecordingItem>();
  for (const recording of [
    ...artifactRecordings,
    ...driveRecordings,
    ...fallbackEventRecordings,
  ]) {
    if (!recordingMap.has(recording.id)) {
      recordingMap.set(recording.id, recording);
    }
  }
  const recordings = Array.from(recordingMap.values()).sort((a, b) => {
    const aTime = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
    const bTime = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
    return bTime - aTime;
  });
  if (recordings.length === 0) {
    warnings.push(
      "No recordings found from Teams artifacts or past event links for this training.",
    );
  } else if (artifactRecordings.length === 0) {
    if (driveRecordings.length > 0) {
      warnings.push(
        "Using Drive/chat recording files fallback because Teams recording artifacts are unavailable.",
      );
    } else if (fallbackEventRecordings.length > 0) {
      warnings.push(
        "Using fallback event links instead of Teams recording artifacts. Grant OnlineMeetingArtifact.Read.All for direct recording artifacts.",
      );
    }
  }
  warnings.push(
    `Fallback scan stats: scanned=${fallbackScanCount}, lineageMatched=${matchedLineageCount}, accessEligible=${accessibleSiblingCount}, driveRecordings=${driveRecordings.length}, fallbackRecordings=${fallbackEventRecordings.length}, mergedRecordings=${recordings.length}`,
  );

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
        : driveRecordings.length > 0
        ? "drive_file"
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
  viewer?: TrainingViewerContext,
): Promise<TrainingRecordingDetails> {
  const details = await fetchTrainingDetails(trainingId, viewer);
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
    eligibleEmails: attendeeEmails,
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
    eligibleEmails: attendeeEmails,
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
  const event = await graphGet<GraphEvent>(
    token,
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      ownerUserId,
    )}/events/${encodeURIComponent(
      meetingId,
    )}?$select=id,subject,body,start,end,webLink,onlineMeetingUrl,attendees`,
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
    attendeeEmails: getEligibleEmailsFromEvent(event),
    ownerUserId,
  };
}

export async function updateTeamsMeeting(
  input: UpdateMeetingInput,
): Promise<CreateMeetingResult> {
  const token = await getMicrosoftGraphAccessToken();
  const ownerUserId = input.ownerUserId?.trim() || getTargetMailbox();
  const description = input.description?.trim() || "Training session updated via AIM LMS.";
  const attendeeEmails = uniqueNonEmpty(input.attendeeEmails ?? []);

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
    eligibleEmails: attendeeEmails,
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
      attendees: attendeeEmails.map((email) => ({
        emailAddress: { address: email },
        type: "required",
      })),
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
  eligibleEmails?: string[];
}): string {
  const safeTitle = input.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeDescription = (input.description || "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const start = formatForIst(input.startDateTime);
  const end = formatForIst(input.endDateTime);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const joinUrl = input.joinUrl ?? input.eventUrl;
  const eligibleEmails = uniqueNonEmpty(input.eligibleEmails ?? []);
  const eligibilityMetadata = `${ELIGIBLE_EMAILS_MARKER}:${eligibleEmails.join(",")}`;

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
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${eligibilityMetadata}
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
