"use client";
import {useEffect, useState} from "react";

export function PublicHeader() {
  const [brand, setBrand] = useState({site_name: "Invoice Desk", logo_text: "invoice desk", logo_icon: "▧", logo_url: "", whatsapp_number: "+91 98765 43210", clean_whatsapp: "919876543210"});
  useEffect(() => {
    fetch("/api/site-settings/").then(r => r.json()).then(data => { if (data.site_name) setBrand(data); }).catch(() => {});
  }, []);

  return (
    <nav className="public-nav" aria-label="Main navigation">
      <a className="public-brand" href="/" aria-label={`${brand.site_name || "Invoice Desk"} home`}>
        {brand.logo_url ? (
          <img src={brand.logo_url} alt="Logo" style={{height: 32, marginRight: 8, verticalAlign: "middle", borderRadius: 4}} />
        ) : (
          <span aria-hidden="true">{brand.logo_icon || "▧"}</span>
        )}
        {brand.logo_text || "invoice desk"}
      </a>
      <div>
        <a href="/#features">Features</a>
        <a href="/guides">Guides</a>
        {brand.whatsapp_number && (
          <a
            href={`https://wa.me/${brand.clean_whatsapp || brand.whatsapp_number.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{display: "inline-flex", alignItems: "center", gap: 5, color: "#16a34a", fontWeight: 600}}
          >
            💬 WhatsApp
          </a>
        )}
        <a className="button" href="/app">Open workspace <span aria-hidden="true">↗</span></a>
      </div>
    </nav>
  );
}

export function PublicFooter() {
  const [brand, setBrand] = useState({site_name: "Invoice Desk", logo_text: "invoice desk", support_phone: "+91 98765 43210", support_email: "support@invoicedesk.com"});
  useEffect(() => {
    fetch("/api/site-settings/").then(r => r.json()).then(data => { if (data.site_name) setBrand(data); }).catch(() => {});
  }, []);

  return (
    <footer className="public-footer">
      <div>
        <a className="public-brand" href="/">{brand.logo_text || "invoice desk"}</a>
        <p>A little more clarity, every invoice.</p>
        {(brand.support_phone || brand.support_email) && (
          <p style={{fontSize: 11, color: "var(--text-muted)", marginTop: 4}}>
            Support: {brand.support_phone} {brand.support_email ? `· ${brand.support_email}` : ""}
          </p>
        )}
      </div>
      <nav aria-label="Footer navigation">
        <a href="/guides">Invoice guides</a>
        <a href="/app">Sign in</a>
      </nav>
    </footer>
  );
}

export function JsonLd({data}) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(data).replace(/</g, "\\u003c")}}/>;
}
