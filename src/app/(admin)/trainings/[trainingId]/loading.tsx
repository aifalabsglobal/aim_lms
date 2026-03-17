import StandardLoadingState from "@/components/common/StandardLoadingState";

export default function TrainingDetailsLoading() {
  return (
    <StandardLoadingState
      message="Loading training details from Microsoft Graph..."
      skeletons={["h-52 lg:col-span-2", "h-52"]}
    />
  );
}
