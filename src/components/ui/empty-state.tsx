import { cn } from "@/utils/cn";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "py-12 text-left sm:text-left",
        className,
      )}
    >
      <p className="text-base font-normal text-[#0f0f0f]">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-[#606060]">{description}</p>
      ) : null}
    </div>
  );
}
