import { useState } from "react";
import { useReveal } from "../hooks/useReveal";

export function ShopPage() {
  const [email,setEmail]=useState("");
  const [submitted,setSubmitted]=useState(false);
  const [ref,visible]=useReveal(0.1);

  const MYSTERY=[
    {label:"T-Shirt Raton",   tease:"Coton premium"},
    {label:"Hoodie DAEMS",    tease:"Édition limitée"},
    {label:"Poster Signé",    tease:"Art exclusif"},
  ];

  return (
    <div ref={ref} style={{opacity:visible?1:0,transform:visible?"none":"translateY(22px)",transition:"opacity 0.6s ease,transform 0.6s ease"}}>
      <div style={{textAlign:"center",padding:"72px 40px",position:"relative",overflow:"hidden",borderRadius:"24px 8px 24px 8px",background:"linear-gradient(135deg,rgba(145,70,255,0.08),rgba(255,107,157,0.06))",border:"1px solid rgba(145,70,255,0.2)",marginBottom:56}}>
        <div style={{position:"absolute",top:-80,left:"20%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(145,70,255,0.18),transparent)",filter:"blur(70px)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-60,right:"10%",width:320,height:320,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,107,157,0.14),transparent)",filter:"blur(60px)",pointerEvents:"none"}}/>
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.04,pointerEvents:"none"}} aria-hidden="true">
          <filter id="noiseS"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
          <rect width="100%" height="100%" filter="url(#noiseS)"/>
        </svg>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{animation:"raccoonFloat 4s ease-in-out infinite",display:"inline-block",marginBottom:24}}>
            <img src="/logo-round.png" alt="daems_" style={{width:120,height:120,objectFit:"contain"}}/>
          </div>
          <h1 style={{fontFamily:"var(--font-display)",fontSize:"clamp(2.5rem,7vw,5rem)",letterSpacing:"0.04em",color:"var(--text-primary)",marginBottom:14}}>LA BOUTIQUE DU RATON</h1>
          <p style={{fontFamily:"var(--font-body)",fontSize:"1.05rem",color:"var(--text-secondary)",marginBottom:36,maxWidth:420,margin:"0 auto 36px"}}>Des merches exclusifs en préparation — le raton est aux fourneaux.</p>
          {!submitted?(
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",maxWidth:480,margin:"0 auto"}}>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&email.includes("@")&&setSubmitted(true)}
                placeholder="ton@email.com" className="shop-email-input"/>
              <button onClick={()=>email.includes("@")&&setSubmitted(true)} className="btn btn-twitch" style={{whiteSpace:"nowrap",padding:"12px 24px"}}>
                Préviens-moi au lancement
              </button>
            </div>
          ):(
            <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:99,padding:"12px 24px"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#10b981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              <span style={{color:"#10b981",fontWeight:700,fontSize:"0.9rem",fontFamily:"var(--font-body)"}}>Parfait ! On te préviendra au lancement.</span>
            </div>
          )}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
        {MYSTERY.map((item,i)=>(
          <div key={i} style={{borderRadius:"20px 6px 20px 6px",background:"rgba(145,70,255,0.04)",border:"1px solid rgba(145,70,255,0.13)",padding:"48px 24px",display:"flex",flexDirection:"column",alignItems:"center",gap:18,position:"relative",overflow:"hidden"}}>
            <div style={{width:110,height:110,borderRadius:20,background:`linear-gradient(135deg,rgba(145,70,255,${0.15+i*0.05}),rgba(255,107,157,${0.1+i*0.03}))`,filter:"blur(14px)",boxShadow:"0 8px 32px rgba(145,70,255,0.18)"}}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.06em",color:"rgba(145,70,255,0.45)"}}>{item.label}</div>
              <div style={{fontSize:"0.72rem",color:"var(--text-muted)",marginTop:4,fontFamily:"var(--font-body)"}}>{item.tease}</div>
            </div>
            <div style={{background:"rgba(145,70,255,0.12)",border:"1px solid rgba(145,70,255,0.22)",color:"rgba(145,70,255,0.6)",borderRadius:99,padding:"4px 14px",fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em"}}>BIENTÔT</div>
            <div style={{position:"absolute",inset:0,backdropFilter:"blur(2px)",background:"rgba(10,0,16,0.08)",pointerEvents:"none"}}/>
          </div>
        ))}
      </div>
    </div>
  );
}
