import React from "react";

const variants = {
    default: "bg-slate-100 text-slate-700",
    primary: "bg-blue-50 text-blue-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-cyan-50 text-cyan-700",
};

export default function Badge({
    children,
    variant = "default",
    className = "",
}) {
    return (
        <span
            className={[
                "inline-flex items-center rounded-full px-2.5 py-1",
                "text-xs font-bold",
                variants[variant] || variants.default,
                className,
            ].join(" ")}
        >
            {children}
        </span>
    );
}
