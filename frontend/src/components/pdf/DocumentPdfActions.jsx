import React, { useState } from "react";
import { Eye, FileDown } from "lucide-react";

const EXCLUDED = /token|password|secret|authorization|access_key|refresh_key/i;
const LABELS = {
  patient_id: "Patient ID", patient_name: "Patient", patient_number: "Patient Number",
  doctor_id: "Doctor ID", doctor_name: "Doctor", prescription_number: "Prescription Number",
  invoice_number: "Invoice Number", bill_number: "Bill Number", report_number: "Report Number",
  sample_number: "Sample Number", test_name: "Test", report_date: "Report Date",
  prescription_date: "Prescription Date", invoice_date: "Invoice Date", bill_date: "Bill Date",
  total_amount: "Total Amount", paid_amount: "Paid Amount", balance_amount: "Balance Amount",
  payment_status: "Payment Status", status: "Status", diagnosis: "Diagnosis",
  medicines: "Medicines", instructions: "Instructions", duration: "Duration",
  follow_up_date: "Follow-up Date", result: "Result", interpretation: "Interpretation",
  remarks: "Remarks", findings: "Findings", impression: "Impression", notes: "Notes",
  created_at: "Created At", reported_at: "Reported At", date: "Date",
};
const humanize = (key) => LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
function valueText(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(valueText).join(", ");
  if (typeof value === "object") return Object.entries(value).map(([k,v]) => `${humanize(k)}: ${valueText(v)}`).join("; ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function recordHtml(title, record, fields) {
  const entries = fields?.length
    ? fields.map(([label, value]) => [label, value])
    : Object.entries(record || {}).filter(([key, value]) =>
        !EXCLUDED.test(key) && value !== undefined && value !== null &&
        typeof value !== "function" && !["id", "uuid"].includes(key.toLowerCase())
      );
  const rows = entries.filter(([,value]) => value !== undefined && value !== null && !EXCLUDED.test(String(value)))
    .map(([label,value]) => `<tr><th>${esc(label)}</th><td>${esc(valueText(value))}</td></tr>`).join("");
  const date = new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short"}).format(new Date());
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:10pt/1.55 Arial,sans-serif;color:#172b45;margin:0}
  header{background:#123a55;color:white;padding:20px 24px;border-bottom:4px solid #20bfd0}header small{color:#9cecf1;letter-spacing:1.6px;text-transform:uppercase;font-weight:bold}
  h1{font-size:21pt;margin:8px 0 0} .meta{font-size:8pt;color:#63758a;padding:12px 0;border-bottom:1px solid #dce6ee;margin-bottom:18px}
  table{width:100%;border-collapse:collapse}th,td{padding:10px 12px;border:1px solid #dbe4ec;text-align:left;vertical-align:top;overflow-wrap:anywhere}
  th{width:32%;background:#f0f6fa;color:#29445c}tr{break-inside:avoid}footer{margin-top:24px;padding-top:10px;border-top:1px solid #dbe4ec;font-size:8pt;color:#65758a}
  @media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
  <header><small>Sanjeevni Tech · Smart Hospital</small><h1>${esc(title)}</h1></header>
  <div class="meta">Generated ${esc(date)} · Confidential — for authorized use only</div><table><tbody>${rows}</tbody></table>
  <footer>This document contains the selected record data displayed by Sanjeevni Tech. Handle according to hospital privacy policies.</footer></body></html>`;
}
export default function DocumentPdfActions({ title = "Hospital Document", record, fields, className = "" }) {
  const [busy,setBusy] = useState(false);
  if (!record || typeof record !== "object") return null;
  const exportDocument = (print) => {
    const html = recordHtml(title, record, fields);
    if (!print) {
      const url = URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));
      const tab = window.open(url,"_blank");
      if (!tab) { URL.revokeObjectURL(url); window.alert("Allow pop-ups for this hospital app and try again."); return; }
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }
    if (busy) return;
    setBusy(true);
    const frame = document.createElement("iframe");
    frame.title = "Save selected document as PDF";
    Object.assign(frame.style,{position:"fixed",width:"1px",height:"1px",right:"0",bottom:"0",opacity:"0",border:"0"});
    document.body.appendChild(frame);
    try {
      const doc = frame.contentDocument;
      if (!doc) throw new Error("Unable to prepare document.");
      doc.open(); doc.write(html); doc.close();
      window.setTimeout(() => {
        try { frame.contentWindow.focus(); frame.contentWindow.print(); }
        finally { window.setTimeout(() => { frame.remove(); setBusy(false); },1000); }
      },250);
    } catch (error) { frame.remove(); setBusy(false); window.alert(error?.message || "Unable to prepare PDF."); }
  };
  // Keep document actions visually aligned with the existing row-level actions.
  // Avoid a nested card/container: it unnecessarily widens the Actions column and
  // increases every table row's height across the application.
  const btn = "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-semibold leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";
  return <div className={`inline-flex max-w-full flex-nowrap items-center gap-1.5 ${className}`} data-no-pdf="true">
    <button type="button" title={`View ${title} as PDF`} aria-label={`View ${title} as PDF`} className={`${btn} border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800`} onClick={() => exportDocument(false)}><Eye size={14} strokeWidth={2} className="shrink-0"/> <span>View PDF</span></button>
    <button type="button" title={`Save ${title} as PDF`} aria-label={`Save ${title} as PDF`} className={`${btn} border-cyan-700 bg-cyan-700 text-white hover:border-cyan-800 hover:bg-cyan-800`} disabled={busy} onClick={() => exportDocument(true)}><FileDown size={14} strokeWidth={2} className="shrink-0"/> <span>{busy ? "Preparing…" : "Save PDF"}</span></button>
  </div>;
}
