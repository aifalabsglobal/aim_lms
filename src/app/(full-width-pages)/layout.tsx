import RouteTransition from "@/components/common/RouteTransition";

export default function FullWidthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <RouteTransition>{children}</RouteTransition>
    </div>
  );
}
