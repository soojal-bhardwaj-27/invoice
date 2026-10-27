import {site, pageMetadata} from "../lib/site.mjs";
import {PublicHeader, PublicFooter, JsonLd} from "./marketing";
export const metadata = pageMetadata("Invoice tracking for freelancers", "Track client invoices, overdue balances and payment status in INR. Invoice Desk helps freelancers and small agencies prepare clear payment reminders.", "/");
const faqs = [
  ["What is Invoice Desk?", "Invoice Desk is a tracker for invoices you have already issued. Record the client, invoice number, amount and due date, then use your workspace to review unpaid balances and prepare follow-ups."],
  ["Does it send reminders automatically?", "No. Copy a reminder draft from an unpaid invoice, review the wording and send it through your own email or messaging app. You stay in control of every message."],
  ["Can I create tax invoices or invoice PDFs?", "The current version tracks invoice records. It does not generate PDFs, calculate GST or other taxes, manage partial payments, or verify bank payments. Keep your original invoice and payment documents separately."],
  ["Who can see my invoices?", "Invoices are linked to your account. Other customer accounts cannot access them through the API. Authorized administrators and the hosting operator may access stored data to operate the service."],
];
export default function Landing() {
  return <div className="marketing"><PublicHeader/><main id="main-content">
    <section className="hero"><div className="hero-copy"><p className="kicker"><span/> FOR FREELANCERS & SMALL AGENCIES</p><h1>Good work deserves<br/>a clearer <em>follow-up.</em></h1>
      <p className="lead">Keep client invoices, due dates and unpaid balances in one place. Know what needs your attention before another week slips by.</p>
      <div className="hero-actions"><a className="button" href="/app">Start your workspace <span aria-hidden="true">↗</span></a><a className="text-link" href="#how-it-works">See how it works ↓</a></div>
      <p className="hero-footnote">Invoice tracking in INR. Thoughtful, manual follow-ups.</p></div>
      <div className="product-preview" aria-label="Illustrative invoice dashboard with sample data"><div className="preview-top"><span>YOUR INVOICE DESK</span><span className="sample-label">SAMPLE DATA</span></div>
        <div className="preview-balance"><span>Outstanding</span><strong>₹42,500<span>.00</span></strong><p>Three invoices. One clear view.</p></div>
        <div className="preview-row"><span className="client-mark">SN</span><div><strong>Studio North</strong><small>INV-014 · Due 12 Oct</small></div><b>₹18,000</b><span className="badge overdue">Overdue</span></div>
        <div className="preview-row"><span className="client-mark clay">AL</span><div><strong>Amber Labs</strong><small>INV-015 · Due 30 Oct</small></div><b>₹16,500</b><span className="badge pending">Pending</span></div>
        <div className="preview-row"><span className="client-mark blue">FF</span><div><strong>Field & Form</strong><small>INV-016 · Due 31 Oct</small></div><b>₹8,000</b><span className="badge pending">Pending</span></div>
        <div className="preview-note"><span aria-hidden="true">↗</span> A little less chasing. A little more clarity.</div></div></section>
    <div className="benefit-strip"><span>01 &nbsp; Capture the details</span><span>02 &nbsp; See what’s outstanding</span><span>03 &nbsp; Follow up with context</span></div>
    <section className="feature-section" id="features"><div className="section-heading"><p className="kicker">THE DETAILS, TAKEN CARE OF</p><h2>Your invoice list.<br/>With room to breathe.</h2><p>For the admin between finishing a project and confirming a payment.</p></div>
      <div className="feature-grid"><article><span className="feature-symbol" aria-hidden="true">▤</span><h3>One place for every record</h3><p>Add a client name, invoice number, amount and due date. Include an email address or notes when they help you keep the context.</p></article>
        <article><span className="feature-symbol" aria-hidden="true">◷</span><h3>A clearer view of what’s due</h3><p>Review outstanding and overdue totals. Filter pending, overdue and paid invoices, or search by client and invoice number.</p></article>
        <article><span className="feature-symbol" aria-hidden="true">↗</span><h3>Follow-ups you control</h3><p>Copy a reminder with the invoice details already filled in. Check the message before sending it through your usual communication tool.</p></article>
        <article><span className="feature-symbol" aria-hidden="true">↓</span><h3>Records you can take with you</h3><p>Edit invoice details, mark confirmed payments and export your current view as a CSV. Each account has its own invoice records.</p></article></div></section>
    <section className="how-section" id="how-it-works"><div><p className="kicker">A SIMPLE ROUTINE</p><h2>From “sent”<br/>to “settled.”</h2><a className="text-link" href="/guides/track-client-invoices">Read the invoice tracking guide ↗</a></div>
      <ol><li><h3>Add the invoice you sent</h3><p>Record the details from your existing invoice document. Use the agreed due date so your tracker reflects the arrangement with your client.</p></li>
        <li><h3>Check in on what’s unpaid</h3><p>See which invoices are still pending and which need attention. Confirm the latest payment status before preparing a reminder.</p></li>
        <li><h3>Follow up, then update</h3><p>Review and send your reminder yourself. Once you confirm that payment arrived, mark the invoice paid to keep your totals current.</p></li></ol></section>
    <section className="faq-section"><div className="section-heading"><p className="kicker">A FEW GOOD QUESTIONS</p><h2>Before you open your desk.</h2></div>
      <div>{faqs.map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
    <section className="closing-cta"><p className="kicker">MAKE SPACE FOR THE WORK</p><h2>Keep the next follow-up<br/>off the back of your mind.</h2><a className="button" href="/app">Open Invoice Desk ↗</a><a href="/guides/payment-reminder-examples">Need the right words? Read our payment reminder examples.</a></section>
    {<JsonLd data={{"@context":"https://schema.org","@graph":[{"@type":"WebSite",name:"Invoice Desk",...(site.url?{url:site.url}:{})},{"@type":"SoftwareApplication",name:"Invoice Desk",applicationCategory:"BusinessApplication",operatingSystem:"Web browser",description:"Track client invoices in INR, review unpaid balances and prepare manual payment reminders.",...(site.url?{url:site.url}:{})}]}}/>}
  </main><PublicFooter/></div>;
}
