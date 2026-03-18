import {
  addRecordingFolderAccess,
  listRecordingFolderAccess,
  removeRecordingFolderAccess,
} from "@/lib/graph";
import { requireRole } from "@/lib/auth";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ folderId: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { folderId } = await params;
    const decodedFolderId = decodeURIComponent(folderId).trim();
    const emails = await listRecordingFolderAccess(decodedFolderId);
    return NextResponse.json({ emails });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access load failed";
    if (message.toLowerCase() === "forbidden") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (message.toLowerCase() === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { folderId } = await params;
    const decodedFolderId = decodeURIComponent(folderId).trim();
    const payload = (await request.json()) as { email?: string };
    const email = payload.email?.trim() ?? "";
    const emails = await addRecordingFolderAccess(decodedFolderId, email);
    return NextResponse.json({ emails });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access update failed";
    if (message.toLowerCase() === "forbidden") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (message.toLowerCase() === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (message.toLowerCase().includes("invalid")) {
      return NextResponse.json({ message }, { status: 400 });
    }
    if (message.toLowerCase().includes("sharing failed")) {
      return NextResponse.json({ message }, { status: 400 });
    }
    if (message.toLowerCase().includes("cannot auto-invite external user")) {
      return NextResponse.json({ message }, { status: 400 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { folderId } = await params;
    const decodedFolderId = decodeURIComponent(folderId).trim();
    const payload = (await request.json()) as { email?: string };
    const email = payload.email?.trim() ?? "";
    const emails = await removeRecordingFolderAccess(decodedFolderId, email);
    return NextResponse.json({ emails });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access update failed";
    if (message.toLowerCase() === "forbidden") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (message.toLowerCase() === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (message.toLowerCase().includes("invalid")) {
      return NextResponse.json({ message }, { status: 400 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
