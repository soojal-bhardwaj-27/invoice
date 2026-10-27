import {site} from "../lib/site.mjs";
export default function robots() {
  // Let crawlers read noindex directives. Authentication protects private data.
  return {rules: {userAgent: "*", allow: "/", disallow: ["/api/"]},
    ...(site.indexable ? {sitemap: site.url + "/sitemap.xml"} : {})};
}
