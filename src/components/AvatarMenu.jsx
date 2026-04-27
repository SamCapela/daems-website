import { useState, useEffect, useRef } from "react";
import { Icon, TwitchSVG } from "./icons";
import { Badge } from "./ui";

export function AvatarMenu({userInfo,isFollower,isSub,subMonths,onLogout}) {
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    const h=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:8}}>
        <img src={userInfo.profile_image_url} alt="" style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${open?"#9146ff":"rgba(145,70,255,0.4)"}`,transition:"border-color 0.2s",boxShadow:open?"0 0 14px rgba(145,70,255,0.5)":"none"}}/>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--text-muted)" style={{transform:open?"rotate(180deg)":"",transition:"transform 0.2s"}}><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      {open&&(
        <div className="avatar-dropdown">
          <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(145,70,255,0.14)",background:"rgba(145,70,255,0.07)"}}>
            <div style={{fontFamily:"var(--font-body)",color:"var(--text-primary)",fontWeight:700,fontSize:"0.95rem"}}>{userInfo.display_name}</div>
            <div style={{display:"flex",gap:5,marginTop:7}}>
              {isFollower&&<Badge color="#ef4444"><Icon.Heart/>Follow</Badge>}
              {isSub&&<Badge color="#9146ff"><Icon.Star/>Sub {subMonths?`· ${subMonths}m`:""}</Badge>}
            </div>
          </div>
          <div style={{padding:"6px 0"}}>
            <a href={`https://www.twitch.tv/${userInfo.login}`} target="_blank" rel="noreferrer" className="avatar-menu-link">
              <TwitchSVG/> Voir mon profil Twitch
            </a>
            <div style={{height:1,background:"rgba(145,70,255,0.1)",margin:"4px 0"}}/>
            <button onClick={()=>{setOpen(false);onLogout();}} className="avatar-menu-btn">
              <Icon.Logout/> Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
