import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";

type Severity = "info" | "warning" | "error" | "success";

interface AlertBannerProps {
    severity: Severity;
    title?: string;
    message: string;
    className?: string;
}

const config: Record<Severity, { icon: React.ElementType; classes: string }> = {
    info: { icon: Info, classes: "bg-blue-500/10 border-blue-500/30 text-blue-300" },
    warning: { icon: AlertTriangle, classes: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300" },
    error: { icon: AlertCircle, classes: "bg-red-500/10 border-red-500/30 text-red-300" },
    success: { icon: CheckCircle, classes: "bg-green-500/10 border-green-500/30 text-green-300" },
};

export default function AlertBanner({ severity, title, message, className }: AlertBannerProps) {
    const { icon: Icon, classes } = config[severity];
    return (
        <div className={cn("flex items-start gap-3 border rounded-lg px-4 py-3", classes, className)}>
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
                {title && <p className="text-sm font-semibold mb-0.5">{title}</p>}
                <p className="text-sm opacity-90">{message}</p>
            </div>
        </div>
    );
}
