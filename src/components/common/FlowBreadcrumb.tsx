import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type FlowBreadcrumbProps = {
  items: BreadcrumbItem[];
};

export default function FlowBreadcrumb({ items }: FlowBreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 && <span>/</span>}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-medium text-gray-700 dark:text-gray-200" : ""}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
