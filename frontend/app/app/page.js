import Workspace from "../workspace";
export const metadata = {
  title: "Your workspace",
  description: "Sign in to your private Invoice Desk workspace.",
  robots: {index: false, follow: false, noarchive: true},
  alternates: {canonical: null},
};
export default function AppPage() { return <Workspace/>; }
