import { useReveal } from "../../hooks/useReveal";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { RaccoonMascot, TwitchSVG } from "../icons";
import { BROADCASTER } from "../../constants";

export function AboutSection() {
  const [ref,visible]=useReveal(0.15);
  const { isMobile } = useBreakpoint();
  return (
    <section id="section-about" ref={ref} style={{
      padding:"72px 0 96px",
      display:"grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
      gap: isMobile ? 32 : 56,
      alignItems:"center",
      opacity:visible?1:0,
      transform:visible?"none":"translateY(32px)",
      transition:"opacity 0.7s ease 0.15s,transform 0.7s ease 0.15s",
    }}>
      {isMobile&&(
        <div style={{display:"flex",justifyContent:"center",animation:"raccoonFloat 5s ease-in-out infinite",filter:"drop-shadow(0 16px 32px rgba(145,70,255,0.3))"}}>
          <RaccoonMascot size={160}/>
        </div>
      )}
      <div>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"0.05em",color:"var(--text-primary)",marginBottom:24}}>QUI EST DAEMS ?</h2>
        <p style={{fontFamily:"var(--font-body)",fontSize:"1.05rem",color:"var(--text-secondary)",lineHeight:1.82,maxWidth:520}}>
          Daems_, c'est un streamer FR passionné qui mélange gaming compétitif, moments détente et collabs communautaires. De League of Legends à Valorant en passant par les Just Chatting en famille — chaque stream est une nouvelle aventure avec la meute du raton couronné.
        </p>
        <div style={{display:"flex",gap:12,marginTop:28,flexWrap:"wrap"}}>
          <a href={`https://www.twitch.tv/${BROADCASTER}`} target="_blank" rel="noreferrer" className="btn btn-twitch"><TwitchSVG/> Suivre sur Twitch</a>
        </div>
      </div>
      {!isMobile&&(
        <div style={{animation:"raccoonFloat 5s ease-in-out infinite",filter:"drop-shadow(0 24px 48px rgba(145,70,255,0.32))"}}>
          <RaccoonMascot size={220}/>
        </div>
      )}
    </section>
  );
}
