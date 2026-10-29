import React from "react";
import { Loader2 } from "lucide-react";

export default function Loader({
    label = "Loading...",
    fullScreen = false,
}) {
    return (
        <div
            className={[
                "flex items-center justify-center gap-2",
                fullScreen ? "min-h-[calc(100vh-80px)]" : "py-10",
            ].join(" ")}
        >
            <Loader2
                size={22}
                className="animate-spin text-cyan-600"
            />
            <span className="text-sm font-semibold text-slate-500">
                {label}
            </span>
        </div>
    );
}
