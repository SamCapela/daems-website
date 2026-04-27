import { RaccoonIcon, RaccoonMascot, TwitchSVG } from "./icons";

export function LoginPage({onLogin}) {
  return (
    <div className="login-page">
      <div className="login-glow-1"/><div className="login-glow-2"/>
      <div className="login-inner">
        <div className="login-text">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <RaccoonIcon size={36}/>
            <span style={{fontFamily:"var(--font-display)",fontSize:"2rem",letterSpacing:"0.06em",color:"var(--text-primary)"}}>
              DAEMS<span style={{color:"var(--color-accent)",animation:"underscoreBlink 2s ease-in-out infinite",display:"inline-block"}}>_</span>
            </span>
          </div>
          <h1 className="login-title">Le QG officiel<br/>de la <span className="acc">communauté</span></h1>
          <p className="login-subtitle">Rejoins la meute, suis le stream en direct, débloque ta bannière exclusive et accède à tous les contenus réservés à la communauté.</p>
          <div className="login-features">
            {["Bannière de fidélité selon tes mois d'abonnement","Chat live intégré directement sur le site","Clips et meilleurs moments de daems_","Boutique exclusive — bientôt disponible"].map((f,i)=>(
              <div key={i} className="login-feature"><div className="login-feature-dot"/>{f}</div>
            ))}
          </div>
          <button onClick={onLogin} className="btn btn-twitch"><TwitchSVG/> Se connecter avec Twitch</button>
          <p className="login-disclaimer">Site fan non affilié à Twitch Inc.</p>
        </div>
        <div className="login-mascot">
          <div className="login-mascot-glow"/>
          <RaccoonMascot size={300} style={{animation:"raccoonFloat 4s ease-in-out infinite",filter:"drop-shadow(0 22px 28px rgba(145,70,255,0.32))"}}/>
        </div>
      </div>
    </div>
  );
}
