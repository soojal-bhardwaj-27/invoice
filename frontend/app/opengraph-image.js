import {ImageResponse} from "next/og";
export const alt = "Invoice Desk — keep client invoices in view";
export const size = {width: 1200, height: 630};
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(<div style={{display:"flex",flexDirection:"column",width:"100%",height:"100%",padding:"70px",background:"#0f172a",color:"#f8fafc",fontFamily:"sans-serif"}}>
    <div style={{display:"flex",fontSize:32,fontWeight:700,color:"#818cf8"}}>invoice desk</div>
    <div style={{display:"flex",fontSize:76,fontWeight:700,lineHeight:1.1,marginTop:70,maxWidth:950}}>Keep client invoices in view.</div>
    <div style={{display:"flex",fontSize:29,color:"#94a3b8",marginTop:35}}>Track due dates. See unpaid balances. Prepare follow-ups.</div>
  </div>, size);
}
