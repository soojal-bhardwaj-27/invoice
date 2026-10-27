import {notFound} from "next/navigation";
import {site, pageMetadata} from "../../../lib/site.mjs";
import {PublicHeader, PublicFooter, JsonLd} from "../../marketing";
import {guides} from "../content";
export const dynamicParams = false;
export function generateStaticParams() { return guides.map(g => ({slug:g.slug})); }
export async function generateMetadata({params}) {
  const {slug} = await params; const guide = guides.find(g=>g.slug===slug);
  if (!guide) return {};
  return pageMetadata(guide.title, guide.description, "/guides/"+guide.slug);
}
export default async function Guide({params}) {
  const {slug} = await params; const guide = guides.find(g=>g.slug===slug);
  if (!guide) notFound();
  const related = guides.find(g=>g.slug!==slug);
  return <div className="marketing"><PublicHeader/><main id="main-content" className="guide-article">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/guides">Guides</a><span aria-hidden="true">/</span><span>{guide.title}</span></nav>
    <p className="kicker">INVOICE DESK GUIDE</p><h1>{guide.title}</h1><p className="lead">{guide.intro}</p>
    <article>{guide.sections.map(section=><section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map(p=><p key={p}>{p}</p>)}{section.example&&<blockquote>{section.example}</blockquote>}</section>)}</article>
    <div className="guide-cta"><h2>Keep your next follow-up in view.</h2><p>Track due dates and prepare a reminder from your saved invoice details.</p><a className="button" href="/app">Open workspace</a><a className="text-link" href={"/guides/"+related.slug}>{related.title} ↗</a></div>
    <JsonLd data={{"@context":"https://schema.org","@type":"Article",headline:guide.title,description:guide.description,author:{"@type":"Organization",name:"Invoice Desk"},...(site.url?{mainEntityOfPage:site.url+"/guides/"+slug}:{})}}/>
    {site.url&&<JsonLd data={{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:site.url},{"@type":"ListItem",position:2,name:"Guides",item:site.url+"/guides"},{"@type":"ListItem",position:3,name:guide.title,item:site.url+"/guides/"+slug}]}}/>}
  </main><PublicFooter/></div>;
}
