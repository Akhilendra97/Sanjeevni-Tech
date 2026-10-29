import React from "react";
import { Loader2 } from "lucide-react";

const variants = {
    primary:
        "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm hover:from-cyan-600 hover:to-blue-700",
    secondary:
        "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger:
        "bg-red-600 text-white hover:bg-red-700",
    ghost:
        "text-slate-600 hover:bg-slate-100",
};

export default function Button({
    children,
    type = "button",
    variant = "primary",
    loading = false,
    disabled = false,
    className = "",
    ...props
}) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={[
                "inline-flex min-h-10 items-center justify-center gap-2",
                "rounded-xl px-4 py-2.5 text-sm font-bold",
                "transition-all disabled:cursor-not-allowed disabled:opacity-60",
                variants[variant] || variants.primary,
                className,
            ].join(" ")}
            {...props}
        >
            {loading && <Loader2 size={17} className="animate-spin" />}
            {children}
        </button>
    );
}
