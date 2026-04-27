import { useState, useEffect } from "react";

export function ActivityTicker({token}) {
  const [items,setItems]=useState([]);
  useEffect(()=>{
    if(!token) return;
    fetch(`${window.location.origin}/api/recent-activity`).then(r=>r.json()).then(d=>{const l=d.data||[];if(l.length>0)setItems([...l,...l]);}).catch(()=>{});
  },[token]);
  if(items.length===0) return null;
  const typeClass=(type)=>type==="sub"?"ticker-item-sub":type==="subgift"?"ticker-item-gift":"ticker-item-cheer";
  return (
    <div style={{position:"relative",overflow:"hidden",background:"rgba(145,70,255,0.05)",border:"1px solid rgba(145,70,255,0.13)",borderRadius:14,padding:"11px 0",margin:"0 0 24px"}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:80,background:"linear-gradient(to right,var(--bg-base),transparent)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:80,background:"linear-gradient(to left,var(--bg-base),transparent)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,padding:"0 20px"}}>
        <span style={{fontFamily:"var(--font-body)",fontSize:"0.72rem",color:"var(--text-muted)",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>Activité récente</span>
        <div style={{flex:1,height:1,background:"rgba(145,70,255,0.14)"}}/>
      </div>
      <div style={{display:"flex",gap:10,padding:"2px 20px",animation:"ticker 90s linear infinite",width:"max-content"}}>
        {items.map((item,i)=>(
          <div key={i} className={typeClass(item.type)}
            style={{display:"flex",alignItems:"center",gap:8,background:"rgba(145,70,255,0.1)",border:"1px solid rgba(145,70,255,0.22)",borderRadius:20,padding:"5px 14px",whiteSpace:"nowrap",flexShrink:0}}>
            <span style={{fontSize:"0.82rem"}}>{item.icon}</span>
            <span style={{color:"var(--text-primary)",fontWeight:700,fontSize:"0.8rem"}}>{item.name}</span>
            <span style={{color:"var(--text-muted)",fontSize:"0.7rem"}}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
