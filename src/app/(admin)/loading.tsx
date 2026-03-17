import StandardLoadingState from "@/components/common/StandardLoadingState";

export default function AdminLoading() {
  return (
    <StandardLoadingState
      message="Loading..."
      skeletons={["h-40", "h-40", "h-40"]}
    />
  );
}
