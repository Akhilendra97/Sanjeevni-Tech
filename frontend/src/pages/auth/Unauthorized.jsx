import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

function Unauthorized() {
  return (
    <main className="min-h-screen bg-[#020817] px-6 text-[#183B56]">
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
            <ShieldAlert size={30} />
          </div>

          <h1 className="mt-6 text-3xl font-bold">
            Access restricted
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#6B8094]">
            Your account does not have permission to access this
            section of Sanjeevni Tech.
          </p>

          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            <ArrowLeft size={17} />
            Return to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

export default Unauthorized;
