import { useRef } from "react";
import { useReveal } from "../../hooks/useReveal";
import { MILESTONES } from "../../constants";

export function RoadmapSection() {
  const [ref,visible]=useReveal(0.1);
  const scrollRef=useRef(null);
  const dragging=useRef(false);
  const startX=useRef(0);
  const scrollLeft=useRef(0);

  const onMouseDown=(e)=>{dragging.current=true;startX.current=e.pageX-scrollRef.current.offsetLeft;scrollLeft.current=scrollRef.current.scrollLeft;};
  const onMouseMove=(e)=>{if(!dragging.current)return;e.preventDefault();const x=e.pageX-scrollRef.current.offsetLeft;scrollRef.current.scrollLeft=scrollLeft.current-(x-startX.current);};
  const onMouseUp=()=>{dragging.current=false;};

  return (
    <section id="section-roadmap" ref={ref} style={{padding:"72px 0",opacity:visible?1:0,transform:visible?"none":"translateY(32px)",transition:"opacity 0.7s ease 0.2s,transform 0.7s ease 0.2s"}}>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"0.05em",color:"var(--text-primary)",marginBottom:12}}>LA ROADMAP</h2>
      <p style={{color:"var(--text-muted)",fontSize:"0.85rem",marginBottom:36,fontFamily:"var(--font-body)"}}>Le chemin parcouru et les prochains paliers — fais glisser pour explorer.</p>
      <div ref={scrollRef} className="roadmap-scroll" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
        <div style={{display:"flex",alignItems:"center",padding:"48px 24px",minWidth:"max-content",gap:0}}>
          {MILESTONES.map((m,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,width:140}}>
                <div style={{
                  width:120,minHeight:100,
                  background:m.done?"linear-gradient(135deg,#9146ff,#6d28d9)":m.current?"linear-gradient(135deg,rgba(145,70,255,0.25),rgba(145,70,255,0.08))":m.dream?"linear-gradient(135deg,rgba(245,230,66,0.1),rgba(245,230,66,0.03))":"rgba(255,255,255,0.03)",
                  border:m.done?"2px solid #9146ff":m.current?"2px solid rgba(145,70,255,0.55)":m.dream?"2px dashed rgba(245,230,66,0.28)":"2px dashed rgba(255,255,255,0.08)",
                  borderRadius:m.done?"16px 4px 16px 4px":"16px",
                  padding:"14px 12px",
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,
                  boxShadow:m.done?"0 0 22px rgba(145,70,255,0.42)":m.current?"0 0 32px rgba(145,70,255,0.22)":"none",
                  transition:"transform 0.2s",
                  userSelect:"none",
                }}>
                  <span style={{fontSize:m.done?"1.4rem":"1.1rem"}}>{m.done?"✓":m.current?"⚡":m.dream?"👑":"🔒"}</span>
                  <span style={{fontFamily:"var(--font-body)",fontSize:"0.72rem",fontWeight:700,color:m.done?"#fff":m.current?"var(--color-brand-light)":m.dream?"#f5e642":"var(--text-muted)",textAlign:"center",lineHeight:1.35}}>{m.label}</span>
                  {m.current&&m.progress!==undefined&&(
                    <div style={{width:"100%"}}>
                      <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
                        <div style={{width:`${(m.progress/m.goal)*100}%`,height:"100%",background:"linear-gradient(90deg,#9146ff,#ff6b9d)",borderRadius:99}}/>
                      </div>
                      <div style={{fontSize:"0.62rem",color:"var(--color-brand-light)",textAlign:"center",marginTop:4,fontFamily:"var(--font-body)"}}>{m.progress}/{m.goal}</div>
                    </div>
                  )}
                </div>
              </div>
              {i<MILESTONES.length-1&&(
                <div style={{
                  width:48,height:4,flexShrink:0,
                  background:(m.done&&(MILESTONES[i+1].done||MILESTONES[i+1].current))
                    ?"linear-gradient(90deg,#9146ff,rgba(145,70,255,0.4))"
                    :"rgba(255,255,255,0.06)",
                  borderRadius:99,
                  boxShadow:m.done&&MILESTONES[i+1].done?"0 0 10px rgba(145,70,255,0.45)":"none",
                }}/>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
