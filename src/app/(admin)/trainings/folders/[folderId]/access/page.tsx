import ProgressNavLink from "@/components/trainings/ProgressNavLink";
import FolderAccessManager from "@/components/trainings/FolderAccessManager";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

type FolderAccessPageProps = {
  params: Promise<{ folderId: string }>;
};

export default async function FolderAccessPage({ params }: FolderAccessPageProps) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { folderId } = await params;
  const decodedFolderId = decodeURIComponent(folderId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Folder Access
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Folder ID: {decodedFolderId}
          </p>
        </div>
        <ProgressNavLink
          href="/trainings"
          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Back to Trainings
        </ProgressNavLink>
      </div>

      <FolderAccessManager folderId={decodedFolderId} />
    </div>
  );
}
