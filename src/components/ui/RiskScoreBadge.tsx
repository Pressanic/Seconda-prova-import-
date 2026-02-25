import { cn, getRiskColor } from "@/lib/utils";

interface RiskScoreBadgeProps {
    score: number;
    level: string;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export default function RiskScoreBadge({ score, level, size = "md", showLabel = true }: RiskScoreBadgeProps) {
    const colors = getRiskColor(level);

    const levelLabels: Record<string, string> = {
        basso: "Basso",
        medio: "Medio",
        alto: "Alto",
        critico: "Critico",
    };

    const sizeClasses = {
        sm: "w-10 h-10 text-sm",
        md: "w-14 h-14 text-lg",
        lg: "w-20 h-20 text-2xl",
    };

    const pct = Math.min(100, Math.max(0, score));
    const r = size === "lg" ? 34 : size === "md" ? 24 : 16;
    const cx = size === "lg" ? 40 : size === "md" ? 28 : 20;
    const circumference = 2 * Math.PI * r;
    const dash = (pct / 100) * circumference;

    return (
        <div className={cn("flex items-center gap-2")}>
            <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
                <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox={`0 0 ${cx * 2} ${cx * 2}`}
                >
                    <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(51,65,85,0.5)" strokeWidth="3" />
                    <circle
                        cx={cx} cy={cx} r={r}
                        fill="none"
                        stroke={
                            level === "basso" ? "#16a34a" :
                                level === "medio" ? "#d97706" :
                                    level === "alto" ? "#f97316" : "#dc2626"
                        }
                        strokeWidth="3"
                        strokeDasharray={`${dash} ${circumference}`}
                        strokeLinecap="round"
                    />
                </svg>
                <span className={cn("font-bold relative z-10", colors.text,
                    size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-lg"
                )}>
                    {score}
                </span>
            </div>
            {showLabel && (
                <div>
                    <p className={cn("font-semibold text-xs uppercase tracking-wide", colors.text)}>
                        {levelLabels[level] ?? level}
                    </p>
                </div>
            )}
        </div>
    );
}
