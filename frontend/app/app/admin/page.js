import Workspace from "../../workspace";

export const metadata = {
  title: "Admin Control Panel | Invoice Desk",
  description: "Configure system branding, logos, contact numbers and WhatsApp support.",
  robots: {index: false, follow: false, noarchive: true},
  alternates: {canonical: null},
};

export default function AdminPage() {
  return <Workspace defaultTab="admin" />;
}
