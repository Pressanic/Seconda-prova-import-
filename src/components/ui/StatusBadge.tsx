import { cn, getStatoBadge } from "@/lib/utils";

export default function StatusBadge({ stato }: { stato: string }) {
    const { label, color } = getStatoBadge(stato);
    return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", color)}>
            {label}
        </span>
    );
}
