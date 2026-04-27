import { useReveal } from "../../hooks/useReveal";
import { useCountUp } from "../../hooks/useCountUp";
import { GOAL_FOLLOWERS, GOAL_SUBS } from "../../constants";

export function BentoStats({stats}) {
  const [ref,visible]=useReveal(0.18);
  const followCount=useCountUp(stats.followers,visible&&stats.followers!==null);
  const subCount=useCountUp(stats.subs,visible&&stats.subs!==null);
  const goalPct=stats.followers!==null?Math.min(100,(stats.followers/GOAL_FOLLOWERS)*100):0;
  const subPct=stats.subs!==null?Math.min(100,(stats.subs/GOAL_SUBS)*100):0;

  const reveal={opacity:visible?1:0,transform:visible?"none":"translateY(32px)",transition:"opacity 0.7s ease,transform 0.7s ease"};

  return (
    <section id="section-community" ref={ref} style={{padding:"72px 0",...reveal}}>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"0.05em",color:"var(--text-primary)",marginBottom:36,textAlign:"center"}}>LA COMMUNAUTÉ</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:18}}>
        <div style={{background:"linear-gradient(135deg,rgba(145,70,255,0.13),rgba(145,70,255,0.04))",border:"1px solid rgba(145,70,255,0.26)",borderRadius:"24px 8px 24px 8px",padding:"32px 28px",gridColumn:"span 2",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-50,right:-50,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(145,70,255,0.16),transparent)",pointerEvents:"none"}}/>
          <span style={{fontFamily:"var(--font-body)",fontSize:"0.72rem",color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.16em",fontWeight:600}}>Followers</span>
          <div style={{fontFamily:"var(--font-display)",fontSize:"clamp(3rem,7vw,5rem)",color:"var(--text-primary)",letterSpacing:"0.03em",lineHeight:1,marginTop:6}}>
            {stats.followers!==null?followCount.toLocaleString("fr-FR"):"—"}
          </div>
          <div style={{marginTop:18}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
              <span style={{fontSize:"0.7rem",color:"var(--text-muted)"}}>Objectif {GOAL_FOLLOWERS}</span>
              <span style={{fontSize:"0.7rem",color:"var(--color-brand-light)",fontWeight:700}}>{Math.round(goalPct)}%</span>
            </div>
            <div style={{height:7,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
              <div style={{width:`${goalPct}%`,height:"100%",background:"linear-gradient(90deg,#9146ff,#ff6b9d)",borderRadius:99,boxShadow:"0 0 14px rgba(145,70,255,0.55)",transition:"width 1.6s cubic-bezier(.4,0,.2,1)"}}/>
            </div>
          </div>
        </div>

        <div style={{background:"linear-gradient(135deg,rgba(255,107,157,0.12),rgba(255,107,157,0.04))",border:"1px solid rgba(255,107,157,0.26)",borderRadius:"8px 24px 8px 24px",padding:"32px 28px"}}>
          <span style={{fontFamily:"var(--font-body)",fontSize:"0.72rem",color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.16em",fontWeight:600}}>Abonnés</span>
          <div style={{fontFamily:"var(--font-display)",fontSize:"clamp(3rem,7vw,5rem)",color:"var(--text-primary)",letterSpacing:"0.03em",lineHeight:1,marginTop:6}}>
            {stats.subs!==null?subCount.toLocaleString("fr-FR"):"—"}
          </div>
          <div style={{marginTop:18}}>
            <div style={{height:7,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden",marginBottom:7}}>
              <div style={{width:`${subPct}%`,height:"100%",background:"linear-gradient(90deg,#ff6b9d,#f5e642)",borderRadius:99,boxShadow:"0 0 14px rgba(255,107,157,0.45)",transition:"width 1.6s cubic-bezier(.4,0,.2,1)"}}/>
            </div>
            <span style={{fontSize:"0.7rem",color:"rgba(255,107,157,0.7)",fontWeight:500}}>Objectif {GOAL_SUBS} · {Math.round(subPct)}%</span>
          </div>
        </div>

        <div style={{background:"linear-gradient(135deg,rgba(245,230,66,0.08),rgba(245,230,66,0.02))",border:"1px solid rgba(245,230,66,0.18)",borderRadius:18,padding:"32px 28px",display:"flex",flexDirection:"column",justifyContent:"space-between",gap:16}}>
          <span style={{fontFamily:"var(--font-body)",fontSize:"0.72rem",color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.16em",fontWeight:600}}>Statut</span>
          <div>
            <div style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",color:"#f5e642",letterSpacing:"0.06em"}}>AFFILIÉ</div>
            <div style={{fontSize:"0.72rem",color:"var(--text-muted)",marginTop:3}}>Twitch Affiliate</div>
          </div>
          <div style={{width:42,height:42,borderRadius:12,background:"rgba(245,230,66,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#f5e642"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
        </div>
      </div>
    </section>
  );
}
