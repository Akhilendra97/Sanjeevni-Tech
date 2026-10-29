import React, { useCallback, useState } from "react";
import { Eye, FileDown, LoaderCircle } from "lucide-react";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

function buildPrintablePage() {
  const source = document.querySelector("main");
  if (!source) throw new Error("No page content is available to export.");
  const clone = source.cloneNode(true);
  clone.querySelectorAll(".universal-pdf-actions, button, input, select, textarea, [role='dialog'], [data-no-pdf]").forEach((node) => node.remove());
  clone.querySelectorAll("svg").forEach((node) => node.remove());
  const title = document.querySelector("main h1")?.textContent?.trim()
    || document.querySelector("main h2")?.textContent?.trim()
    || document.title || "Hospital Document";
  const safeTitle = escapeHtml(title);
  const timestamp = escapeHtml(new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short",
  }).format(new Date()));
  return `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@page{size:A4;margin:14mm}*{box-sizing:border-box}
body{font:10pt/1.5 Arial,Helvetica,sans-serif;color:#17243b;margin:0}
.brand{padding:18px 22px;margin-bottom:14px;background:linear-gradient(120deg,#111d3b,#075b6d);color:#fff}
.brand small{display:block;color:#7be5ef;font-weight:bold;letter-spacing:2px;text-transform:uppercase}
.brand h1{font-size:22pt;margin:5px 0 0;color:#fff}
.meta{font-size:8pt;color:#52647b;border-bottom:2px solid #dce6ee;padding:0 0 9px;margin-bottom:16px}
main{padding:0!important;min-height:0!important;background:#fff!important;color:#17243b!important}
h1,h2,h3,h4{break-after:avoid;color:#132a45}h1{font-size:20pt}h2{font-size:15pt}h3{font-size:12pt}
table{width:100%;border-collapse:collapse;margin:9px 0 16px;break-inside:auto}
tr{break-inside:avoid}th,td{border:1px solid #d5e0e9;padding:7px 8px;text-align:left;vertical-align:top;overflow-wrap:anywhere}
th{background:#edf4f8!important;font-weight:bold}p{orphans:3;widows:3}
[class*=rounded-]{border-radius:5px!important;box-shadow:none!important}
[class*=shadow-]{box-shadow:none!important}
footer{margin-top:20px;padding-top:8px;border-top:1px solid #dce6ee;color:#66758a;font-size:8pt}
@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><header class="brand"><small>Sanjeevni Tech · Smart Hospital</small><h1>${safeTitle}</h1></header>
<div class="meta">Generated ${timestamp} · Confidential hospital information — share only with authorized recipients.</div>
${clone.outerHTML}<footer>Sanjeevni Tech · Smart Hospital Management System. This export reflects the page data currently displayed by the application.</footer>
</body></html>`;
}

export default function UniversalPagePdfActions() {
  const [busy, setBusy] = useState(false);

  const openView = useCallback(() => {
    try {
      const html = buildPrintablePage();
      const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        URL.revokeObjectURL(url);
        window.alert("Preview was blocked. Allow pop-ups for this hospital app and try again.");
        return;
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      window.alert(error?.message || "Unable to prepare the PDF preview.");
    }
  }, []);

  const savePdf = useCallback(() => {
    if (busy) return;
    let frame;
    try {
      const html = buildPrintablePage();
      setBusy(true);
      frame = document.createElement("iframe");
      frame.setAttribute("title", "PDF export");
      frame.setAttribute("aria-hidden", "true");
      Object.assign(frame.style, { position: "fixed", width: "1px", height: "1px", right: "0", bottom: "0", opacity: "0", border: "0" });
      document.body.appendChild(frame);
      const doc = frame.contentDocument;
      if (!doc) throw new Error("Unable to prepare PDF document.");
      doc.open(); doc.write(html); doc.close();
      window.setTimeout(() => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        } catch {
          window.alert("Unable to open the print dialog. Please try View as PDF.");
        } finally {
          window.setTimeout(() => { frame?.remove(); setBusy(false); }, 1200);
        }
      }, 350);
    } catch (error) {
      frame?.remove();
      setBusy(false);
      window.alert(error?.message || "Unable to prepare PDF.");
    }
  }, [busy]);

  const btn = "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50";
  return <div className="universal-pdf-actions flex flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6" data-no-pdf="true">
    <button type="button" onClick={openView} className={`${btn} border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100`}>
      <Eye size={15}/> View as PDF
    </button>
    <button type="button" onClick={savePdf} disabled={busy} className={`${btn} border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}>
      {busy ? <LoaderCircle size={15} className="animate-spin"/> : <FileDown size={15}/>} Save as PDF
    </button>
  </div>;
}
