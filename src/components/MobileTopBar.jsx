function BurgerIcon({open}) {
  return open ? (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <line x1="5" y1="5" x2="17" y2="17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="17" y1="5" x2="5" y2="17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <line x1="3" y1="6"    x2="19" y2="6"    stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="3" y1="11"   x2="19" y2="11"   stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="3" y1="16"   x2="19" y2="16"   stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function MobileTopBar({drawerOpen, setDrawerOpen, userInfo}) {
  return (
    <header className="mobile-topbar">
      <img src="/logo-daems.png" alt="daems_" style={{height:38,objectFit:"contain"}}/>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {userInfo&&(
          <img src={userInfo.profile_image_url} alt="" style={{width:30,height:30,borderRadius:"50%",border:"1.5px solid rgba(145,70,255,0.55)"}}/>
        )}
        <button
          onClick={()=>setDrawerOpen(o=>!o)}
          style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-primary)",display:"flex",alignItems:"center",padding:6,borderRadius:8,transition:"background 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(145,70,255,0.12)"}
          onMouseLeave={e=>e.currentTarget.style.background="none"}
        >
          <BurgerIcon open={drawerOpen}/>
        </button>
      </div>
    </header>
  );
}
