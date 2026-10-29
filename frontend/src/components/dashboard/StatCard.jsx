import {
  Activity,
  BedDouble,
  CalendarDays,
  FlaskConical,
  HeartPulse,
  Hospital,
  Pill,
  Stethoscope,
  Users,
} from "lucide-react";

const ICONS = {
  patient: Users,
  patients: Users,
  doctor: Stethoscope,
  doctors: Stethoscope,
  appointment: CalendarDays,
  appointments: CalendarDays,
  bed: BedDouble,
  beds: BedDouble,
  laboratory: FlaskConical,
  lab: FlaskConical,
  pharmacy: Pill,
  medicine: Pill,
  emergency: HeartPulse,
  hospital: Hospital,
};

function getIcon(key) {
  const normalized = key.toLowerCase();

  const match = Object.keys(ICONS).find((item) =>
    normalized.includes(item)
  );

  return match ? ICONS[match] : Activity;
}

function formatLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return value.toLocaleString("en-IN");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

export default function StatCard({ label, value, index = 0 }) {
  const Icon = getIcon(label);

  const accents = [
    "from-cyan-400 to-blue-500",
    "from-blue-400 to-indigo-500",
    "from-indigo-400 to-violet-500",
    "from-teal-400 to-cyan-500",
  ];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-white/[0.055]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/[0.04] blur-2xl transition group-hover:bg-cyan-400/[0.08]" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#183B56]0">
            {formatLabel(label)}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-[#183B56]">
            {formatValue(value)}
          </p>

          <p className="mt-2 text-xs text-[#183B56]0">
            Live database value
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/60 p-3">
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>
      </div>

      <div
        className={`mt-5 h-0.5 w-16 rounded-full bg-gradient-to-r ${
          accents[index % accents.length]
        }`}
      />
    </div>
  );
}

export { formatLabel, formatValue };
