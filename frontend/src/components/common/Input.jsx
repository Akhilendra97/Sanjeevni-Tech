import React from "react";

export default function Input({
    label,
    error,
    hint,
    required = false,
    className = "",
    ...props
}) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-bold text-slate-700">
                    {label}
                    {required && (
                        <span className="ml-1 text-red-500">*</span>
                    )}
                </label>
            )}

            <input
                className={[
                    "w-full rounded-xl border bg-white px-3.5 py-2.5",
                    "text-sm text-slate-900 outline-none transition",
                    "placeholder:text-slate-400",
                    error
                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50"
                        : "border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50",
                    className,
                ].join(" ")}
                {...props}
            />

            {error ? (
                <p className="text-xs font-semibold text-red-600">
                    {error}
                </p>
            ) : hint ? (
                <p className="text-xs text-slate-400">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}
