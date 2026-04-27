export function LiveBadge({isLive,viewerCount}) {
  if (isLive===null) return null;
  if (isLive) return (
    <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(239,68,68,0.14)",border:"1px solid rgba(239,68,68,0.42)",borderRadius:99,padding:"7px 18px"}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"livePulse 1.4s ease-in-out infinite"}}/>
      <span style={{fontFamily:"var(--font-display)",fontSize:"0.9rem",color:"#ef4444",letterSpacing:"0.1em"}}>EN LIVE</span>
      {viewerCount>0&&<span style={{fontSize:"0.75rem",color:"rgba(239,68,68,0.75)",fontFamily:"var(--font-body)",fontWeight:500}}>· {viewerCount.toLocaleString("fr-FR")} viewers</span>}
    </div>
  );
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(145,70,255,0.12)",border:"1px solid rgba(145,70,255,0.3)",borderRadius:99,padding:"7px 18px"}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:"var(--color-brand)",opacity:0.7}}/>
      <span style={{fontFamily:"var(--font-body)",fontSize:"0.82rem",color:"var(--color-brand-light)",fontWeight:500}}>Hors ligne — voir le planning</span>
    </div>
  );
}
