import { useState, useEffect } from "react";
import './index.css';

import { CLIENT_ID, REDIRECT_URI, BROADCASTER_ID, SCOPES, twitchGet } from "./constants";
import { useIRC } from "./hooks/useIRC";
import { useStreamStatus } from "./hooks/useStreamStatus";
import { useBreakpoint } from "./hooks/useBreakpoint";
import { formatSubDuration, getBannerTier } from "./components/banners";
import { LoadSpinner } from "./components/ui";
import { LoginPage } from "./components/LoginPage";
import { SideNav } from "./components/SideNav";
import { MobileTopBar } from "./components/MobileTopBar";
import { ProfileCard } from "./components/ProfileCard";
import { HomePage } from "./components/home/HomePage";
import { ClipsPage } from "./components/ClipsPage";
import { ShopPage } from "./components/ShopPage";

export default function App() {
  const [token,setToken]               = useState(()=>localStorage.getItem("tw_token"));
  const [userInfo,setUserInfo]         = useState(null);
  const [isFollower,setIsFollower]     = useState(false);
  const [isSub,setIsSub]               = useState(false);
  const [tab,setTab]                   = useState("home");
  const [activeAnchor,setActiveAnchor] = useState("section-hero");
  const [booting,setBooting]           = useState(true);
  const [stats,setStats]               = useState({followers:null,subs:null});
  const [drawerOpen,setDrawerOpen]     = useState(false);

  const {subMonths,ircMessages,connected,sendIRC,parseBadges} = useIRC(token, userInfo?.login);
  const {isLive,viewerCount} = useStreamStatus(token);
  const { isMobile } = useBreakpoint();
  const subDuration = isSub ? formatSubDuration(subMonths) : null;
  const bannerTier  = getBannerTier(subMonths, isSub);

  // Ferme le drawer si on passe en desktop
  useEffect(()=>{ if (!isMobile) setDrawerOpen(false); },[isMobile]);

  useEffect(()=>{
    window.__forceUnsub=()=>setIsSub(false);
    window.__resetSub=()=>setIsSub(true);
    return ()=>{ delete window.__forceUnsub; delete window.__resetSub; };
  },[]);

  const login=()=>{
    window.location.href=`https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&force_verify=false`;
  };
  const logout=()=>{
    localStorage.removeItem("tw_token");
    setToken(null);setUserInfo(null);setIsFollower(false);setIsSub(false);
  };

  useEffect(()=>{
    const hash=window.location.hash;
    if(hash.includes("access_token=")){
      const p=new URLSearchParams(hash.slice(1));
      const t=p.get("access_token");
      if(t){localStorage.setItem("tw_token",t);setToken(t);window.history.replaceState(null,"",window.location.pathname);}
    }
  },[]);

  useEffect(()=>{
    if(!token){setBooting(false);return;}
    setBooting(true);
    twitchGet("/users",token)
      .then(async d=>{
        const u=d.data?.[0];
        if(!u) throw new Error("no user");
        setUserInfo(u);
        try{const f=await twitchGet("/channels/followed",token,{user_id:u.id,broadcaster_id:BROADCASTER_ID});setIsFollower((f.data?.length??0)>0);}catch{setIsFollower(false);}
        try{const s=await twitchGet("/subscriptions/user",token,{broadcaster_id:BROADCASTER_ID,user_id:u.id});setIsSub(Array.isArray(s.data)&&s.data.length>0);}catch{setIsSub(false);}
      })
      .catch(()=>{localStorage.removeItem("tw_token");setToken(null);})
      .finally(()=>setBooting(false));
  },[token]);

  useEffect(()=>{
    if(!token) return;
    Promise.all([
      twitchGet("/channels/followers",token,{broadcaster_id:BROADCASTER_ID,first:1}),
      fetch(`${window.location.origin}/api/sub-count`).then(r=>r.ok?r.json():{total:null}).catch(()=>({total:null})),
    ]).then(([f,s])=>setStats({followers:f.total??null,subs:s.total??null})).catch(()=>{});
  },[token]);

  useEffect(()=>{
    if(!token||!userInfo||subMonths===null) return;
    fetch(`${window.location.origin}/api/store-viewer`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,user_id:userInfo.id,display_name:userInfo.display_name,sub_months:subMonths,is_sub:isSub})}).catch(()=>{});
  },[token,userInfo?.id,subMonths,isSub]);

  if(!token) return <LoginPage onLogin={login}/>;
  if(booting) return (
    <div className="app-wrapper" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <LoadSpinner/>
    </div>
  );

  const sideNavProps = {
    tab, setTab, activeAnchor, setActiveAnchor,
    drawerOpen, setDrawerOpen,
    userInfo, isFollower, isSub, subMonths, bannerTier, subDuration,
    onLogout: logout,
  };

  return (
    <div className="app-wrapper">
      {isMobile&&(
        <MobileTopBar drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} userInfo={userInfo}/>
      )}

      <SideNav {...sideNavProps}/>

      <main className="app-main">
        {tab==="home"  && <HomePage token={token} userInfo={userInfo} ircMessages={ircMessages} connected={connected} sendIRC={sendIRC} parseBadges={parseBadges} isLive={isLive} viewerCount={viewerCount} stats={stats}/>}
        {tab==="clips" && <ClipsPage token={token}/>}
        {tab==="shop"  && <ShopPage/>}
      </main>

      {!isMobile&&(
        <ProfileCard
          userInfo={userInfo}
          isFollower={isFollower}
          isSub={isSub}
          subMonths={subMonths}
          bannerTier={bannerTier}
          subDuration={subDuration}
          onLogout={logout}
        />
      )}
    </div>
  );
}
