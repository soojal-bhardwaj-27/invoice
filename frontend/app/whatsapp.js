"use client";
import {useEffect, useState} from "react";

export default function WhatsAppSupport() {
  const [settings, setSettings] = useState({
    site_name: "Invoice Desk",
    whatsapp_number: "+91 98765 43210",
    clean_whatsapp: "919876543210",
    whatsapp_message: "Hello! I need assistance with Invoice Desk.",
    support_phone: "+91 98765 43210",
    announcement_banner: "",
    announcement_enabled: false,
  });
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/site-settings/")
      .then(res => res.json())
      .then(data => { if (alive && data.whatsapp_number) setSettings(data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const num = settings.clean_whatsapp || settings.whatsapp_number.replace(/\D/g, "");
  const msg = encodeURIComponent(settings.whatsapp_message || "Hello! I need help.");
  const waUrl = `https://wa.me/${num}?text=${msg}`;

  return (
    <>
      {settings.announcement_enabled && settings.announcement_banner && (
        <div className="announcement-bar" role="banner">
          <span>{settings.announcement_banner}</span>
        </div>
      )}
      <aside aria-label="Support widget" className="whatsapp-float-container">
        {showTooltip && (
          <div className="whatsapp-tooltip" role="tooltip">
            <strong>Need help?</strong>
            <p>Chat with us on WhatsApp ({settings.whatsapp_number})</p>
          </div>
        )}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-float-btn"
          aria-label={`Chat with us on WhatsApp at ${settings.whatsapp_number}`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <svg viewBox="0 0 32 32" className="whatsapp-icon" fill="currentColor">
            <path d="M16.002 0C7.165 0 0 7.165 0 16.002c0 2.825.738 5.483 2.032 7.788L.068 31.068l7.53-1.936a15.932 15.932 0 008.404 2.37C24.839 31.502 32 24.337 32 15.5c0-8.837-7.161-15.5-15.998-15.5zm9.324 22.613c-.389 1.094-1.929 2.001-3.177 2.268-.854.183-1.968.329-5.719-1.225-4.796-1.986-7.886-6.837-8.125-7.155-.239-.318-1.947-2.593-1.947-4.945 0-2.352 1.233-3.509 1.671-3.987.438-.478.956-.597 1.275-.597.318 0 .637.004.916.018.299.014.698-.114 1.095.836.418.995 1.414 3.444 1.534 3.683.12.239.199.518.04.836-.159.318-.239.518-.478.797-.239.279-.502.623-.717.836-.239.239-.488.498-.21.976.279.478 1.239 2.046 2.663 3.313 1.83 1.628 3.375 2.13 3.853 2.369.478.239.757.199 1.036-.12.279-.319 1.195-1.394 1.514-1.873.318-.478.637-.398 1.075-.239.438.159 2.787 1.314 3.265 1.553.478.239.797.359.916.558.12.2.12 1.155-.269 2.249z"/>
          </svg>
          <span className="whatsapp-text">WhatsApp</span>
        </a>
      </aside>
    </>
  );
}
