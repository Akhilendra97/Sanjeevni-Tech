import React from "react";
import { ChevronDown } from "lucide-react";

export default function Dropdown({
    trigger,
    children,
    align = "right",
}) {
    const [open, setOpen] = React.useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="inline-flex items-center gap-2"
            >
                {trigger}
                <ChevronDown size={15} className="text-slate-400" />
            </button>

            {open && (
                <>
                    <button
                        type="button"
                        aria-label="Close dropdown"
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 z-40 cursor-default"
                    />

                    <div
                        className={[
                            "absolute z-50 mt-2 min-w-[180px] rounded-xl",
                            "border border-slate-200 bg-white p-1.5 shadow-xl",
                            align === "left" ? "left-0" : "right-0",
                        ].join(" ")}
                        onClick={() => setOpen(false)}
                    >
                        {children}
                    </div>
                </>
            )}
        </div>
    );
}
