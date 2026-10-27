"use client";
import {useEffect, useState} from "react";
import AuthScreen from "./auth";
import {api, clearCsrf} from "./api";

const initial = {client: "", client_email: "", number: "", amount: "", due_date: "", notes: ""};
const initialSettings = {
  site_name: "Invoice Desk",
  tagline: "Track client invoices, review overdue balances and prepare payment reminders.",
  logo_text: "invoice desk",
  logo_icon: "▧",
  logo_url: "",
  support_phone: "+91 98765 43210",
  whatsapp_number: "+91 98765 43210",
  whatsapp_message: "Hello! I need assistance with Invoice Desk.",
  support_email: "support@invoicedesk.com",
  currency_symbol: "₹",
  announcement_banner: "",
  announcement_enabled: false,
};

export default function Home({defaultTab = "overview"}) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [connectionError, setConnectionError] = useState("");
  useEffect(() => {
    let alive = true;
    async function initialize() {
      if (new URLSearchParams(window.location.search).has("reset_uid")) {setLoading(false); return;}
      try {
        const response = await fetch("/api/auth/me/", {cache: "no-store"});
        if (response.ok) { const data = await response.json(); if (alive) setUser(data); }
        else if (![401, 403].includes(response.status)) throw new Error();
      } catch { if (alive) setConnectionError("Cannot connect to the backend. Please check that it is running."); }
      finally { if (alive) setLoading(false); }
    }
    initialize();
    const expired = () => {clearCsrf(); setUser(null)};
    window.addEventListener("session-expired", expired);
    return () => {alive = false; window.removeEventListener("session-expired", expired)};
  }, []);
  async function signOut() {
    await api("/api/auth/logout/", {method: "POST", body: "{}"});
    clearCsrf(); setUser(null);
  }
  if (loading) return <div id="main-content" className="loading-screen">Opening your workspace…</div>;
  if (connectionError) return <div className="loading-screen"><p role="alert">{connectionError}</p><button className="button" onClick={() => window.location.reload()}>Try again</button></div>;
  return user ? <Dashboard user={user} onLogout={signOut} defaultTab={defaultTab}/> : <AuthScreen onAuthenticated={setUser}/>;
}

