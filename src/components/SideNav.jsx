import { Icon } from "./icons";

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

export function SideNav({tab, setTab, activeAnchor, setActiveAnchor}) {
  const scrollTo = (anchor) => {
    setActiveAnchor(anchor);
    document.getElementById(anchor)?.scrollIntoView({behavior:"smooth"});
  };

  return (
    <aside className="sidebar-left">
      <div className="sidenav-logo">
        <img src="/logo-daems.png" alt="daems_" style={{width:150,objectFit:"contain"}}/>
      </div>
      <div className="sidenav-divider"/>

      {NAV_ITEMS.map(({id, label, IC, sub}) => (
        <div key={id}>
          <button
            className={`sidenav-item${tab===id?" active":""}`}
            onClick={()=>setTab(id)}
          >
            <IC/>{label}
          </button>

          {tab===id && sub.length>0 && (
            <div style={{paddingBottom:6}}>
              {sub.map(({label:sl, anchor})=>(
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
    </aside>
  );
}
