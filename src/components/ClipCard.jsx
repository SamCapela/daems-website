export function ClipCard({clip}) {
  return (
    <a href={clip.url} target="_blank" rel="noreferrer" className="clip-card">
      <div style={{position:"relative"}}>
        <img src={clip.thumbnail_url} alt={clip.title} style={{width:"100%",aspectRatio:"16/9",objectFit:"cover",display:"block"}}/>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.2)"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(145,70,255,0.88)",borderRadius:"50%",width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px rgba(145,70,255,0.6)"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.72)",borderRadius:6,padding:"3px 8px",display:"flex",alignItems:"center",gap:5}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--color-brand-light)"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
          <span style={{color:"var(--color-brand-light)",fontWeight:700,fontSize:"0.72rem"}}>{clip.view_count?.toLocaleString("fr-FR")}</span>
        </div>
      </div>
      <div style={{padding:"12px 14px"}}>
        <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:"0.87rem",lineHeight:1.35,marginBottom:8,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{clip.title}</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.7rem",color:"var(--text-muted)"}}>
          <span>{clip.creator_name}</span>
          <span>{new Date(clip.created_at).toLocaleDateString("fr-FR")}</span>
        </div>
      </div>
    </a>
  );
}
