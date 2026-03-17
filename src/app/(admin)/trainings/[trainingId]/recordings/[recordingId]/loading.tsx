import StandardLoadingState from "@/components/common/StandardLoadingState";

export default function RecordingLoading() {
  return (
    <StandardLoadingState
      message="Loading recording and attendance from Microsoft Graph..."
      skeletons={["h-72"]}
    />
  );
}
