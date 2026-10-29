import React from "react";
import { Inbox } from "lucide-react";

export default function EmptyState({
    title = "No data found",
    description = "There is nothing to display here yet.",
    action = null,
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <Inbox size={25} />
            </div>

            <h3 className="mt-4 text-sm font-black text-slate-800">
                {title}
            </h3>

            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                {description}
            </p>

            {action && (
                <div className="mt-5">
                    {action}
                </div>
            )}
        </div>
    );
}
