import { useBreakpoint } from "../hooks/useBreakpoint";
import { Icon, TwitchSVG } from "./icons";
import { NameBanner } from "./banners";
import { Badge } from "./ui";
import { BROADCASTER } from "../constants";

const NAV_ITEMS = [
  {
    id: "home",
    label: "Accueil",
    IC: Icon.Home,
    sub: [
      { label: "DAEMS",            anchor: "section-hero" },
      { label: "Le Stream",        anchor: "section-stream" },
      { label: "La Communauté",    anchor: "section-community" },
      { label: "Le Planning",      anchor: "planning" },
      { label: "La Roadmap",       anchor: "section-roadmap" },
      { label: "Qui est Daems ?",  anchor: "section-about" },
    ],
  },
  { id: "clips", label: "Clips",    IC: Icon.Clips, sub: [] },
  { id: "shop",  label: "Boutique", IC: Icon.Shop,  sub: [] },
];

const DOT = () => (
  <svg width="5" height="5" viewBox="0 0 5 5" fill="currentColor" style={{flexShrink:0,opacity:0.5}}>
    <circle cx="2.5" cy="2.5" r="2.5"/>
  </svg>
);

export function SideNav({
  tab, setTab, activeAnchor, setActiveAnchor,
  drawerOpen, setDrawerOpen,
  userInfo, isFollower, isSub, subMonths, bannerTier, subDuration, onLogout,
}) {
  const { isMobile } = useBreakpoint();

  const scrollTo = (anchor) => {
    setActiveAnchor(anchor);
    document.getElementById(anchor)?.scrollIntoView({behavior:"smooth"});
    if (isMobile) setDrawerOpen(false);
  };

  const handleTab = (id) => {
    setTab(id);
    if (isMobile) setDrawerOpen(false);
  };

  const logoWidth = isMobile ? 170 : 225;

  const navBody = (
    <>
      <div className="sidenav-logo">
        <img src="/logo-daems.png" alt="daems_" style={{width:logoWidth,objectFit:"contain"}}/>
      </div>
      <div className="sidenav-divider"/>

      {NAV_ITEMS.map(({id,label,IC,sub})=>(
        <div key={id}>
          <button className={`sidenav-item${tab===id?" active":""}`} onClick={()=>handleTab(id)}>
            <IC/>{label}
          </button>
          {tab===id&&sub.length>0&&(
            <div style={{paddingBottom:6}}>
              {sub.map(({label:sl,anchor})=>(
                <button
                  key={anchor}
                  className={`sidenav-sub${activeAnchor===anchor?" active":""}`}
                  onClick={()=>scrollTo(anchor)}
                >
                  <DOT/>{sl}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Profil dans le drawer (mobile uniquement) */}
      {isMobile&&userInfo&&(
        <div style={{marginTop:"auto",padding:"16px 14px",borderTop:"1px solid rgba(145,70,255,0.14)"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,marginBottom:12}}>
            <img src={userInfo.profile_image_url} alt="" style={{width:44,height:44,borderRadius:"50%",border:"2px solid rgba(145,70,255,0.5)",boxShadow:"0 0 14px rgba(145,70,255,0.3)"}}/>
            <NameBanner username={userInfo.display_name} tier={bannerTier} size="sm" subDuration={subDuration}/>
          </div>
          {(isFollower||isSub)&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center",marginBottom:12}}>
              {isFollower&&<Badge color="#ef4444"><Icon.Heart/>Follow</Badge>}
              {isSub&&<Badge color="#9146ff"><Icon.Star/>Sub{subMonths?` · ${subMonths}m`:""}</Badge>}
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:8}}>
            <a href={`https://www.twitch.tv/${BROADCASTER}`} target="_blank" rel="noreferrer" className="btn btn-twitch btn-sm" style={{justifyContent:"center"}}>
              <TwitchSVG/> Twitch
            </a>
            {!isSub&&(
              <a href={`https://www.twitch.tv/subs/${BROADCASTER}`} target="_blank" rel="noreferrer" className="btn btn-accent btn-sm" style={{justifyContent:"center"}}>
                <Icon.Star/>S'abonner
              </a>
            )}
          </div>
          <button
            onClick={()=>{setDrawerOpen(false);onLogout();}}
            style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:"none",border:"none",cursor:"pointer",color:"rgba(255,100,100,0.7)",fontSize:"0.75rem",fontFamily:"inherit",padding:"6px 0",borderRadius:6,transition:"color 0.15s"}}
          >
            <Icon.Logout/>Se déconnecter
          </button>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        {drawerOpen&&(
          <div className="mobile-overlay" onClick={()=>setDrawerOpen(false)}/>
        )}
        <aside className={`mobile-drawer${drawerOpen?" open":""}`}>
          {navBody}
        </aside>
      </>
    );
  }

  return <aside className="sidebar-left">{navBody}</aside>;
}
