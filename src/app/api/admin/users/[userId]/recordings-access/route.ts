import {
  addRecordingFolderAccess,
  fetchTrainingsRecordingFiles,
  listRecordingFolderAccess,
  removeRecordingFolderAccess,
} from "@/lib/graph";
import type { TrainingViewerContext } from "@/lib/graph";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ userId: string }>;
};

async function getRecordingsFolders() {
  const adminViewer: TrainingViewerContext = {
    email: null,
    role: "ADMIN",
    userId: null,
  };
  const recordings = await fetchTrainingsRecordingFiles(adminViewer);
  return recordings.items
    .filter((item) => item.kind === "folder")
    .map((item) => ({ id: item.id, name: item.name }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { userId } = await params;
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: normalizedUserId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user || !user.email) {
      return NextResponse.json({ message: "User with email not found" }, { status: 404 });
    }

    const folders = await getRecordingsFolders();
    const accessChecks = await Promise.all(
      folders.map(async (folder) => {
        const emails = await listRecordingFolderAccess(folder.id).catch(
          (): string[] => [],
        );
        const normalizedEmail = user.email?.trim().toLowerCase() ?? "";
        return {
          folderId: folder.id,
          hasAccess: normalizedEmail ? emails.includes(normalizedEmail) : false,
        };
      }),
    );

    return NextResponse.json({
      user,
      folders,
      selectedFolderIds: accessChecks.filter((item) => item.hasAccess).map((item) => item.folderId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load user folder access";
    if (message.toLowerCase() === "forbidden") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (message.toLowerCase() === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { userId } = await params;
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }

    const body = (await request.json()) as { folderIds?: unknown };
    const folderIds =
      body.folderIds && Array.isArray(body.folderIds)
        ? body.folderIds
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim())
            .filter(Boolean)
        : null;
    if (!folderIds) {
      return NextResponse.json({ message: "folderIds must be a string array" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: normalizedUserId },
      select: { id: true, email: true },
    });
    if (!user || !user.email) {
      return NextResponse.json({ message: "User with email not found" }, { status: 404 });
    }
    const userEmail = user.email.trim().toLowerCase();

    const folders = await getRecordingsFolders();
    const validFolderIds = new Set(folders.map((folder) => folder.id));
    const desiredFolderIds = Array.from(new Set(folderIds.filter((id) => validFolderIds.has(id))));

    const currentAccessChecks = await Promise.all(
      folders.map(async (folder) => {
        const emails = await listRecordingFolderAccess(folder.id).catch(
          (): string[] => [],
        );
        return {
          folderId: folder.id,
          hasAccess: emails.includes(userEmail),
        };
      }),
    );
    const currentFolderIds = currentAccessChecks
      .filter((item) => item.hasAccess)
      .map((item) => item.folderId);

    const currentSet = new Set(currentFolderIds);
    const desiredSet = new Set(desiredFolderIds);
    const toAdd = desiredFolderIds.filter((folderId) => !currentSet.has(folderId));
    const toRemove = currentFolderIds.filter((folderId) => !desiredSet.has(folderId));

    for (const folderId of toAdd) {
      await addRecordingFolderAccess(folderId, userEmail);
    }
    for (const folderId of toRemove) {
      await removeRecordingFolderAccess(folderId, userEmail);
    }

    const finalAccessChecks = await Promise.all(
      folders.map(async (folder) => {
        const emails = await listRecordingFolderAccess(folder.id).catch(
          (): string[] => [],
        );
        return {
          folderId: folder.id,
          hasAccess: emails.includes(userEmail),
        };
      }),
    );
    const selectedFolderIds = finalAccessChecks
      .filter((item) => item.hasAccess)
      .map((item) => item.folderId);

    return NextResponse.json({
      ok: true,
      selectedFolderIds,
      addedCount: toAdd.length,
      removedCount: toRemove.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update folder access";
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
