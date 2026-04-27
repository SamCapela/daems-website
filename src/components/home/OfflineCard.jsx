import { useState, useEffect } from "react";
import { RaccoonMascot, Icon } from "../icons";
import { SCHEDULE } from "../../constants";

function NextStreamLabel() {
  const [label,setLabel]=useState("");
  useEffect(()=>{
    const update=()=>{
      const now=new Date();
      const todayIdx=now.getDay()===0?6:now.getDay()-1;
      let found=null;
      for(let i=0;i<=7;i++){
        const idx=(todayIdx+i)%7;
        if(SCHEDULE[idx].type!=="OFF"){
          if(i===0&&now.getHours()<20){found={idx,days:0};break;}
          else if(i>0){found={idx,days:i};break;}
        }
      }
      if(!found){setLabel("");return;}
      const s=SCHEDULE[found.idx];
      if(found.days===0){
        const next=new Date(now);next.setHours(20,0,0,0);
        const diff=next-now;
        const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000);
        setLabel(`Aujourd'hui à 20h — dans ${h}h ${m}m · ${s.game}`);
      } else if(found.days===1){
        setLabel(`Demain à 20h · ${s.game}`);
      } else {
        setLabel(`${s.day} à 20h · ${s.game}`);
      }
    };
    update();
    const id=setInterval(update,30000);
    return ()=>clearInterval(id);
  },[]);
  if(!label) return null;
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(145,70,255,0.12)",border:"1px solid rgba(145,70,255,0.3)",borderRadius:99,padding:"8px 20px",marginTop:8}}>
      <Icon.Clock/>
      <span style={{fontFamily:"var(--font-body)",fontSize:"0.82rem",color:"var(--color-brand-light)",fontWeight:500}}>{label}</span>
    </div>
  );
}

export function OfflineCard() {
  return (
    <div style={{width:"100%",height:"100%",minHeight:420,background:"linear-gradient(135deg,rgba(145,70,255,0.07),rgba(255,107,157,0.04))",border:"1px solid rgba(145,70,255,0.2)",borderRadius:16,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:40,textAlign:"center"}}>
      <div style={{animation:"raccoonFloat 4s ease-in-out infinite"}}>
        <RaccoonMascot size={140}/>
      </div>
      <div>
        <h3 style={{fontFamily:"var(--font-display)",fontSize:"2rem",color:"var(--text-primary)",letterSpacing:"0.06em",marginBottom:10}}>STREAM HORS LIGNE</h3>
        <p style={{color:"var(--text-muted)",fontSize:"0.9rem",lineHeight:1.65,maxWidth:300}}>Le raton se repose… Rejoins le Discord pour être notifié du prochain stream.</p>
      </div>
      <NextStreamLabel/>
    </div>
  );
}
