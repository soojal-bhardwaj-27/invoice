import {site, publicPaths} from "../lib/site.mjs";
export default function sitemap() {
  return site.indexable ? publicPaths.map(path => ({url: site.url + path})) : [];
}
