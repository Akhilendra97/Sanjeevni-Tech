import React from "react";
import { ChevronDown } from "lucide-react";

export default function Select({
    label,
    options = [],
    error,
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

            <div className="relative">
                <select
                    className={[
                        "w-full appearance-none rounded-xl border bg-white",
                        "px-3.5 py-2.5 pr-10 text-sm text-slate-900",
                        "outline-none transition",
                        error
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-200 focus:border-cyan-500",
                        className,
                    ].join(" ")}
                    {...props}
                >
                    {options.map((option) => {
                        const item =
                            typeof option === "string"
                                ? { label: option, value: option }
                                : option;

                        return (
                            <option
                                key={item.value}
                                value={item.value}
                            >
                                {item.label}
                            </option>
                        );
                    })}
                </select>

                <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
            </div>

            {error && (
                <p className="text-xs font-semibold text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
