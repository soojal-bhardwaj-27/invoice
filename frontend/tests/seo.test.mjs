import test from "node:test";
import assert from "node:assert/strict";
import {siteSettings, pageMetadata, publicPaths} from "../lib/site.mjs";
test("local and unconfigured builds cannot be indexed", () => {
  assert.equal(siteSettings({}).indexable, false);
  assert.equal(siteSettings({NODE_ENV:"production", PUBLIC_INDEXING:"true"}).indexable, false);
});
test("indexing requires explicit production opt-in", () => {
  const env={SITE_URL:"https://invoice.example.com",PUBLIC_INDEXING:"true",NODE_ENV:"production"};
  assert.equal(siteSettings(env).indexable,true);
  assert.equal(siteSettings({...env,VERCEL_ENV:"preview"}).indexable,false);
  assert.equal(siteSettings({...env,VERCEL_ENV:"development"}).indexable,false);
  assert.equal(siteSettings({...env,VERCEL_ENV:"production"}).indexable,true);
  assert.equal(siteSettings({...env,PUBLIC_INDEXING:"false"}).indexable,false);
});
test("canonical origin rejects malformed and local URLs",()=>{
  for(const url of ["http://example.com","https://localhost","https://127.0.0.1","https://example.com/path","https://user:pass@example.com","https://example.com?x=1"]){
    assert.throws(()=>siteSettings({SITE_URL:url}));
  }
});
test("only public editorial routes are in the sitemap inventory",()=>{
  assert.equal(new Set(publicPaths).size,publicPaths.length);
  assert.ok(publicPaths.every(path=>!path.startsWith("/app")&&!path.startsWith("/api")));
  assert.ok(publicPaths.includes("/guides/payment-reminder-examples"));
});
test("metadata includes social cards and avoids invented canonicals",()=>{
  const meta=pageMetadata("Title","Description","/");
  assert.equal(meta.openGraph.title,"Title");
  assert.equal(meta.twitter.card,"summary_large_image");
  assert.equal(meta.openGraph.images[0].width,1200);
});