function Dashboard({user, onLogout, defaultTab = "overview"}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [items, setItems] = useState([]), [form, setForm] = useState(initial);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all"), [search, setSearch] = useState(""), [query, setQuery] = useState("");
  const [page, setPage] = useState(1), [count, setCount] = useState(0), [next, setNext] = useState(false);
  const [summary, setSummary] = useState(null), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [editing, setEditing] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [siteSettings, setSiteSettings] = useState(initialSettings);
  const [adminForm, setAdminForm] = useState(initialSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetch("/api/site-settings/")
      .then(res => res.json())
      .then(data => {
        if (data.site_name) {
          setSiteSettings(data);
          setAdminForm(data);
        }
      })
      .catch(() => {});
  }, []);

  const currencySym = siteSettings.currency_symbol || "₹";
  const money = n => {
    const formatted = new Intl.NumberFormat("en-IN", {maximumFractionDigits: 2, minimumFractionDigits: 2}).format(Number(n));
    return `${currencySym}${formatted}`;
  };

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    const params = new URLSearchParams({status: filter, search: query, page: String(page)});
    Promise.all([api("/api/invoices/?" + params), api("/api/invoices/summary/")]).then(([data, totals]) => {
      if (!active) return;
      setItems(data.results); setCount(data.count); setNext(Boolean(data.next)); setSummary(totals);
    }).catch(err => {if (active) setError(err.message)}).finally(() => {if (active) setLoading(false)});
    return () => {active = false};
  }, [filter, query, page, refresh]);

  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await api(editing ? "/api/invoices/" + editing + "/" : "/api/invoices/", {method: editing ? "PATCH" : "POST", body: JSON.stringify(form)});
      setNotice(editing ? "Invoice updated." : "Invoice added."); setForm(initial); setEditing(null); setPage(1); setRefresh(n => n + 1);
    } catch (err) {setError(err.message)} finally {setBusy(false)}
  }

  async function change(invoice, method, data) {
    setBusy(true); setError(""); setNotice("");
    try {
      await api("/api/invoices/" + invoice.id + "/", {method, body: data ? JSON.stringify(data) : undefined});
      if (method === "DELETE" && editing === invoice.id) {setEditing(null); setForm(initial)}
      if (method === "DELETE" && items.length === 1 && page > 1) setPage(page - 1);
      else setRefresh(n => n + 1);
      setNotice(method === "DELETE" ? "Invoice deleted." : "Payment status updated.");
    } catch (err) {setError(err.message)} finally {setBusy(false)}
  }

  async function copy(invoice) {
    try {
      const data = await api("/api/invoices/" + invoice.id + "/reminder/");
      await navigator.clipboard.writeText(data.text); setNotice("Reminder copied to clipboard. Review it before sending.");
    } catch (err) {setError(err.message)}
  }

  async function sendWhatsApp(invoice) {
    try {
      const data = await api("/api/invoices/" + invoice.id + "/reminder/");
      const text = encodeURIComponent(data.text);
      window.open(`https://wa.me/?text=${text}`, "_blank");
      setNotice("Opened WhatsApp with your invoice reminder draft.");
    } catch (err) {setError(err.message)}
  }

  async function saveAdminSettings(e) {
    e.preventDefault();
    setSavingSettings(true); setError(""); setNotice("");
    try {
      const updated = await api("/api/site-settings/", {
        method: "PATCH",
        body: JSON.stringify(adminForm)
      });
      setSiteSettings(updated);
      setAdminForm(updated);
      setNotice("Site settings updated successfully across the entire platform!");
    } catch (err) {
      setError(err.message || "Failed to save settings. Administrator permissions required.");
    } finally {
      setSavingSettings(false);
    }
  }

  function edit(invoice) {
    setActiveTab("overview");
    setEditing(invoice.id); setForm(Object.fromEntries(Object.keys(initial).map(key => [key, invoice[key]])));
    setTimeout(() => {
      document.getElementById("add")?.scrollIntoView({behavior: "smooth"});
    }, 100);
  }

  function field(name, label, props = {}) {
    return <label>{label}<input {...props} value={form[name]} onChange={e => setForm({...form, [name]: e.target.value})}/></label>;
  }

  return (
    <main id="main-content">
      <aside>
        <div className="brand">
          {siteSettings.logo_url ? (
            <img src={siteSettings.logo_url} alt="Logo" style={{height: 32, marginRight: 8, verticalAlign: "middle", borderRadius: 6}} />
          ) : (
            <span>{siteSettings.logo_icon || "▧"}</span>
          )}
          {siteSettings.logo_text || "invoice desk"}
        </div>
        <div className="aside-label">WORKSPACE</div>
        <button
          className={"nav-tab " + (activeTab === "overview" ? "active" : "")}
          onClick={() => setActiveTab("overview")}
        >
          ▦ &nbsp; Overview
        </button>
        <button
          className={"nav-tab " + (activeTab === "admin" ? "active" : "")}
          onClick={() => setActiveTab("admin")}
        >
          ⚙️ &nbsp; Admin Panel {user.is_staff && <span className="admin-badge">Admin</span>}
        </button>

        <div className="aside-bottom">
          <div className="avatar">{user.full_name ? user.full_name.slice(0, 2).toUpperCase() : "US"}</div>
          <div>
            <strong>{user.full_name}</strong>
            <small>{user.email}</small>
            <button className="signout" onClick={() => onLogout().catch(err => setError(err.message))}>Sign out</button>
          </div>
        </div>
      </aside>

      <section className="content">
        <header>
          <div>
            <div className="eyebrow">{activeTab === "admin" ? "ADMINISTRATION / SYSTEM CONTROLS" : "YOUR WORKSPACE / OVERVIEW"}</div>
            <h1>{activeTab === "admin" ? "Admin Control Panel" : "Good to see you"} <span>✳</span></h1>
            <p>{activeTab === "admin" ? "Configure platform branding, WhatsApp support, phone number, and announcement banners." : "Here’s where your invoices stand today."}</p>
          </div>
          {activeTab === "overview" && (
            <a className="button" href="#add" onClick={() => {setEditing(null); setForm(initial)}}>＋ &nbsp; Add invoice</a>
          )}
        </header>

        <div className="mobile-account">
          <div>
            <span>{user.full_name}</span> &nbsp;
            <button style={{marginRight: 10}} onClick={() => setActiveTab(activeTab === "admin" ? "overview" : "admin")}>
              {activeTab === "admin" ? "View Invoices" : "Admin Panel"}
            </button>
          </div>
          <button onClick={() => onLogout().catch(err => setError(err.message))}>Sign out</button>
        </div>

        {error && <div className="alert" role="alert">{error}</div>}
        {notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}

        {activeTab === "admin" ? (
          <div className="admin-panel">
            <form onSubmit={saveAdminSettings}>
              <div className="admin-card">
                <h2>🏷️ Brand Identity & Logo Settings</h2>
                <p>Customize the platform name, logo text, logo icon, and optional image logo across the application.</p>
                <div className="admin-grid">
                  <label>Site Name
                    <input
                      required
                      value={adminForm.site_name}
                      onChange={e => setAdminForm({...adminForm, site_name: e.target.value})}
                      placeholder="e.g. Invoice Desk"
                    />
                  </label>
                  <label>Logo Text
                    <input
                      required
                      value={adminForm.logo_text}
                      onChange={e => setAdminForm({...adminForm, logo_text: e.target.value})}
                      placeholder="e.g. invoice desk"
                    />
                  </label>
                  <label>Logo Icon Symbol / Emoji
                    <input
                      value={adminForm.logo_icon}
                      onChange={e => setAdminForm({...adminForm, logo_icon: e.target.value})}
                      placeholder="e.g. ▧ or 🧾"
                    />
                  </label>
                  <label>Custom Logo Image URL (Optional)
                    <input
                      value={adminForm.logo_url}
                      onChange={e => setAdminForm({...adminForm, logo_url: e.target.value})}
                      placeholder="https://example.com/logo.png"
                    />
                  </label>
                </div>
                <label style={{marginTop: 15, display: "block"}}>Brand Tagline
                  <input
                    value={adminForm.tagline}
                    onChange={e => setAdminForm({...adminForm, tagline: e.target.value})}
                    placeholder="e.g. Track client invoices, review overdue balances and prepare payment reminders."
                  />
                </label>
              </div>

              <div className="admin-card" style={{marginTop: 20}}>
                <h2>💬 WhatsApp Support & Contact Numbers</h2>
                <p>Configure direct WhatsApp support for visitors and clients. Also updates the phone & email displayed.</p>
                <div className="admin-grid">
                  <label>WhatsApp Number (with Country Code)
                    <input
                      required
                      value={adminForm.whatsapp_number}
                      onChange={e => setAdminForm({...adminForm, whatsapp_number: e.target.value})}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </label>
                  <label>Support Phone Number
                    <input
                      value={adminForm.support_phone}
                      onChange={e => setAdminForm({...adminForm, support_phone: e.target.value})}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </label>
                  <label>Support Email Address
                    <input
                      type="email"
                      value={adminForm.support_email}
                      onChange={e => setAdminForm({...adminForm, support_email: e.target.value})}
                      placeholder="support@invoicedesk.com"
                    />
                  </label>
                  <label>Currency Symbol
                    <input
                      value={adminForm.currency_symbol}
                      onChange={e => setAdminForm({...adminForm, currency_symbol: e.target.value})}
                      placeholder="₹ or $ or €"
                      maxLength={10}
                    />
                  </label>
                </div>
                <label style={{marginTop: 15, display: "block"}}>Default WhatsApp Greeting Message
                  <input
                    value={adminForm.whatsapp_message}
                    onChange={e => setAdminForm({...adminForm, whatsapp_message: e.target.value})}
                    placeholder="Hello! I need assistance with Invoice Desk."
                  />
                </label>
                <div style={{marginTop: 14}}>
                  <a
                    href={`https://wa.me/${(adminForm.whatsapp_number || "").replace(/\D/g, "")}?text=${encodeURIComponent(adminForm.whatsapp_message || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-django-link"
                    style={{color: "#16a34a", borderColor: "#86efac"}}
                  >
                    💬 Test WhatsApp Support Link ↗
                  </a>
                </div>
              </div>

              <div className="admin-card" style={{marginTop: 20}}>
                <h2>📢 Announcement Banner & Notices</h2>
                <p>Display an announcement or alert banner across the top of all pages.</p>
                <label>Announcement Banner Text
                  <input
                    value={adminForm.announcement_banner}
                    onChange={e => setAdminForm({...adminForm, announcement_banner: e.target.value})}
                    placeholder="e.g. Special Offer: 20% off all quarterly invoices this month!"
                  />
                </label>
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={adminForm.announcement_enabled}
                    onChange={e => setAdminForm({...adminForm, announcement_enabled: e.target.checked})}
                  />
                  Enable Announcement Banner publicly
                </label>
              </div>

              <div className="admin-card" style={{marginTop: 20}}>
                <div className="admin-save-bar">
                  <div>
                    <a href="/admin/" target="_blank" rel="noopener noreferrer" className="admin-django-link">
                      🗄️ Open Advanced Django Database Admin ↗
                    </a>
                  </div>
                  <button className="button" disabled={savingSettings}>
                    {savingSettings ? "Saving Settings…" : "Save All Settings →"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="stats">
              <article>
                <div className="stat-label">Outstanding <span>↗</span></div>
                <strong>{summary ? money(summary.outstanding) : "—"}</strong>
                <p>{summary?.unpaid_count ?? "—"} unpaid invoices</p>
              </article>
              <article>
                <div className="stat-label">Overdue <span>◷</span></div>
                <strong>{summary ? money(summary.overdue) : "—"}</strong>
                <p>{summary?.overdue_count ?? "—"} need follow-up</p>
              </article>
              <article>
                <div className="stat-label">Paid invoices <span>✓</span></div>
                <strong>{summary?.paid_count ?? "—"}</strong>
                <p>Marked as received</p>
              </article>
            </div>

            <div className="workspace">
              <div className="panel list">
                <div className="panel-head">
                  <div>
                    <h2>Invoices</h2>
                    <p>Everything in one place.</p>
                  </div>
                  <a className="count" href={"/api/invoices/export/?" + new URLSearchParams({status: filter, search: query})}>
                    Export CSV ↓
                  </a>
                </div>

                <form className="search-form" onSubmit={e => {e.preventDefault(); setQuery(search); setPage(1)}}>
                  <input aria-label="Search invoices" placeholder="Search client or invoice number" value={search} onChange={e => setSearch(e.target.value)}/>
                  <button className="button">Search</button>
                </form>

                <div className="filters">
                  {["all", "pending", "overdue", "paid"].map(f => (
                    <button key={f} className={filter === f ? "active" : ""} onClick={() => {setFilter(f); setPage(1)}}>
                      {f[0].toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>CLIENT / INVOICE</th>
                        <th>AMOUNT</th>
                        <th>DUE DATE</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!loading && items.map(i => (
                        <tr key={i.id}>
                          <td><b>{i.client}</b><small>{i.number}</small></td>
                          <td>{money(i.amount)}</td>
                          <td>{i.due_date}</td>
                          <td><span className={"badge " + i.status}>{i.status}</span></td>
                          <td>
                            <div className="actions">
                              <button disabled={busy} onClick={() => edit(i)}>Edit</button>
                              <button disabled={busy} onClick={() => change(i, "PATCH", {paid: !i.paid})}>
                                {i.paid ? "Mark unpaid" : "Mark paid"}
                              </button>
                              {!i.paid && (
                                <>
                                  <button disabled={busy} onClick={() => copy(i)}>Copy reminder</button>
                                  <button disabled={busy} className="whatsapp-send" title="Send reminder to client via WhatsApp" onClick={() => sendWhatsApp(i)}>
                                    💬 WhatsApp
                                  </button>
                                </>
                              )}
                              <button disabled={busy} className="delete" onClick={() => {if (confirm("Delete invoice " + i.number + "?")) change(i, "DELETE")}}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loading ? (
                    <div className="empty" role="status">Loading invoices…</div>
                  ) : items.length === 0 && (
                    <div className="empty">
                      <div>✧</div>
                      <strong>{summary?.total ? "No invoices in this view" : "A fresh start"}</strong>
                      <p>{summary?.total ? "Try another filter or search." : "Add your first invoice to start tracking payments."}</p>
                    </div>
                  )}
                </div>

                <div className="pagination">
                  <span>{count} invoices · Page {page}</span>
                  <div>
                    <button disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>Previous</button>
                    <button disabled={!next || loading} onClick={() => setPage(page + 1)}>Next</button>
                  </div>
                </div>
              </div>

              <div className="panel form-panel" id="add">
                <div className="form-icon">{editing ? "✎" : "＋"}</div>
                <h2>{editing ? "Edit invoice" : "Add an invoice"}</h2>
                <p>Keep the details handy and follow up on time.</p>
                <form onSubmit={save}>
                  {field("client", "Client name", {required: true, maxLength: 150, placeholder: "e.g. Studio North"})}
                  {field("number", "Invoice number", {required: true, maxLength: 80, placeholder: "e.g. INV-001"})}
                  {field("amount", `Amount (${currencySym})`, {required: true, type: "number", min: "0.01", max: "9999999999.99", step: "0.01", placeholder: "0.00"})}
                  {field("due_date", "Due date", {required: true, type: "date"})}
                  {field("client_email", "Client email (optional)", {type: "email"})}
                  <label>Notes (optional)<textarea maxLength={5000} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}/></label>
                  <button className="button submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes →" : "Add invoice →"}</button>
                  {editing && <button type="button" className="cancel-edit" onClick={() => {setEditing(null); setForm(initial)}}>Cancel edit</button>}
                </form>
                <div className="tip">✦ &nbsp; Reminders can be copied or sent directly to clients via WhatsApp.</div>
              </div>
            </div>
          </>
        )}

        <footer>Built for a little more clarity, every day. <span>{siteSettings.site_name.toUpperCase()}</span></footer>
      </section>
    </main>
  );
}
