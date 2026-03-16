import { fetchTrainingRecordingDetails, getGraphAppAccessToken } from "@/lib/graph";
import {
  createClientFingerprintFromHeaders,
  verifyRecordingStreamSignature,
} from "@/lib/streamAccess";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ trainingId: string; recordingId: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId, sessionId } = await auth();
    if (!userId || !sessionId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { trainingId, recordingId } = await params;
    const decodedTrainingId = decodeURIComponent(trainingId);
    const decodedRecordingId = decodeURIComponent(recordingId);
    const { searchParams } = new URL(request.url);
    const signature = searchParams.get("sig")?.trim() ?? "";
    const fingerprint = searchParams.get("fp")?.trim() ?? "";
    const expiresRaw = searchParams.get("expires")?.trim() ?? "";
    const expiresAt = Number.parseInt(expiresRaw, 10);

    if (!signature || !fingerprint || Number.isNaN(expiresAt)) {
      return NextResponse.json(
        { message: "Missing stream access signature" },
        { status: 403 },
      );
    }

    if (Date.now() > expiresAt) {
      return NextResponse.json({ message: "Stream link expired" }, { status: 403 });
    }

    const requestFingerprint = createClientFingerprintFromHeaders(request.headers);
    if (requestFingerprint !== fingerprint) {
      return NextResponse.json(
        { message: "Client fingerprint mismatch" },
        { status: 403 },
      );
    }

    const isValidSignature = verifyRecordingStreamSignature(
      {
        userId,
        sessionId,
        clientFingerprint: fingerprint,
        trainingId: decodedTrainingId,
        recordingId: decodedRecordingId,
        expiresAt,
      },
      signature,
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { message: "Invalid stream access signature" },
        { status: 403 },
      );
    }

    // Block direct URL navigation in a browser tab.
    // Allow only media-style fetches initiated by the in-page video element.
    const secFetchMode = request.headers.get("sec-fetch-mode") ?? "";
    const secFetchDest = request.headers.get("sec-fetch-dest") ?? "";
    if (secFetchMode.toLowerCase() === "navigate" || secFetchDest.toLowerCase() === "document") {
      return NextResponse.json(
        { message: "Direct tab navigation is not allowed for recording streams" },
        { status: 403 },
      );
    }

    const details = await fetchTrainingRecordingDetails(
      decodedTrainingId,
      decodedRecordingId,
    );
    const recordingUrl = details.recording.recordingUrl;

    if (!recordingUrl) {
      return NextResponse.json(
        { message: "Recording URL not available" },
        { status: 404 },
      );
    }

    // If this is not a Teams artifact stream, block direct redirect
    // so users can only view through in-app protected streaming.
    if (details.recording.source !== "teams_artifact") {
      return NextResponse.json(
        { message: "Recording is not available for in-app view-only playback" },
        { status: 403 },
      );
    }

    const upstreamHeaders: HeadersInit = {};
    const token = await getGraphAppAccessToken();
    upstreamHeaders.Authorization = `Bearer ${token}`;
    const range = request.headers.get("range");
    if (range) {
      upstreamHeaders.Range = range;
    }

    const response = await fetch(recordingUrl, {
      method: "GET",
      headers: upstreamHeaders,
      cache: "no-store",
    });

    if (!response.ok || !response.body) {
      const text = await response.text();
      return NextResponse.json(
        {
          message: "Unable to stream recording",
          details: `${response.status} ${text}`,
        },
        { status: 502 },
      );
    }

    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");
    const contentRange = response.headers.get("content-range");

    if (contentType) headers.set("content-type", contentType);
    if (contentLength) headers.set("content-length", contentLength);
    if (acceptRanges) headers.set("accept-ranges", acceptRanges);
    if (contentRange) headers.set("content-range", contentRange);
    headers.set("content-disposition", "inline");
    headers.set("cache-control", "no-store");

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Stream setup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
