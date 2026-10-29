import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, LoaderCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const safePath = (value) => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : null;
const messageOf = (error) => error?.response?.data?.detail || error?.response?.data?.message || "Notifications could not be loaded.";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const rootRef = useRef(null);

  const refresh = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const [listResponse, countResponse] = await Promise.all([
        api.get("/notifications", { params: { limit: 20 } }),
        api.get("/notifications/unread-count/me"),
      ]);
      const listData = Array.isArray(listResponse.data) ? listResponse.data : listResponse.data?.items || listResponse.data?.data || [];
      const count = Number(countResponse.data?.unread_count ?? 0);
      setItems(listData);
      setUnreadCount(Number.isFinite(count) && count > 0 ? count : 0);
      setError("");
    } catch (requestError) {
      setError(messageOf(requestError));
      setItems([]); setUnreadCount(0);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(false); }, [refresh]);
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); };
    const onKeyDown = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onPointerDown); document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("mousedown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  const markRead = async (item) => {
    if (item.is_read) return;
    setSavingId(item.id);
    try {
      const response = await api.patch(`/notifications/${item.id}/read`);
      const updated = response.data || { ...item, is_read: true };
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...updated, is_read: true } : entry));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setSavingId(null); }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setSavingId("all");
    try {
      await api.patch("/notifications/read-all/me");
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0); setError("");
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setSavingId(null); }
  };

  const openNotification = async (item) => {
    await markRead(item);
    const target = safePath(item.action_url);
    setOpen(false);
    if (target) navigate(target);
  };

  return <div className="relative" ref={rootRef}>
    <button type="button" onClick={() => { setOpen((value) => !value); if (!open) refresh(true); }} aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"} aria-expanded={open} className="navbar-action relative flex h-9 w-9 items-center justify-center rounded-lg">
      <Bell size={16} />
      {unreadCount > 0 && <span aria-label={`${unreadCount} unread notifications`} className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-white" />}
    </button>
    {open && <section role="dialog" aria-label="Notifications" className="absolute right-0 z-[90] mt-2 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h2 className="text-sm font-bold text-slate-900">Notifications</h2><p className="mt-0.5 text-xs text-slate-500">{unreadCount} unread</p></div><button type="button" disabled={unreadCount === 0 || savingId === "all"} onClick={markAllRead} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-40"><CheckCheck size={14} /> Mark all read</button></header>
      <div className="max-h-[min(65vh,480px)] overflow-y-auto p-2">
        {loading && <p className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" /> Loading notifications…</p>}
        {!loading && error && <p role="alert" className="flex items-start gap-2 px-3 py-5 text-sm text-rose-600"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}<button type="button" onClick={() => refresh(true)} className="ml-auto underline">Retry</button></p>}
        {!loading && !error && items.length === 0 && <p className="px-3 py-9 text-center text-sm text-slate-500">You’re all caught up. No notifications.</p>}
        {!loading && !error && items.map((item) => <button type="button" key={item.id} onClick={() => openNotification(item)} disabled={savingId === item.id} className={`mb-1 flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50 disabled:opacity-60 ${item.is_read ? "" : "bg-cyan-50/70"}`}>
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.is_read ? "bg-slate-200" : "bg-cyan-500"}`} />
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{item.title}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{item.message}</span><span className="mt-1.5 block text-[10px] text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</span></span>
          {safePath(item.action_url) && <ExternalLink size={14} className="mt-1 shrink-0 text-slate-400" />}
        </button>)}
      </div>
      <footer className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">Notifications are private to your signed-in account.</footer>
    </section>}
  </div>;
}
