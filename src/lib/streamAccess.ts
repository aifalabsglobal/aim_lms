import { createHmac, timingSafeEqual } from "crypto";

type StreamTokenPayload = {
  userId: string;
  sessionId: string;
  clientFingerprint: string;
  trainingId: string;
  recordingId: string;
  recordingSource: "teams_artifact" | "drive_file" | "event_link";
  recordingUrl: string;
  expiresAt: number;
};

function getStreamSigningSecret(): string {
  const explicitSecret = process.env.STREAM_SIGNING_SECRET?.trim();
  if (explicitSecret) {
    return explicitSecret;
  }

  const fallback = process.env.CLERK_SECRET_KEY?.trim();
  if (fallback) {
    return fallback;
  }

  throw new Error(
    "Missing STREAM_SIGNING_SECRET (or CLERK_SECRET_KEY fallback) for stream token signing",
  );
}

function buildTokenMessage(payload: StreamTokenPayload): string {
  return [
    payload.userId,
    payload.sessionId,
    payload.clientFingerprint,
    payload.trainingId,
    payload.recordingId,
    payload.recordingSource,
    payload.recordingUrl,
    String(payload.expiresAt),
  ].join(":");
}

export function createRecordingStreamSignature(payload: StreamTokenPayload): string {
  const secret = getStreamSigningSecret();
  const message = buildTokenMessage(payload);

  return createHmac("sha256", secret).update(message).digest("base64url");
}

export function verifyRecordingStreamSignature(
  payload: StreamTokenPayload,
  signature: string,
): boolean {
  try {
    const expected = createRecordingStreamSignature(payload);
    const provided = signature.trim();
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

type FingerprintHeaderValues = {
  userAgent: string;
  acceptLanguage: string;
  platform: string;
};

export function createClientFingerprint(values: FingerprintHeaderValues): string {
  const secret = getStreamSigningSecret();
  const raw = [
    values.userAgent.trim(),
    values.acceptLanguage.trim(),
    values.platform.trim(),
  ].join("|");
  return createHmac("sha256", secret).update(raw).digest("base64url");
}

export function createClientFingerprintFromHeaders(headers: Headers): string {
  return createClientFingerprint({
    userAgent: headers.get("user-agent") ?? "",
    acceptLanguage: headers.get("accept-language") ?? "",
    platform: headers.get("sec-ch-ua-platform") ?? "",
  });
}
