"use client";
import {useEffect, useState} from "react";

const defaultSettings = {
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

export default function AdminControlPanel() {
  const [form, setForm] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/site-settings/")
      .then(r => r.json())
      .then(data => {
        if (data.site_name) setForm(data);
      })
      .catch(err => setError("Could not load current settings: " + err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch("/api/site-settings/", {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save settings");
      setForm(data);
      setNotice("✓ Site settings updated successfully! Changes are live across the entire website.");
      window.dispatchEvent(new Event("site-settings-updated"));
    } catch (err) {
      setError(err.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  }

  const cleanNum = (form.whatsapp_number || "").replace(/\D/g, "");
  const waTestUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(form.whatsapp_message || "")}`;

  return (
    <div style={{minHeight: "100vh", background: "var(--bg-app, #f8fafc)", color: "var(--text-main, #0f172a)", fontFamily: "system-ui, sans-serif"}}>
      <header style={{background: "#0f172a", color: "#fff", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", flexWrap: "wrap", gap: 16}}>
        <div style={{display: "flex", alignItems: "center", gap: 12}}>
          <span style={{background: "#6366f1", color: "#fff", width: 34, height: 34, borderRadius: 8, display: "grid", placeItems: "center", fontSize: 18, fontWeight: 800}}>
            {form.logo_icon || "▧"}
          </span>
          <div>
            <strong style={{fontSize: 18, letterSpacing: "-0.5px"}}>{form.site_name || "Invoice Desk"}</strong>
            <span style={{marginLeft: 10, background: "#312e81", color: "#c7d2fe", fontSize: 10, padding: "3px 8px", borderRadius: 4, fontWeight: 700, letterSpacing: "1px"}}>ADMIN PANEL</span>
          </div>
        </div>
        <div style={{display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap"}}>
          <a href="/app" style={{color: "#cbd5e1", textDecoration: "none", fontSize: 13, padding: "8px 14px", borderRadius: 6, border: "1px solid #334155"}}>
            💼 Invoices Workspace
          </a>
          <a href="/" style={{color: "#cbd5e1", textDecoration: "none", fontSize: 13, padding: "8px 14px", borderRadius: 6, border: "1px solid #334155"}}>
            🌐 Public Website
          </a>
          <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noopener noreferrer" style={{background: "#4f46e5", color: "#fff", textDecoration: "none", fontSize: 13, padding: "8px 14px", borderRadius: 6, fontWeight: 600}}>
            🗄️ Django Database Admin ↗
          </a>
        </div>
      </header>

      <main style={{maxWidth: 1000, margin: "40px auto", padding: "0 24px"}}>
        <div style={{marginBottom: 32}}>
          <h1 style={{fontSize: 32, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-1px"}}>🛠️ Platform Admin Control Panel</h1>
          <p style={{color: "var(--text-muted, #64748b)", fontSize: 15, margin: 0}}>
            Manage your site name, logo icon and text, WhatsApp support number, phone, email, currency symbol, and announcement banner.
          </p>
        </div>

        {notice && (
          <div style={{background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "14px 18px", borderRadius: 10, marginBottom: 24, fontSize: 14, fontWeight: 600}}>
            {notice}
          </div>
        )}
        {error && (
          <div style={{background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "14px 18px", borderRadius: 10, marginBottom: 24, fontSize: 14, fontWeight: 600}}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{padding: 50, textAlign: "center", color: "#64748b"}}>Loading platform configuration…</div>
        ) : (
          <form onSubmit={handleSave}>
            {/* Section 1: Brand & Logo */}
            <div className="admin-card" style={{marginBottom: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.04)"}}>
              <h2 style={{fontSize: 18, fontWeight: 700, margin: "0 0 6px"}}>🏷️ Branding & Logo Configuration</h2>
              <p style={{fontSize: 13, color: "#64748b", margin: "0 0 20px"}}>Change the platform title, brand text, and logo across all client views.</p>
              
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18}}>
                <label style={{display: "block", fontSize: 12, fontWeight: 700, color: "#334155"}}>
                  Site / Company Name
                  <input
                    required
                    style={{display: "block", width: "100%", padding: 11, border: "1px solid #cbd5e1", borderRadius: 7, marginTop: 6, fontSize: 14}}
                    value={form.site_name}
                    onChange={e => setForm({...form, site_name: e.target.value})}
                    placeholder="e.g. Invoice Desk"
                  />
                </label>

                <label style={{display: "block", fontSize: 12, fontWeight: 700, color: "#334155"}}>
                  Logo Text
                  <input
                    required
                    style={{display: "block", width: "100%", padding: 11, border: "1px solid #cbd5e1", borderRadius: 7, marginTop: 6, fontSize: 14}}
                    value={form.logo_text}
                    onChange={e => setForm({...form, logo_text: e.target.value})}
                    placeholder="e.g. invoice desk"
                  />
                </label>

                <label style={{display: "block", fontSize: 12, fontWeight: 700, color: "#334155"}}>
                  Logo Icon Symbol / Emoji
                  <input
                    style={{display: "block", width: "100%", padding: 11, border: "1px solid #cbd5e1", borderRadius: 7, marginTop: 6, fontSize: 14}}
                    value={form.logo_icon}
                    onChange={e => setForm({...form, logo_icon: e.target.value})}
                    placeholder="e.g. ▧ or 🧾 or 💼"
                  />
                </label>

                <label style={{display: "block", fontSize: 12, fontWeight: 700, color: "#334155"}}>
                  Custom Logo Image URL (Optional)
                  <input
                    style={{display: "block", width: "100%", padding: 11, border: "1px solid #cbd5e1", borderRadius: 7, marginTop: 6, fontSize: 14}}
                    value={form.logo_url}
                    onChange={e => setForm({...form, logo_url: e.target.value})}
                    placeholder="https://example.com/logo.png"
                  />
                </label>
              </div>

              <label style={{display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginTop: 18}}>
                Brand Tagline
                <input
                  style={{display: "block", width: "100%", padding: 11, border: "1px solid #cbd5e1", borderRadius: 7, marginTop: 6, fontSize: 14}}
                  value={form.tagline}
                  onChange={e => setForm({...form, tagline: e.target.value})}
                  placeholder="e.g. Track client invoices, review overdue balances and prepare payment reminders."
                />
              </label>

              {/* Live Preview Box */}
              <div style={{marginTop: 20, padding: 16, background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 8}}>
                <span style={{fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8}}>
                  Live Logo Preview
                </span>
                <div style={{display: "inline-flex", alignItems: "center", background: "#0f172a", color: "#fff", padding: "8px 16px", borderRadius: 8, gap: 10, fontWeight: 800, fontSize: 18}}>
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo" style={{height: 28, verticalAlign: "middle", borderRadius: 4}} />
                  ) : (
                    <span style={{background: "#6366f1", color: "#fff", width: 28, height: 28, borderRadius: 6, display: "grid", placeItems: "center", fontSize: 16}}>
                      {form.logo_icon || "▧"}
                    </span>
                  )}
                  {form.logo_text || "invoice desk"}
                </div>
              </div>
            </div>

            {/* Section 2: WhatsApp & Support */}
            <div className="admin-card" style={{marginBottom: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.04)"}}>
              <h2 style={{fontSize: 18, fontWeight: 700, margin: "0 0 6px"}}>💬 WhatsApp Support & Contact Channels</h2>
              <p style={{fontSize: 13, color: "#64748b", margin: "0 0 20px"}}>Configure direct WhatsApp support for website visitors and client reminders.</p>

              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18}}>
                <label style={{display: "block", fontSize: 12, fontWeight: 700, color: "#334155"}}>
                  WhatsApp Support Number (with Country Code)
                  <input
                    required
                    style={{display: "block", width: "100%", padding: 11, border: "1px solid #cbd5e1", borderRadius: 7, marginTop: 6, fontSize: 14}}
                    value={form.whatsapp_number}
                    onChange={e => setForm({...form, whatsapp_number: e.target.value})}
                    placeholder="e.g. +91 98765 43210"
                  />
                </label>

                <label style={{display: "block", fontSize: 12, fontWeight: 700, color: "#334155"}}>
                  Support Phone Number
                  <input
                    style={{display: "block", width: "100%", padding: 11, border: "1px solid #cbd5e1", borderRadius: 7, marginTop: 6, fontSize: 14}}
                    value={form.support_phone}
                    onChange={e => setForm({...form, support_phone: e.target.value})}
                    placeholder="e.g. +91 98765 43210"
                  />
                </label>

                <label style={{display: "block", fontSize: 12, fontWeight: 700, color: "#334155"}}>
                  Support Email Address
                  <input
                    type="email"
                    style={{display: "block", width: "100%", padding: 11, border: "1px solid #cbd5e1", borderRadius: 7, marginTop: 6, fontSize: 14}}
                    value={form.support_email}
                    onChange={e => setForm({...form, support_email: e.target.value})}
                    placeholder="support@invoicedesk.com"
                  />
                </label>

                <label style={{display: "block", fontSize: 12, fontWeight: 700, color: "#334155"}}>
                  Currency Symbol
                  <input
                    style={{display: "block", width: "100%", padding: 11, border: "1px solid #cbd5e1", borderRadius: 7, marginTop: 6, fontSize: 14}}
                    value={form.currency_symbol}
                    onChange={e => setForm({...form, currency_symbol: e.target.value})}
                    placeholder="₹ or $ or €"
                    maxLength={10}
                  />
                </label>
              </div>

              <label style={{display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginTop: 18}}>
                Default WhatsApp Greeting Message
                <input
                  style={{display: "block", width: "100%", padding: 11, border: "1px solid #cbd5e1", borderRadius: 7, marginTop: 6, fontSize: 14}}
                  value={form.whatsapp_message}
                  onChange={e => setForm({...form, whatsapp_message: e.target.value})}
                  placeholder="Hello! I need assistance with Invoice Desk."
                />
              </label>

              <div style={{marginTop: 18}}>
                <a
                  href={waTestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{display: "inline-flex", alignItems: "center", gap: 8, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "10px 16px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700}}
                >
                  <svg viewBox="0 0 32 32" style={{width: 18, height: 18, fill: "currentColor"}}><path d="M16.002 0C7.165 0 0 7.165 0 16.002c0 2.825.738 5.483 2.032 7.788L.068 31.068l7.53-1.936a15.932 15.932 0 008.404 2.37C24.839 31.502 32 24.337 32 15.5c0-8.837-7.161-15.5-15.998-15.5zm9.324 22.613c-.389 1.094-1.929 2.001-3.177 2.268-.854.183-1.968.329-5.719-1.225-4.796-1.986-7.886-6.837-8.125-7.155-.239-.318-1.947-2.593-1.947-4.945 0-2.352 1.233-3.509 1.671-3.987.438-.478.956-.597 1.275-.597.318 0 .637.004.916.018.299.014.698-.114 1.095.836.418.995 1.414 3.444 1.534 3.683.12.239.199.518.04.836-.159.318-.239.518-.478.797-.239.279-.502.623-.717.836-.239.239-.488.498-.21.976.279.478 1.239 2.046 2.663 3.313 1.83 1.628 3.375 2.13 3.853 2.369.478.239.757.199 1.036-.12.279-.319 1.195-1.394 1.514-1.873.318-.478.637-.398 1.075-.239.438.159 2.787 1.314 3.265 1.553.478.239.797.359.916.558.12.2.12 1.155-.269 2.249z"/></svg>
                  Test WhatsApp Chat Link ({form.whatsapp_number}) ↗
                </a>
              </div>
            </div>

            {/* Section 3: Announcements */}
            <div className="admin-card" style={{marginBottom: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.04)"}}>
              <h2 style={{fontSize: 18, fontWeight: 700, margin: "0 0 6px"}}>📢 Public Announcement Banner</h2>
              <p style={{fontSize: 13, color: "#64748b", margin: "0 0 20px"}}>Display a notice or promotional strip across the top of all pages.</p>

              <label style={{display: "block", fontSize: 12, fontWeight: 700, color: "#334155"}}>
                Announcement Banner Text
                <input
                  style={{display: "block", width: "100%", padding: 11, border: "1px solid #cbd5e1", borderRadius: 7, marginTop: 6, fontSize: 14}}
                  value={form.announcement_banner}
                  onChange={e => setForm({...form, announcement_banner: e.target.value})}
                  placeholder="e.g. Special Offer: 20% discount on all new projects this month!"
                />
              </label>

              <label style={{display: "flex", alignItems: "center", gap: 10, marginTop: 15, cursor: "pointer", fontSize: 14, fontWeight: 600}}>
                <input
                  type="checkbox"
                  style={{width: 18, height: 18, cursor: "pointer"}}
                  checked={form.announcement_enabled}
                  onChange={e => setForm({...form, announcement_enabled: e.target.checked})}
                />
                Show Announcement Banner publicly on website & workspace
              </label>
            </div>

            {/* Save Buttons Bar */}
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", flexWrap: "wrap", gap: 16}}>
              <a href="/app" style={{color: "#64748b", textDecoration: "none", fontSize: 14, fontWeight: 600}}>
                ← Return to Workspace
              </a>
              <button
                type="submit"
                disabled={saving}
                style={{background: "#4f46e5", color: "#fff", border: 0, borderRadius: 8, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)"}}
              >
                {saving ? "Saving Changes…" : "💾 Save All Platform Settings"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
