import { useState, useEffect } from "react";
import { useReveal } from "../../hooks/useReveal";
import { SCHEDULE } from "../../constants";
import { Icon } from "../icons";

export function PlanningSection() {
  const [ref,visible]=useReveal(0.12);
  const [todayIdx,setTodayIdx]=useState(-1);
  const [countdown,setCountdown]=useState("");

  useEffect(()=>{
    const d=new Date().getDay();
    setTodayIdx(d===0?6:d-1);
    const update=()=>{
      const now=new Date();
      const curIdx=now.getDay()===0?6:now.getDay()-1;
      let found=null;
      for(let i=0;i<=7;i++){
        const idx=(curIdx+i)%7;
        if(SCHEDULE[idx].type!=="OFF"){
          if(i===0&&now.getHours()<20){found={idx,days:0};break;}
          else if(i>0){found={idx,days:i};break;}
        }
      }
      if(!found){setCountdown("");return;}
      const s=SCHEDULE[found.idx];
      const next=new Date(now);next.setDate(now.getDate()+found.days);next.setHours(20,0,0,0);
      const diff=next-now;
      const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000);
      if(found.days===0) setCountdown(`Aujourd'hui à 20h — dans ${h}h ${m}m`);
      else if(found.days===1) setCountdown(`Demain à 20h · ${s.game}`);
      else setCountdown(`${s.day} à 20h · ${s.game}`);
    };
    update();
    const id=setInterval(update,30000);
    return ()=>clearInterval(id);
  },[]);

  return (
    <section id="planning" ref={ref} style={{padding:"72px 0",opacity:visible?1:0,transform:visible?"none":"translateY(32px)",transition:"opacity 0.7s ease 0.1s,transform 0.7s ease 0.1s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:36,flexWrap:"wrap",gap:14}}>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"0.05em",color:"var(--text-primary)"}}>PLANNING</h2>
        {countdown&&(
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(145,70,255,0.12)",border:"1px solid rgba(145,70,255,0.3)",borderRadius:99,padding:"8px 18px"}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"var(--color-brand)",animation:"pulse 2s infinite"}}/>
            <span style={{fontFamily:"var(--font-body)",fontSize:"0.82rem",color:"var(--color-brand-light)",fontWeight:500}}>{countdown}</span>
          </div>
        )}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {SCHEDULE.map((item,i)=>{
          const isToday=i===todayIdx,isOff=item.type==="OFF";
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 20px",borderRadius:14,background:isToday?`${item.color}14`:"rgba(255,255,255,0.02)",border:`1px solid ${isToday?item.color+"40":"rgba(255,255,255,0.05)"}`,opacity:isOff?0.38:1,transition:"all 0.2s",cursor:"default"}}>
              <div style={{width:4,height:44,borderRadius:4,background:item.color,flexShrink:0,boxShadow:isToday?`0 0 14px ${item.color}90`:"none"}}/>
              <div style={{width:96,flexShrink:0}}>
                <div style={{fontFamily:"var(--font-display)",fontSize:"1.05rem",letterSpacing:"0.06em",color:isToday?item.color:"var(--text-secondary)"}}>{item.day.toUpperCase()}</div>
                {!isOff&&<div style={{fontSize:"0.65rem",color:"var(--text-muted)",marginTop:1}}>20:00</div>}
              </div>
              <div style={{flex:1,fontFamily:"var(--font-body)",fontSize:"0.9rem",color:isOff?"var(--text-muted)":"var(--text-primary)",fontWeight:500}}>{item.game}</div>
              {!isOff&&<div style={{background:`${item.color}16`,border:`1px solid ${item.color}38`,color:item.color,borderRadius:99,padding:"3px 12px",fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.1em"}}>{item.type}</div>}
              {isToday&&!isOff&&(
                <div style={{display:"flex",alignItems:"center",gap:5,marginLeft:4}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:item.color,animation:"livePulse 1.4s infinite"}}/>
                  <span style={{fontSize:"0.68rem",color:item.color,fontWeight:700,letterSpacing:"0.08em"}}>AUJOURD'HUI</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
