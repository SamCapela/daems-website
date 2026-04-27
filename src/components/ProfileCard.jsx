import { NameBanner } from "./banners";
import { Badge } from "./ui";
import { Icon, TwitchSVG } from "./icons";
import { BROADCASTER } from "../constants";

export function ProfileCard({userInfo, isFollower, isSub, subMonths, bannerTier, subDuration, onLogout}) {
  if (!userInfo) return null;

  return (
    <aside className="profile-card-fixed">
      {/* Avatar */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <img
          src={userInfo.profile_image_url}
          alt={userInfo.display_name}
          style={{width:56,height:56,borderRadius:"50%",border:"2px solid rgba(145,70,255,0.5)",boxShadow:"0 0 18px rgba(145,70,255,0.35)"}}
        />
        <NameBanner username={userInfo.display_name} tier={bannerTier} size="sm" subDuration={subDuration}/>
      </div>

      {/* Badges */}
      {(isFollower||isSub)&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center"}}>
          {isFollower&&<Badge color="#ef4444"><Icon.Heart/>Follow</Badge>}
          {isSub&&<Badge color="#9146ff"><Icon.Star/>Sub{subMonths?` · ${subMonths}m`:""}</Badge>}
        </div>
      )}

      {/* Divider */}
      <div style={{height:1,background:"rgba(145,70,255,0.14)",margin:"2px 0"}}/>

      {/* Actions */}
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        <a
          href={`https://www.twitch.tv/${BROADCASTER}`}
          target="_blank" rel="noreferrer"
          className="btn btn-twitch btn-sm"
          style={{width:"100%",justifyContent:"center"}}
        >
          <TwitchSVG/> Twitch
        </a>
        {!isSub&&(
          <a
            href={`https://www.twitch.tv/subs/${BROADCASTER}`}
            target="_blank" rel="noreferrer"
            className="btn btn-accent btn-sm"
            style={{width:"100%",justifyContent:"center"}}
          >
            <Icon.Star/>S'abonner
          </a>
        )}
      </div>

      {/* Logout — poussé en bas */}
      <div style={{marginTop:"auto"}}>
        <div style={{height:1,background:"rgba(145,70,255,0.1)",marginBottom:10}}/>
        <button
          onClick={onLogout}
          style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:"none",border:"none",cursor:"pointer",color:"rgba(255,100,100,0.7)",fontSize:"0.75rem",fontFamily:"inherit",padding:"6px 4px",borderRadius:6,transition:"all 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.color="#ff6868";e.currentTarget.style.background="rgba(255,60,60,0.08)";}}
          onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,100,100,0.7)";e.currentTarget.style.background="none";}}
        >
          <Icon.Logout/>Se déconnecter
        </button>
      </div>
    </aside>
  );
}
