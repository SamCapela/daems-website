import { AuroraBackground } from "../AuroraBackground";
import { LiveBadge } from "../LiveBadge";
import { TwitchSVG } from "../icons";
import { BROADCASTER } from "../../constants";

export function HeroSection({isLive,viewerCount}) {
  return (
    <section id="section-hero" style={{
      position:"relative",overflow:"hidden",
      width:"calc(100% + 64px)",marginLeft:-32,marginTop:-48,
      padding:"90px 32px 80px",
      minHeight:"90vh",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      textAlign:"center",
    }}>
      <AuroraBackground/>
      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:28,animation:"fadeInUp 0.8s ease both"}}>
        <LiveBadge isLive={isLive} viewerCount={viewerCount}/>
        <h1 style={{
          fontFamily:"var(--font-display)",
          fontSize:"clamp(5.5rem,16vw,13rem)",
          lineHeight:0.88,letterSpacing:"0.02em",
          background:"linear-gradient(135deg,#9146ff 0%,#ff6b9d 55%,#f5e642 100%)",
          backgroundSize:"200% 200%",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
          animation:"gradientShift 5s ease-in-out infinite",
        }}>DAEMS</h1>
        <p style={{fontFamily:"var(--font-body)",fontSize:"1.1rem",color:"var(--text-secondary)",maxWidth:480,lineHeight:1.65,fontWeight:400}}>
          Streamer Twitch FR — League of Legends · Valorant · Collabs · Just Chatting
        </p>
        <div style={{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center",marginTop:4}}>
          <a href={`https://www.twitch.tv/${BROADCASTER}`} target="_blank" rel="noreferrer" className="btn btn-twitch">
            <TwitchSVG/> Rejoindre sur Twitch
          </a>
          <a href={`https://www.twitch.tv/subs/${BROADCASTER}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{padding:"13px 32px",fontSize:"0.95rem"}}>
            S'abonner
          </a>
        </div>
      </div>
      <div style={{position:"absolute",bottom:36,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:6,opacity:0.35,animation:"scrollBounce 2s ease-in-out infinite"}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-muted)"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </section>
  );
}
