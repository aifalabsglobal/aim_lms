import { auth } from "@clerk/nextjs/server";
import { fetchMyFileById, getDefaultMeetingOwner, getGraphAppAccessToken } from "@/lib/graph";
import { getCurrentAppUser } from "@/lib/auth";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ itemId: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId, sessionId } = await auth();
    if (!userId || !sessionId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;
    const decodedItemId = decodeURIComponent(itemId).trim();
    if (!decodedItemId) {
      return NextResponse.json({ message: "Invalid item id" }, { status: 400 });
    }

    const secFetchMode = request.headers.get("sec-fetch-mode") ?? "";
    const secFetchDest = request.headers.get("sec-fetch-dest") ?? "";
    if (secFetchMode.toLowerCase() === "navigate" || secFetchDest.toLowerCase() === "document") {
      return NextResponse.json(
        { message: "Direct tab navigation is not allowed for file streams" },
        { status: 403 },
      );
    }

    const appUser = await getCurrentAppUser();
    await fetchMyFileById(decodedItemId, {
      email: appUser?.email ?? null,
      role: appUser?.role ?? null,
      userId: appUser?.id ?? null,
    });

    const ownerUserId = getDefaultMeetingOwner();
    const token = await getGraphAppAccessToken();
    const range = request.headers.get("range");
    const upstreamHeaders: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };
    if (range) {
      upstreamHeaders.Range = range;
    }

    const upstreamUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      ownerUserId,
    )}/drive/items/${encodeURIComponent(decodedItemId)}/content`;
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: upstreamHeaders,
      cache: "no-store",
    });

    if (!response.ok || !response.body) {
      const text = await response.text();
      return NextResponse.json(
        { message: "Unable to stream file", details: `${response.status} ${text}` },
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
    if (acceptRanges) {
      headers.set("accept-ranges", acceptRanges);
    } else {
      headers.set("accept-ranges", "bytes");
    }
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
        message: "File stream setup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
