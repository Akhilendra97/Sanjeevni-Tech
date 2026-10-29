import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
    title,
    subtitle,
    onClose,
    children,
}) {
    useEffect(() => {
        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

        window.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.body.style.overflow =
                previousOverflow;

            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [onClose]);

    return (
        <div
            className="modal-overlay fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#020b14]/80 px-3 py-4 backdrop-blur-md sm:px-5 sm:py-6 lg:py-8"
            role="dialog"
            aria-modal="true"
            aria-label={title || "Dialog"}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose?.();
                }
            }}
        >
            <div
                className="
                    modal-panel
                    relative
                    my-auto
                    flex
                    w-full
                    max-w-5xl
                    flex-col
                    overflow-hidden
                    rounded-3xl
                    border
                    border-[#31566d]/50
                    bg-[#071827]
                    text-[#edf8fc]
                    shadow-[0_35px_100px_rgba(0,0,0,0.65)]
                    ring-1
                    ring-cyan-400/[0.04]
                "
                onMouseDown={(event) => {
                    event.stopPropagation();
                }}
            >
                {/* HEADER */}
                <div
                    className="
                        flex
                        shrink-0
                        items-start
                        justify-between
                        gap-5
                        border-b
                        border-[#31566d]/35
                        bg-gradient-to-r
                        from-[#0b2437]
                        via-[#0a1e30]
                        to-[#081a29]
                        px-5
                        py-5
                        sm:px-7
                        sm:py-6
                    "
                >
                    <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(8,200,232,0.55)]" />

                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                                Hospital Operations
                            </span>
                        </div>

                        <h2 className="text-xl font-extrabold tracking-tight text-[#183B56] sm:text-2xl">
                            {title}
                        </h2>

                        {subtitle && (
                            <p className="mt-1.5 max-w-2xl text-sm leading-5 text-[#88a8bb]">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            border
                            border-[#31566d]/45
                            bg-white/[0.035]
                            text-[#8eacbc]
                            transition
                            hover:border-cyan-400/30
                            hover:bg-cyan-400/[0.08]
                            hover:text-[#183B56]
                        "
                    >
                        <X size={19} />
                    </button>
                </div>

                {/* BODY */}
                <div
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                        bg-gradient-to-b
                        from-[#071827]
                        to-[#061521]
                        px-5
                        py-5
                        sm:px-7
                        sm:py-6
                    "
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
