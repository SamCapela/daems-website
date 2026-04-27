import { useState, useEffect, useCallback } from "react";
import { twitchGet, BROADCASTER_ID } from "../constants";
import { LoadSpinner, NavBtn } from "./ui";
import { RaccoonIcon } from "./icons";
import { ClipCard } from "./ClipCard";

export function ClipsPage({token}) {
  const [clips,setClips]=useState([]);
  const [loading,setLoading]=useState(false);
  const [filter,setFilter]=useState("month");
  const [cursor,setCursor]=useState(null);
  const [page,setPage]=useState(1);

  const load=useCallback(async(after=null)=>{
    if(!token)return;
    setLoading(true);
    const now=new Date(),start=new Date(now);
    if(filter==="week")start.setDate(now.getDate()-7);else start.setMonth(now.getMonth()-1);
    const params={broadcaster_id:BROADCASTER_ID,first:12,started_at:start.toISOString(),ended_at:now.toISOString()};
    if(after)params.after=after;
    try{const data=await twitchGet("/clips",token,params);setClips(data.data||[]);setCursor(data.pagination?.cursor||null);}catch{}
    setLoading(false);
  },[token,filter]);

  useEffect(()=>{setPage(1);load(null);},[filter]);

  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:24,alignItems:"center"}}>
        <span style={{fontFamily:"var(--font-body)",fontSize:"0.8rem",color:"var(--text-muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em"}}>Période</span>
        {["week","month"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`filter-btn${filter===f?" active":""}`}>
            {f==="week"?"Cette semaine":"Ce mois"}
          </button>
        ))}
        <span style={{marginLeft:"auto",color:"var(--text-muted)",fontSize:"0.76rem"}}>Page {page}</span>
      </div>
      {loading?<LoadSpinner/>:clips.length===0?(
        <div style={{textAlign:"center",padding:72,color:"var(--text-muted)"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><RaccoonIcon size={52}/></div>
          <p style={{fontSize:"0.9rem",fontFamily:"var(--font-body)"}}>Aucun clip sur cette période.</p>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:16}}>
          {clips.map(c=><ClipCard key={c.id} clip={c}/>)}
        </div>
      )}
      <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"center"}}>
        {page>1&&<NavBtn onClick={()=>{setPage(p=>p-1);load(null);}}>← Précédent</NavBtn>}
        {cursor&&<NavBtn onClick={()=>{setPage(p=>p+1);load(cursor);}}>Suivant →</NavBtn>}
      </div>
    </div>
  );
}
