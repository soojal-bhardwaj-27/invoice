export function siteSettings(env = process.env) {
  let url = null;
  if (env.SITE_URL) {
    const parsed = new URL(env.SITE_URL);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash ||
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname.endsWith(".local")) {
      throw new Error("SITE_URL must be your public HTTPS origin, without a path, query or credentials.");
    }
    url = parsed.origin;
  }
  const indexable = Boolean(url && env.PUBLIC_INDEXING === "true" && env.NODE_ENV === "production" &&
    (!env.VERCEL_ENV || env.VERCEL_ENV === "production"));
  return {url, indexable};
}
export const site = siteSettings();
export const publicPaths = ["/", "/guides", "/guides/track-client-invoices", "/guides/payment-reminder-examples"];
export function pageMetadata(title, description, path) {
  return {
    title, description,
    alternates: site.url ? {canonical: site.url + path} : undefined,
    openGraph: {title, description, type: "website", siteName: "Invoice Desk", locale: "en_IN",
      ...(site.url ? {url: site.url + path} : {}), images: [{url: "/opengraph-image", width: 1200, height: 630, alt: "Invoice Desk — keep client invoices in view"}]},
    twitter: {card: "summary_large_image", title, description, images: ["/opengraph-image"]},
  };
}
