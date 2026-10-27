import "./style.css";
import "./marketing.css";
import {site} from "../lib/site.mjs";
import WhatsAppSupport from "./whatsapp";

export const metadata = {
  metadataBase: new URL(site.url || "http://127.0.0.1:3000"),
  title: {default: "Invoice Desk — client invoice tracking", template: "%s | Invoice Desk"},
  description: "Track client invoices, review overdue balances and prepare payment reminders in one workspace.",
  applicationName: "Invoice Desk",
  robots: {index: site.indexable, follow: site.indexable},
  verification: process.env.GOOGLE_SITE_VERIFICATION ? {google: process.env.GOOGLE_SITE_VERIFICATION} : undefined,
};
export const viewport = {width:"device-width",initialScale:1,themeColor:"#0f172a"};
export default function Layout({children}) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a className="skip-link" href="#main-content">Skip to content</a>
        {children}
        <WhatsAppSupport />
      </body>
    </html>
  );
}

