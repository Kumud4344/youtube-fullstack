import { EmptyState } from "@/components/ui/empty-state";

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#0f0f0f]">{title}</h1>
      <EmptyState title={`${title}`} description={description} />
    </div>
  );
}
