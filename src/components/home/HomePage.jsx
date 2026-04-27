import { BROADCASTER } from "../../constants";
import { HeroSection } from "./HeroSection";
import { OfflineCard } from "./OfflineCard";
import { TwitchChat } from "./TwitchChat";
import { ActivityTicker } from "./ActivityTicker";
import { BentoStats } from "./BentoStats";
import { PlanningSection } from "./PlanningSection";
import { RoadmapSection } from "./RoadmapSection";
import { AboutSection } from "./AboutSection";

export function HomePage({token,userInfo,ircMessages,connected,sendIRC,parseBadges,isLive,viewerCount,stats}) {
  return (
    <div>
      <HeroSection isLive={isLive} viewerCount={viewerCount}/>

      <div id="section-stream" style={{padding:"48px 0 32px"}}>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"clamp(1.8rem,4vw,2.8rem)",letterSpacing:"0.05em",color:"var(--text-primary)",marginBottom:24}}>LE STREAM</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16,minHeight:460}}>
          <div style={{borderRadius:16,overflow:"hidden",border:"1px solid rgba(145,70,255,0.26)",boxShadow:"0 0 40px rgba(145,70,255,0.1)"}}>
            {isLive===false?(
              <OfflineCard/>
            ):(
              <iframe src={`https://player.twitch.tv/?channel=${BROADCASTER}&parent=${window.location.hostname}&autoplay=false`}
                height="100%" width="100%" style={{display:"block",minHeight:420,border:"none"}} allowFullScreen/>
            )}
          </div>
          <TwitchChat ircMessages={ircMessages} connected={connected} sendIRC={sendIRC} parseBadges={parseBadges} userInfo={userInfo}/>
        </div>
      </div>

      <ActivityTicker token={token}/>
      <BentoStats stats={stats}/>
      <PlanningSection/>
      <RoadmapSection/>
      <AboutSection/>
    </div>
  );
}
