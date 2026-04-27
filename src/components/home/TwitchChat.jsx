import { useState, useEffect, useRef } from "react";
import { MiniUserBanner } from "../banners";

export function TwitchChat({ircMessages,connected,sendIRC,parseBadges,userInfo}) {
  const [input,setInput]=useState("");
  const [localMessages,setLocalMessages]=useState([]);
  const bottomRef=useRef(null);
  const inputRef=useRef(null);

  const allMessages=(()=>{
    const ircTexts=new Set(ircMessages.map(m=>m.text));
    const filteredLocal=localMessages.filter(m=>!ircTexts.has(m.text));
    const all=[...ircMessages,...filteredLocal];
    all.sort((a,b)=>(a.ts||0)-(b.ts||0));
    return all;
  })();

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[allMessages.length]);

  const badgeEmoji=(badge)=>({broadcaster:"🎙",moderator:"⚔️",subscriber:"⭐",vip:"💎",staff:"🛡",partner:"✅",premium:"👑"})[badge]||null;

  const send=()=>{
    if(!input.trim()||!connected) return;
    const sent=sendIRC(input.trim());
    if(sent){
      setLocalMessages(prev=>[...prev,{id:`local-${Date.now()}`,displayName:userInfo?.display_name||"Moi",color:"#9146ff",badges:"",text:input.trim(),isLocal:true,ts:Date.now()}].slice(-150));
      setInput("");inputRef.current?.focus();
    }
  };

  return (
    <div style={{borderRadius:16,border:"1px solid rgba(145,70,255,0.22)",display:"flex",flexDirection:"column",height:"100%",minHeight:460,overflow:"hidden",background:"rgba(10,0,22,0.95)"}}>
      <div style={{padding:"10px 14px",background:"rgba(145,70,255,0.09)",borderBottom:"1px solid rgba(145,70,255,0.16)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#bf7fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          <span style={{fontFamily:"var(--font-body)",fontSize:"0.85rem",fontWeight:600,color:"#bf7fff",letterSpacing:"0.06em"}}>Chat live</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:connected?"#10b981":"#ef4444",boxShadow:connected?"0 0 7px #10b981":"none"}}/>
          <span style={{fontSize:"0.65rem",color:connected?"#10b981":"#ef4444",fontWeight:600}}>{connected?"Connecté":"Déconnecté"}</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:2}}>
        {allMessages.length===0&&<div style={{color:"#3a3060",fontSize:"0.8rem",textAlign:"center",marginTop:40,fontStyle:"italic"}}>En attente de messages…</div>}
        {allMessages.map(msg=>
          msg.isSystem?(
            <div key={msg.id} style={{background:"rgba(145,70,255,0.1)",border:"1px solid rgba(145,70,255,0.2)",borderRadius:8,padding:"6px 10px",fontSize:"0.78rem",color:"#bf7fff",textAlign:"center",margin:"4px 0"}}>
              🎉 {msg.text}
            </div>
          ):(
            <div key={msg.id} style={{display:"flex",gap:6,alignItems:"flex-start",padding:"2px 4px",borderRadius:6,transition:"background 0.1s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              <span style={{fontSize:"0.7rem",flexShrink:0,paddingTop:2}}>
                {parseBadges(typeof msg.badges==="string"?msg.badges:"").map(b=>badgeEmoji(b)).filter(Boolean).join("")}
              </span>
              <div style={{flex:1,fontSize:"0.82rem",lineHeight:1.5,wordBreak:"break-word"}}>
                {msg.subMonths?(
                  <span style={{display:"inline-flex",alignItems:"center",marginRight:6,verticalAlign:"middle"}}>
                    <MiniUserBanner name={msg.displayName} color={msg.color} subMonths={parseInt(msg.subMonths)}/>
                  </span>
                ):(
                  <span style={{color:msg.color,fontWeight:700,marginRight:4}}>{msg.displayName}</span>
                )}
                <span style={{color:msg.isLocal?"#c0a8ff":"#ccc8e0"}}>: {msg.text}</span>
              </div>
            </div>
          )
        )}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"10px 12px",borderTop:"1px solid rgba(145,70,255,0.14)",display:"flex",gap:8,flexShrink:0,background:"rgba(0,0,0,0.25)"}}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder={connected?"Envoyer un message…":"Connexion…"}
          disabled={!connected} maxLength={500} className="chat-input"/>
        <button onClick={send} disabled={!connected||!input.trim()}
          style={{background:connected&&input.trim()?"linear-gradient(135deg,#9146ff,#6d28d9)":"rgba(255,255,255,0.05)",border:"none",borderRadius:8,padding:"8px 14px",color:connected&&input.trim()?"#fff":"#3a3060",cursor:connected&&input.trim()?"pointer":"not-allowed",transition:"all 0.18s",flexShrink:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  );
}
