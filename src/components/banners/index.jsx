export function formatSubDuration(months) {
  if(!months) return null;
  if(months<12) return `${months} mois`;
  const y=Math.floor(months/12),m=months%12;
  if(m===0) return y===1?"1 an":`${y} ans`;
  return `${y} an${y>1?"s":""} et ${m} mois`;
}

export function getBannerTier(subMonths,isSub) {
  if(!isSub||subMonths===null) return 0;
  if(subMonths<3) return 1; if(subMonths<6) return 2; if(subMonths<12) return 3; return 4;
}

export const RANKS=[{name:"Bronze",stars:1},{name:"Silver",stars:2},{name:"Gold",stars:3},{name:"Platinum",stars:4},{name:"Diamond",stars:5}];

export const bannerStyles=[
  {bg:"linear-gradient(135deg,#6B3A1F 0%,#C8956C 45%,#7B4A2F 100%)",border:"2px solid #A06030",shadow:"0 0 10px #5A3010aa,inset 0 1px 0 rgba(255,200,130,0.25)",textColor:"#FFE0A0",textShadow:"1px 2px 6px #3a2010,0 0 10px rgba(200,120,40,0.4)",starColor:"#FFD700",starGlow:"rgba(200,140,60,0.6)",shimmer:false,subColor:"#FFD070"},
  {bg:"linear-gradient(135deg,#6A7D8E 0%,#BDD0E0 45%,#7A8D9E 100%)",border:"2px solid #8AAABB",shadow:"0 0 14px rgba(160,200,230,0.3),inset 0 1px 0 rgba(255,255,255,0.3)",textColor:"#E8F4FF",textShadow:"1px 2px 4px #304050,0 0 12px rgba(150,200,255,0.5)",starColor:"#C8E0F8",starGlow:"rgba(150,200,240,0.6)",shimmer:false,subColor:"#A8D0F0"},
  {bg:"linear-gradient(135deg,#A07010 0%,#FFD700 40%,#FFA800 70%,#A07010 100%)",border:"2px solid #FFD700",shadow:"0 0 22px rgba(255,200,0,0.5),inset 0 1px 0 rgba(255,255,200,0.4)",textColor:"#FFF8DC",textShadow:"1px 2px 4px #6B4400,0 0 14px rgba(255,210,0,0.7)",starColor:"#FFFACD",starGlow:"rgba(255,210,0,0.7)",shimmer:false,subColor:"#FFE080"},
  {bg:"linear-gradient(135deg,#5A3A8C 0%,#C0A0F0 35%,#8060C0 65%,#6040A0 100%)",border:"2px solid #A080E0",shadow:"0 0 22px rgba(170,120,255,0.45),inset 0 1px 0 rgba(220,180,255,0.35)",textColor:"#F0E8FF",textShadow:"1px 2px 4px #3A2060,0 0 16px rgba(180,130,255,0.7)",starColor:"#DCC8FF",starGlow:"rgba(180,130,255,0.7)",shimmer:false,subColor:"#D0B0FF"},
  {bg:"linear-gradient(135deg,#050D1A 0%,#0E2550 35%,#081830 65%,#020810 100%)",border:"2px solid #3A9AFF",shadow:"0 0 28px rgba(50,150,255,0.65),0 0 55px rgba(50,150,255,0.2),inset 0 1px 0 rgba(100,180,255,0.2)",textColor:"#70D8FF",textShadow:"0 0 12px #38B0FF,0 0 24px #0070FF,1px 2px 6px #000",starColor:"#50D0FF",starGlow:"rgba(50,160,255,0.8)",shimmer:true,subColor:"#60C8FF"},
];

export function NameBanner({username,tier=0,size="md",subDuration=null}) {
  const s=bannerStyles[tier],r=RANKS[tier];
  const [w,h,fs]=({lg:[340,62,"1.25rem"],md:[240,46,"0.95rem"],sm:[200,38,"0.82rem"]})[size];
  const starSz=size==="sm"?10:size==="lg"?14:11;
  return (
    <div style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <div style={{display:"flex",gap:3}}>
        {Array.from({length:r.stars}).map((_,i)=>(
          <svg key={i} width={starSz} height={starSz} viewBox="0 0 24 24" fill={s.starColor} style={{filter:`drop-shadow(0 0 3px ${s.starGlow})`}}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      <div style={{position:"relative",width:w,height:h,background:s.bg,border:s.border,borderRadius:9,boxShadow:s.shadow,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:2,borderRadius:7,border:"1px solid rgba(255,255,255,0.12)",pointerEvents:"none"}}/>
        {s.shimmer&&<div style={{position:"absolute",inset:0,background:"linear-gradient(105deg,transparent 38%,rgba(80,180,255,0.12) 50%,transparent 62%)",animation:"shimmer 2.5s infinite"}}/>}
        <span style={{color:s.textColor,fontFamily:"'Cinzel','Georgia',serif",fontWeight:700,fontSize:fs,letterSpacing:"0.07em",textShadow:s.textShadow,zIndex:1,padding:"0 10px",maxWidth:w-20,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{username}</span>
      </div>
      {subDuration&&<div style={{fontSize:size==="sm"?"0.64rem":"0.72rem",color:s.subColor,fontFamily:"monospace",letterSpacing:"0.1em",textTransform:"uppercase",opacity:0.9,display:"flex",alignItems:"center",gap:4}}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill={s.subColor}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        {subDuration}
      </div>}
    </div>
  );
}

export function MiniUserBanner({name,color,subMonths}) {
  const tier=getBannerTier(subMonths,true),s=bannerStyles[tier];
  return (
    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:s.bg,border:s.border,borderRadius:5,boxShadow:s.shadow,padding:"2px 10px",height:22,position:"relative",overflow:"hidden"}}>
      {s.shimmer&&<span style={{position:"absolute",inset:0,background:"linear-gradient(105deg,transparent 38%,rgba(80,180,255,0.15) 50%,transparent 62%)",animation:"shimmer 2.5s infinite"}}/>}
      <span style={{color:s.textColor,fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"0.75rem",letterSpacing:"0.05em",textShadow:s.textShadow,zIndex:1,whiteSpace:"nowrap"}}>{name}</span>
    </span>
  );
}
