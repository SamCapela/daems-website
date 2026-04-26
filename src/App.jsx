import { useState, useEffect, useCallback, useRef } from "react";

const CLIENT_ID      = "mk16oce917g7q5i485zlyackq33ce0";
const REDIRECT_URI   = window.location.origin;
const BROADCASTER    = "daems_";
const BROADCASTER_ID = "441069979";

const SCOPES = ["user:read:email","user:read:follows","user:read:subscriptions","chat:read"].join(" ");

const twitchGet = async (path, token, params = {}) => {
  const url = new URL("https://api.twitch.tv/helix" + path);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "Client-Id": CLIENT_ID } });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
};

// ── IRC sub months ─────────────────────────────────────────────────────────
function useIRCSubMonths(token, username) {
  const [subMonths, setSubMonths] = useState(null);
  const wsRef = useRef(null);
  useEffect(() => {
    if (!token || !username) return;
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv");
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send(`PASS oauth:${token}`);
      ws.send(`NICK ${username.toLowerCase()}`);
      ws.send(`JOIN #${BROADCASTER}`);
    };
    ws.onmessage = (e) => {
      const raw = e.data;
      if (raw.startsWith("PING")) { ws.send("PONG :tmi.twitch.tv"); return; }
      if (raw.includes("USERSTATE") && raw.includes(`#${BROADCASTER}`)) {
        const tagStr = raw.startsWith("@") ? raw.slice(1).split(" ")[0] : "";
        if (tagStr) {
          const tags = {};
          tagStr.split(";").forEach(t => { const [k,...rest]=t.split("="); tags[k]=rest.join("=")||""; });
          const match = (tags["badge-info"]||"").match(/subscriber\/(\d+)/);
          if (match) setSubMonths(parseInt(match[1]));
          ws.close();
        }
      }
    };
    ws.onerror = () => {};
    ws.onclose = () => {};
    return () => { try { ws.close(); } catch {} };
  }, [token, username]);
  return subMonths;
}

function formatSubDuration(months) {
  if (!months) return null;
  if (months < 12) return `${months} mois`;
  const y = Math.floor(months/12), m = months%12;
  if (m===0) return y===1?"1 an":`${y} ans`;
  return `${y} an${y>1?"s":""} et ${m} mois`;
}

function getBannerTier(subMonths, isSub) {
  if (!isSub || subMonths===null) return 0;
  if (subMonths < 3)  return 1;
  if (subMonths < 6)  return 2;
  if (subMonths < 12) return 3;
  return 4;
}

// ── BANNER ─────────────────────────────────────────────────────────────────
const RANKS = [{name:"Bronze",stars:1},{name:"Silver",stars:2},{name:"Gold",stars:3},{name:"Platinum",stars:4},{name:"Diamond",stars:5}];
const bannerStyles = [
  { bg:"linear-gradient(135deg,#6B3A1F 0%,#C8956C 45%,#7B4A2F 100%)", border:"2px solid #A06030", shadow:"0 0 10px #5A3010aa,inset 0 1px 0 rgba(255,200,130,0.25)", textColor:"#FFE0A0", textShadow:"1px 2px 6px #3a2010,0 0 10px rgba(200,120,40,0.4)", starColor:"#FFD700", starGlow:"rgba(200,140,60,0.6)", shimmer:false, subColor:"#FFD070" },
  { bg:"linear-gradient(135deg,#6A7D8E 0%,#BDD0E0 45%,#7A8D9E 100%)", border:"2px solid #8AAABB", shadow:"0 0 14px rgba(160,200,230,0.3),inset 0 1px 0 rgba(255,255,255,0.3)", textColor:"#E8F4FF", textShadow:"1px 2px 4px #304050,0 0 12px rgba(150,200,255,0.5)", starColor:"#C8E0F8", starGlow:"rgba(150,200,240,0.6)", shimmer:false, subColor:"#A8D0F0" },
  { bg:"linear-gradient(135deg,#A07010 0%,#FFD700 40%,#FFA800 70%,#A07010 100%)", border:"2px solid #FFD700", shadow:"0 0 22px rgba(255,200,0,0.5),inset 0 1px 0 rgba(255,255,200,0.4)", textColor:"#FFF8DC", textShadow:"1px 2px 4px #6B4400,0 0 14px rgba(255,210,0,0.7)", starColor:"#FFFACD", starGlow:"rgba(255,210,0,0.7)", shimmer:false, subColor:"#FFE080" },
  { bg:"linear-gradient(135deg,#5A3A8C 0%,#C0A0F0 35%,#8060C0 65%,#6040A0 100%)", border:"2px solid #A080E0", shadow:"0 0 22px rgba(170,120,255,0.45),inset 0 1px 0 rgba(220,180,255,0.35)", textColor:"#F0E8FF", textShadow:"1px 2px 4px #3A2060,0 0 16px rgba(180,130,255,0.7)", starColor:"#DCC8FF", starGlow:"rgba(180,130,255,0.7)", shimmer:false, subColor:"#D0B0FF" },
  { bg:"linear-gradient(135deg,#050D1A 0%,#0E2550 35%,#081830 65%,#020810 100%)", border:"2px solid #3A9AFF", shadow:"0 0 28px rgba(50,150,255,0.65),0 0 55px rgba(50,150,255,0.2),inset 0 1px 0 rgba(100,180,255,0.2)", textColor:"#70D8FF", textShadow:"0 0 12px #38B0FF,0 0 24px #0070FF,1px 2px 6px #000", starColor:"#50D0FF", starGlow:"rgba(50,160,255,0.8)", shimmer:true, subColor:"#60C8FF" },
];

function NameBanner({ username, tier=0, size="md", subDuration=null }) {
  const s = bannerStyles[tier], r = RANKS[tier];
  const [w,h,fs] = ({lg:[340,62,"1.25rem"],md:[240,46,"0.95rem"],sm:[200,38,"0.82rem"]})[size];
  const starSz = size==="sm"?10:size==="lg"?14:11;
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
      {subDuration&&(
        <div style={{fontSize:size==="sm"?"0.64rem":"0.72rem",color:s.subColor,fontFamily:"monospace",letterSpacing:"0.1em",textTransform:"uppercase",opacity:0.9,display:"flex",alignItems:"center",gap:4}}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill={s.subColor}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          {subDuration}
        </div>
      )}
    </div>
  );
}

// ── ICONS ──────────────────────────────────────────────────────────────────
const Icon = {
  Home:   ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  Clips:  ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>,
  Trophy: ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V18H7v2h10v-2h-4v-2.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>,
  Shop:   ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3z"/></svg>,
  Heart:  ()=><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  Star:   ()=><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  Users:  ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  Gift:   ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.07-.28.18-.54.18-.83C18 3.43 16.57 2 14.83 2c-.9 0-1.6.4-2.13 1.03L12 3.9l-.7-.87C10.77 2.4 10.07 2 9.17 2 7.43 2 6 3.43 6 5.17c0 .29.1.55.18.83H4c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5-.83c0-.46.37-.83.83-.83s.83.37.83.83-.37.83-.83.83H14l.83-.83zM9.17 4.34c.46 0 .83.37.83.83L10.83 6H9.17c-.46 0-.83-.37-.83-.83s.37-.83.83-.83zM20 14H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2z"/></svg>,
  Logout: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>,
};

const TABS = [
  {id:"home",       label:"Accueil",     IC:Icon.Home},
  {id:"clips",      label:"Clips",       IC:Icon.Clips},
  {id:"leaderboard",label:"Leaderboard", IC:Icon.Trophy},
  {id:"shop",       label:"Boutique",    IC:Icon.Shop},
];

// ── TWITCH CHAT IRC ────────────────────────────────────────────────────────
function TwitchChat({ token, username }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError]         = useState(null);
  const wsRef      = useRef(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Couleurs pseudo style Twitch
  const COLORS = ["#FF4500","#FF69B4","#9ACD32","#00FF7F","#1E90FF","#FF7F50","#DAA520","#8A2BE2","#00CED1","#ADFF2F"];
  const colorFor = (name) => COLORS[name.split("").reduce((a,c)=>a+c.charCodeAt(0),0) % COLORS.length];

  // Parse badge-info pour avoir la couleur et les badges
  const parseTags = (str) => {
    const tags = {};
    str.split(";").forEach(t => { const [k,...rest]=t.split("="); tags[k]=rest.join("=")||""; });
    return tags;
  };

  const parseBadges = (badgeStr) => {
    if (!badgeStr) return [];
    return badgeStr.split(",").map(b => b.split("/")[0]).filter(Boolean);
  };

  const badgeEmoji = (badge) => {
    const map = { broadcaster:"🎙", moderator:"⚔️", subscriber:"⭐", vip:"💎", staff:"🛡", partner:"✅", premium:"👑", "bits-leader":"💜" };
    return map[badge] || null;
  };

  useEffect(() => {
    if (!token || !username) return;
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send(`PASS oauth:${token}`);
      ws.send(`NICK ${username.toLowerCase()}`);
      ws.send(`JOIN #${BROADCASTER}`);
    };

    ws.onmessage = (e) => {
      const lines = e.data.split("\r\n").filter(Boolean);
      lines.forEach(raw => {
        if (raw.startsWith("PING")) { ws.send("PONG :tmi.twitch.tv"); return; }

        // Connected
        if (raw.includes("376") || raw.includes("001")) setConnected(true);

        // PRIVMSG = message chat
        if (raw.includes("PRIVMSG")) {
          let tags = {}, tagStr = "";
          if (raw.startsWith("@")) {
            tagStr = raw.slice(1).split(" ")[0];
            tags = parseTags(tagStr);
          }
          const msgMatch = raw.match(/PRIVMSG #\S+ :(.+)$/);
          const userMatch = raw.match(/:(\w+)!\w+@/);
          if (!msgMatch || !userMatch) return;

          const displayName = tags["display-name"] || userMatch[1];
          const color       = tags["color"] || colorFor(displayName);
          const badges      = parseBadges(tags["badges"] || "");
          const text        = msgMatch[1];
          const isSub       = tags["subscriber"] === "1";
          const isMod       = tags["mod"] === "1";
          const subMonths   = tags["badge-info"]?.match(/subscriber\/(\d+)/)?.[1];
          const id          = tags["id"] || Date.now().toString();

          setMessages(prev => {
            const next = [...prev, { id, displayName, color, badges, text, isSub, isMod, subMonths }];
            return next.slice(-150); // garde max 150 messages
          });
        }

        // USERNOTICE = sub/resub/giftsub annonce
        if (raw.includes("USERNOTICE")) {
          let tags = {};
          if (raw.startsWith("@")) tags = parseTags(raw.slice(1).split(" ")[0]);
          const sysMsg = tags["system-msg"]?.replace(/\\s/g," ") || "";
          if (sysMsg) {
            setMessages(prev => {
              const next = [...prev, { id: Date.now().toString(), isSystem: true, text: sysMsg }];
              return next.slice(-150);
            });
          }
        }
      });
    };

    ws.onerror = () => setError("Connexion impossible au chat.");
    ws.onclose = () => setConnected(false);

    return () => { try { ws.close(); } catch {} };
  }, [token, username]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const msg = input.trim();
    if (!msg || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(`PRIVMSG #${BROADCASTER} :${msg}`);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKey = (e) => { if (e.key === "Enter") sendMessage(); };

  return (
    <div style={{ borderRadius:14, border:"1px solid rgba(145,71,255,0.25)", display:"flex", flexDirection:"column", height:"100%", minHeight:460, overflow:"hidden", background:"#0e0e18" }}>
      {/* Header */}
      <div style={{ padding:"10px 14px", background:"rgba(145,71,255,0.12)", borderBottom:"1px solid rgba(145,71,255,0.18)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#bf94ff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#bf94ff", letterSpacing:"0.12em", textTransform:"uppercase" }}>Chat live</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background: connected ? "#00e676" : "#ff5252", boxShadow: connected ? "0 0 6px #00e676" : "none" }}/>
          <span style={{ fontSize:"0.65rem", color: connected ? "#00e676" : "#ff5252", fontWeight:600 }}>{connected ? "Connecté" : "Déconnecté"}</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"10px 12px", display:"flex", flexDirection:"column", gap:2 }}>
        {error && <div style={{ color:"#ff5252", fontSize:"0.8rem", textAlign:"center", padding:20 }}>{error}</div>}
        {messages.length === 0 && !error && (
          <div style={{ color:"#404060", fontSize:"0.8rem", textAlign:"center", marginTop:40 }}>En attente de messages…</div>
        )}
        {messages.map(msg => (
          msg.isSystem ? (
            <div key={msg.id} style={{ background:"rgba(145,71,255,0.12)", border:"1px solid rgba(145,71,255,0.2)", borderRadius:8, padding:"6px 10px", fontSize:"0.78rem", color:"#bf94ff", textAlign:"center", margin:"4px 0" }}>
              🎉 {msg.text}
            </div>
          ) : (
            <div key={msg.id} style={{ display:"flex", gap:6, alignItems:"flex-start", padding:"2px 4px", borderRadius:6, transition:"background 0.1s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              {/* Badges */}
              <span style={{ fontSize:"0.7rem", flexShrink:0, paddingTop:1 }}>
                {parseBadges(msg.badges || "").map(b=>badgeEmoji(b)).filter(Boolean).join("")}
              </span>
              <div style={{ flex:1, fontSize:"0.82rem", lineHeight:1.45, wordBreak:"break-word" }}>
                <span style={{ color: msg.color, fontWeight:700, marginRight:4 }}>{msg.displayName}</span>
                {msg.subMonths && <span style={{ fontSize:"0.62rem", color:"#9147ff", background:"rgba(145,71,255,0.15)", borderRadius:4, padding:"1px 4px", marginRight:4 }}>{msg.subMonths}m</span>}
                <span style={{ color:"#d0c8e8" }}>: {msg.text}</span>
              </div>
            </div>
          )
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding:"10px 12px", borderTop:"1px solid rgba(145,71,255,0.15)", display:"flex", gap:8, flexShrink:0, background:"rgba(0,0,0,0.2)" }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={connected ? `Envoyer un message…` : "Connexion…"}
          disabled={!connected}
          maxLength={500}
          style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(145,71,255,0.2)", borderRadius:8, padding:"8px 12px", color:"#e0d0ff", fontSize:"0.83rem", outline:"none", transition:"border-color 0.2s", fontFamily:"inherit" }}
          onFocus={e=>e.target.style.borderColor="rgba(145,71,255,0.6)"}
          onBlur={e=>e.target.style.borderColor="rgba(145,71,255,0.2)"}
        />
        <button onClick={sendMessage} disabled={!connected || !input.trim()} style={{ background: connected && input.trim() ? "linear-gradient(135deg,#9147ff,#6020c0)" : "rgba(255,255,255,0.05)", border:"none", borderRadius:8, padding:"8px 14px", color: connected && input.trim() ? "#fff" : "#404060", cursor: connected && input.trim() ? "pointer" : "not-allowed", transition:"all 0.2s", flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  );
}


function ActivityTicker({ token }) {
  const [items, setItems] = useState([]);
  const trackRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${window.location.origin}/api/recent-activity`)
      .then(r => r.json())
      .then(d => {
        const list = d.data || [];
        if (list.length > 0) setItems([...list, ...list]); // dupliquer pour scroll infini
      })
      .catch(() => {});
  }, [token]);

  if (items.length === 0) return null;

  return (
    <div style={{position:"relative",overflow:"hidden",background:"rgba(145,71,255,0.06)",border:"1px solid rgba(145,71,255,0.15)",borderRadius:12,padding:"12px 0",marginTop:16}}>
      {/* Fade left/right */}
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:80,background:"linear-gradient(to right,#0e0e10,transparent)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:80,background:"linear-gradient(to left,#0e0e10,transparent)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,padding:"0 20px"}}>
        <span style={{fontSize:"0.68rem",color:"#605080",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em"}}>Activité récente</span>
        <div style={{flex:1,height:1,background:"rgba(145,71,255,0.15)"}}/>
      </div>
      <div ref={trackRef} style={{display:"flex",gap:12,padding:"4px 20px",animation:"ticker 30s linear infinite",width:"max-content"}}>
        {items.map((item, i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(145,71,255,0.1)",border:"1px solid rgba(145,71,255,0.2)",borderRadius:20,padding:"5px 14px",whiteSpace:"nowrap",flexShrink:0}}>
            <span style={{fontSize:"0.85rem"}}>{item.icon}</span>
            <span style={{color:"#e0d0ff",fontWeight:700,fontSize:"0.82rem"}}>{item.name}</span>
            <span style={{color:"#706090",fontSize:"0.72rem"}}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HOME ───────────────────────────────────────────────────────────────────
function HomePage({ token }) {
  const [stats, setStats] = useState({followers:null,subs:null});

  useEffect(() => {
    if (!token) return;
    Promise.all([
      twitchGet("/channels/followers", token, {broadcaster_id:BROADCASTER_ID,first:1}),
      twitchGet("/subscriptions", token, {broadcaster_id:BROADCASTER_ID,first:1}).catch(()=>({total:null})),
    ]).then(([f,s]) => setStats({followers:f.total??null,subs:s.total??null})).catch(()=>{});
  }, [token]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16,minHeight:460}}>
        <div style={{borderRadius:14,overflow:"hidden",border:"1px solid rgba(145,71,255,0.25)",boxShadow:"0 0 30px rgba(145,71,255,0.1)"}}>
          <iframe src={`https://player.twitch.tv/?channel=${BROADCASTER}&parent=${window.location.hostname}&autoplay=false`}
            height="100%" width="100%" style={{display:"block",minHeight:420,border:"none"}} allowFullScreen/>
        </div>
        <div style={{borderRadius:14,overflow:"hidden",border:"1px solid rgba(145,71,255,0.25)",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"9px 14px",background:"rgba(145,71,255,0.12)",borderBottom:"1px solid rgba(145,71,255,0.18)",fontSize:"0.72rem",fontWeight:700,color:"#bf94ff",letterSpacing:"0.12em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:6}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#bf94ff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            Chat live
          </div>
          <iframe src={`https://www.twitch.tv/embed/${BROADCASTER}/chat?parent=${window.location.hostname}&darkpopout&login=${userInfo?.login || ""}`}
            height="100%" width="100%" style={{display:"block",border:"none",flex:1}}/>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        <StatCard icon={<Icon.Users/>} label="Followers" value={stats.followers!==null?stats.followers.toLocaleString("fr-FR"):"…"} color="#9147ff"/>
        <StatCard icon={<Icon.Star/>}  label="Abonnés"   value={stats.subs!==null?stats.subs.toLocaleString("fr-FR"):"—"} color="#f59e0b"/>
        <div style={{background:"linear-gradient(135deg,rgba(145,71,255,0.12),rgba(60,20,120,0.2))",border:"1px solid rgba(145,71,255,0.25)",borderRadius:12,padding:"18px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{color:"#bf94ff",display:"flex",alignItems:"center",gap:6}}>
            <Icon.Gift/><span style={{fontSize:"0.72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"}}>Offrir un abonnement</span>
          </div>
          <a href={`https://www.twitch.tv/subs/${BROADCASTER}`} target="_blank" rel="noreferrer"
            style={{background:"linear-gradient(135deg,#9147ff,#6020c0)",color:"#fff",borderRadius:8,padding:"10px 24px",fontWeight:700,textDecoration:"none",fontSize:"0.85rem",boxShadow:"0 4px 18px rgba(145,71,255,0.4)",animation:"pulse 2s infinite",display:"inline-block"}}>
            💜 Gift Sub
          </a>
        </div>
      </div>

      {/* Activity ticker */}
      <ActivityTicker token={token}/>
    </div>
  );
}

function StatCard({icon,label,value,color}) {
  return (
    <div style={{background:`linear-gradient(135deg,${color}14,${color}06)`,border:`1px solid ${color}38`,borderRadius:12,padding:"18px 20px",display:"flex",alignItems:"center",gap:14}}>
      <div style={{color,opacity:0.9}}>{icon}</div>
      <div>
        <div style={{fontSize:"1.5rem",fontWeight:800,color:"#fff"}}>{value}</div>
        <div style={{fontSize:"0.7rem",color:"#8080a0",textTransform:"uppercase",letterSpacing:"0.1em"}}>{label}</div>
      </div>
    </div>
  );
}

// ── CLIPS ──────────────────────────────────────────────────────────────────
function ClipsPage({token}) {
  const [clips,setClips]=useState([]);
  const [loading,setLoading]=useState(false);
  const [filter,setFilter]=useState("month");
  const [cursor,setCursor]=useState(null);
  const [page,setPage]=useState(1);

  const load = useCallback(async(after=null)=>{
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
      <div style={{display:"flex",gap:10,marginBottom:22,alignItems:"center"}}>
        <span style={{color:"#606080",fontSize:"0.76rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em"}}>Période</span>
        {["week","month"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"7px 18px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.82rem",background:filter===f?"linear-gradient(135deg,#9147ff,#6020c0)":"rgba(255,255,255,0.06)",color:filter===f?"#fff":"#8080a0",boxShadow:filter===f?"0 4px 14px rgba(145,71,255,0.35)":"none",transition:"all 0.18s"}}>
            {f==="week"?"Cette semaine":"Ce mois"}
          </button>
        ))}
        <span style={{marginLeft:"auto",color:"#404060",fontSize:"0.76rem"}}>Page {page}</span>
      </div>
      {loading?<LoadSpinner/>:clips.length===0?(
        <div style={{textAlign:"center",padding:60,color:"#505070"}}><p>Aucun clip sur cette période.</p></div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
          {clips.map(c=><ClipCard key={c.id} clip={c}/>)}
        </div>
      )}
      <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"center"}}>
        {page>1&&<NavBtn onClick={()=>{setPage(p=>p-1);load(null);}}>← Précédent</NavBtn>}
        {cursor&&<NavBtn onClick={()=>{setPage(p=>p+1);load(cursor);}}>Suivant →</NavBtn>}
      </div>
    </div>
  );
}

function ClipCard({clip}) {
  return (
    <a href={clip.url} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(145,71,255,0.18)",borderRadius:12,overflow:"hidden",transition:"all 0.18s"}}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 28px rgba(145,71,255,0.25)";e.currentTarget.style.borderColor="rgba(145,71,255,0.45)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor="rgba(145,71,255,0.18)";}}>
        <div style={{position:"relative"}}>
          <img src={clip.thumbnail_url} alt={clip.title} style={{width:"100%",aspectRatio:"16/9",objectFit:"cover",display:"block"}}/>
          <div style={{position:"absolute",bottom:7,right:7,background:"rgba(0,0,0,0.7)",color:"#fff",fontSize:"0.7rem",padding:"2px 7px",borderRadius:5,fontWeight:600}}>👁 {clip.view_count?.toLocaleString("fr-FR")}</div>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(145,71,255,0.85)",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div style={{padding:"11px 13px"}}>
          <div style={{color:"#ddd0f8",fontWeight:600,fontSize:"0.87rem",lineHeight:1.35,marginBottom:5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{clip.title}</div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.7rem",color:"#605080"}}>
            <span>{clip.creator_name}</span>
            <span>{new Date(clip.created_at).toLocaleDateString("fr-FR")}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

// ── LEADERBOARD ────────────────────────────────────────────────────────────
function LeaderboardPage({token,userInfo,isFollower,isSub}) {
  const [followers,setFollowers]=useState([]);
  const [subs,setSubs]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!token)return;
    const base=window.location.origin;
    Promise.all([
      fetch(`${base}/api/followers`).then(r=>r.json()).then(f=>setFollowers(f.data||[])).catch(()=>{}),
      fetch(`${base}/api/subscribers`).then(r=>r.json()).then(s=>setSubs(s.data||[])).catch(()=>{}),
    ]).finally(()=>setLoading(false));
  },[token]);

  return (
    <div>
      {!isFollower&&userInfo&&(
        <div style={{background:"rgba(255,80,80,0.08)",border:"1px solid rgba(255,80,80,0.25)",borderRadius:12,padding:"14px 20px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{color:"#ff9090",fontSize:"0.88rem"}}>Tu ne suis pas encore <strong style={{color:"#fff"}}>Daems_</strong> !</span>
          <a href="https://www.twitch.tv/daems_" target="_blank" rel="noreferrer"
            style={{background:"linear-gradient(135deg,#e91916,#900)",color:"#fff",padding:"7px 18px",borderRadius:20,fontWeight:700,textDecoration:"none",animation:"pulse 1.5s infinite",fontSize:"0.82rem"}}>Suivre 💜</a>
        </div>
      )}
      {!isSub&&userInfo&&(
        <div style={{background:"rgba(145,71,255,0.08)",border:"1px solid rgba(145,71,255,0.25)",borderRadius:12,padding:"14px 20px",marginBottom:22,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{color:"#bf94ff",fontSize:"0.88rem"}}>Rejoins les abonnés de <strong style={{color:"#fff"}}>Daems_</strong> !</span>
          <a href={`https://www.twitch.tv/subs/${BROADCASTER}`} target="_blank" rel="noreferrer"
            style={{background:"linear-gradient(135deg,#9147ff,#5010b0)",color:"#fff",padding:"7px 18px",borderRadius:20,fontWeight:700,textDecoration:"none",animation:"pulse 1.5s infinite",fontSize:"0.82rem"}}>S'abonner ⭐</a>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:22}}>
        <div>
          <h3 style={{color:"#e0d0ff",fontWeight:700,marginBottom:14,fontSize:"0.85rem",textTransform:"uppercase",letterSpacing:"0.1em",display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:"#e91916"}}><Icon.Heart/></span> Top 30 anciens followers
          </h3>
          {loading?<LoadSpinner/>:followers.length===0?(
            <p style={{color:"#505070",fontSize:"0.82rem"}}>En attente du token broadcaster…</p>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {followers.slice(0,30).map((f,i)=>(
                <LeaderRow key={f.user_id} rank={i+1} name={f.user_name} sub={new Date(f.followed_at).toLocaleDateString("fr-FR")} highlight={userInfo?.id===f.user_id} accent="#9147ff"/>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 style={{color:"#e0d0ff",fontWeight:700,marginBottom:14,fontSize:"0.85rem",textTransform:"uppercase",letterSpacing:"0.1em",display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:"#f59e0b"}}><Icon.Star/></span> Top 30 abonnés
          </h3>
          {loading?<LoadSpinner/>:subs.length===0?(
            <p style={{color:"#505070",fontSize:"0.82rem"}}>En attente du token broadcaster…</p>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {subs.slice(0,30).map((s,i)=>(
                <LeaderRow key={s.user_id} rank={i+1} name={s.user_name} sub={`Tier ${s.tier?.[0]||1}${s.is_gift?" · Gift":""}`} highlight={userInfo?.id===s.user_id} accent="#f59e0b"/>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeaderRow({rank,name,sub,highlight,accent}) {
  const medal=rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":null;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"7px 13px",borderRadius:9,background:highlight?`${accent}18`:"rgba(255,255,255,0.025)",border:`1px solid ${highlight?accent+"55":"rgba(255,255,255,0.05)"}`}}>
      <span style={{width:26,textAlign:"right",fontSize:"0.76rem",color:"#505070",fontWeight:700,flexShrink:0}}>{medal||`#${rank}`}</span>
      <span style={{flex:1,color:highlight?"#fff":"#b8a8d8",fontWeight:highlight?700:400,fontSize:"0.87rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
      <span style={{fontSize:"0.7rem",color:"#505070",flexShrink:0}}>{sub}</span>
    </div>
  );
}

// ── SHOP ───────────────────────────────────────────────────────────────────
function ShopPage() {
  return (
    <div>
      <div style={{textAlign:"center",marginBottom:30}}>
        <div style={{fontSize:"3rem",marginBottom:6}}>🏪</div>
        <h2 style={{color:"#e0d0ff",fontWeight:800,fontSize:"1.5rem",margin:0}}>Boutique Daems_</h2>
        <p style={{color:"#505070",marginTop:8,fontSize:"0.87rem"}}>Des surprises arrivent bientôt… keep watching 👀</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
        {Array.from({length:6}).map((_,i)=>(
          <div key={i} style={{border:"2px dashed rgba(145,71,255,0.2)",borderRadius:16,minHeight:190,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,background:"rgba(145,71,255,0.03)",position:"relative",overflow:"hidden"}}>
            <div style={{width:56,height:56,borderRadius:12,background:"rgba(145,71,255,0.1)",border:"1px solid rgba(145,71,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem"}}>🔒</div>
            <span style={{background:"linear-gradient(135deg,#9147ff,#5010b0)",color:"#fff",fontSize:"0.68rem",fontWeight:800,padding:"3px 12px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.14em",boxShadow:"0 2px 10px rgba(145,71,255,0.35)"}}>Release Soon</span>
            <div style={{position:"absolute",inset:0,background:`linear-gradient(105deg,transparent 38%,rgba(145,71,255,0.05) 50%,transparent 62%)`,animation:`shimmer ${2.2+i*0.35}s infinite`}}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function NavBtn({onClick,children}) {
  return (
    <button onClick={onClick} style={{padding:"7px 20px",borderRadius:20,border:"1px solid rgba(145,71,255,0.25)",background:"rgba(145,71,255,0.08)",color:"#a080d0",cursor:"pointer",fontWeight:600,fontSize:"0.82rem",transition:"all 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(145,71,255,0.2)"}
      onMouseLeave={e=>e.currentTarget.style.background="rgba(145,71,255,0.08)"}
    >{children}</button>
  );
}

function LoadSpinner() {
  return (
    <div style={{display:"flex",justifyContent:"center",padding:40}}>
      <div style={{width:32,height:32,borderRadius:"50%",border:"3px solid rgba(145,71,255,0.15)",borderTopColor:"#9147ff",animation:"spin 0.75s linear infinite"}}/>
    </div>
  );
}

function Badge({color,children}) {
  return (
    <span style={{background:`${color}18`,border:`1px solid ${color}44`,color,borderRadius:6,padding:"2px 8px",fontSize:"0.68rem",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
      {children}
    </span>
  );
}

function TwitchSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 28" fill="white">
      <path d="M2.149 0L0 6.229v19.264h6.857V28l3.429-2.507h4.571L24 19.029V0H2.149zm19.429 17.657l-3.428 2.507H13.5l-3.429 2.507v-2.507H4.571V2.507H21.578v15.15zm-3.428-9.921v7.171h-2.286v-7.17h2.286zm-5.714 0v7.171H10.15v-7.17h2.286z"/>
    </svg>
  );
}

// ── AVATAR DROPDOWN ────────────────────────────────────────────────────────
function AvatarMenu({userInfo, isFollower, isSub, subMonths, onLogout}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:8}}>
        <img src={userInfo.profile_image_url} alt="" style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${open?"#9147ff":"rgba(145,71,255,0.4)"}`,transition:"border-color 0.2s",boxShadow:open?"0 0 12px rgba(145,71,255,0.5)":"none"}}/>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="#606080" style={{transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      {open&&(
        <div style={{position:"absolute",right:0,top:"calc(100% + 10px)",width:220,background:"#1a1a2e",border:"1px solid rgba(145,71,255,0.25)",borderRadius:14,boxShadow:"0 16px 40px rgba(0,0,0,0.6)",zIndex:200,overflow:"hidden",animation:"fadeIn 0.15s ease"}}>
          {/* User info header */}
          <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(145,71,255,0.15)",background:"rgba(145,71,255,0.08)"}}>
            <div style={{color:"#fff",fontWeight:700,fontSize:"0.9rem"}}>{userInfo.display_name}</div>
            <div style={{display:"flex",gap:5,marginTop:6}}>
              {isFollower&&<Badge color="#e91916"><Icon.Heart/>Follow</Badge>}
              {isSub&&<Badge color="#9147ff"><Icon.Star/>Sub {subMonths?`· ${subMonths}m`:""}</Badge>}
            </div>
          </div>
          {/* Menu items */}
          <div style={{padding:"6px 0"}}>
            <a href={`https://www.twitch.tv/${userInfo.login}`} target="_blank" rel="noreferrer"
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",color:"#c0b0e0",textDecoration:"none",fontSize:"0.85rem",transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(145,71,255,0.1)"}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              <svg width="14" height="14" viewBox="0 0 24 28" fill="currentColor"><path d="M2.149 0L0 6.229v19.264h6.857V28l3.429-2.507h4.571L24 19.029V0H2.149zm19.429 17.657l-3.428 2.507H13.5l-3.429 2.507v-2.507H4.571V2.507H21.578v15.15zm-3.428-9.921v7.171h-2.286v-7.17h2.286zm-5.714 0v7.171H10.15v-7.17h2.286z"/></svg>
              Voir mon profil Twitch
            </a>
            <div style={{height:1,background:"rgba(145,71,255,0.1)",margin:"4px 0"}}/>
            <button onClick={()=>{setOpen(false);onLogout();}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",color:"#ff6060",background:"none",border:"none",cursor:"pointer",fontSize:"0.85rem",width:"100%",textAlign:"left",transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,60,60,0.1)"}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              <Icon.Logout/> Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── LOGIN ──────────────────────────────────────────────────────────────────
function LoginPage({onLogin}) {
  return (
    <div style={{...appStyle,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",maxWidth:420,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(145,71,255,0.2)",borderRadius:22,padding:"52px 38px",boxShadow:"0 24px 80px rgba(145,71,255,0.12)"}}>
        <DaemsLogo size="lg"/>
        <p style={{color:"#505070",marginTop:6,fontSize:"0.87rem",marginBottom:30}}>Le QG de la communauté Daems_</p>
        <div style={{marginBottom:24}}><NameBanner username="???" tier={0} size="md"/></div>
        <p style={{color:"#454060",fontSize:"0.78rem",marginBottom:20}}>Connecte-toi pour débloquer ta bannière et accéder à tous les contenus !</p>
        <button onClick={onLogin} style={{background:"linear-gradient(135deg,#9147ff,#5010b0)",border:"none",borderRadius:11,color:"#fff",padding:"13px 32px",fontWeight:800,fontSize:"0.95rem",cursor:"pointer",width:"100%",boxShadow:"0 8px 30px rgba(145,71,255,0.45)",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform=""}>
          <TwitchSVG/> Se connecter avec Twitch
        </button>
        <p style={{color:"#303050",fontSize:"0.68rem",marginTop:14}}>Site fan non affilié à Twitch Inc.</p>
      </div>
    </div>
  );
}

// ── LOGO ───────────────────────────────────────────────────────────────────
function DaemsLogo({size="md"}) {
  const fs = size==="lg"?"2.4rem":size==="header"?"1.8rem":"1.35rem";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:size==="lg"?"center":"flex-start",lineHeight:1}}>
      <span style={{fontFamily:"'Cinzel','Georgia',serif",fontWeight:900,fontSize:fs,background:"linear-gradient(135deg,#9147ff 0%,#bf94ff 55%,#ff79c6 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"0.05em",filter:"drop-shadow(0 0 16px rgba(145,71,255,0.5))"}}>
        DAEMS_
      </span>
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────
export default function App() {
  const [token,setToken]       = useState(()=>localStorage.getItem("tw_token"));
  const [userInfo,setUserInfo] = useState(null);
  const [isFollower,setIsFollower] = useState(false);
  const [isSub,setIsSub]       = useState(false);
  const [tab,setTab]           = useState("home");
  const [booting,setBooting]   = useState(true);

  const subMonths   = useIRCSubMonths(token, userInfo?.login);
  const subDuration = isSub ? formatSubDuration(subMonths) : null;
  const bannerTier  = getBannerTier(subMonths, isSub);

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
        if(!u)throw new Error("no user");
        setUserInfo(u);
        try{const f=await twitchGet("/channels/followed",token,{user_id:u.id,broadcaster_id:BROADCASTER_ID});setIsFollower((f.data?.length??0)>0);}catch{setIsFollower(false);}
        try{const s=await twitchGet("/subscriptions/user",token,{broadcaster_id:BROADCASTER_ID,user_id:u.id});setIsSub(Array.isArray(s.data)&&s.data.length>0);}catch{setIsSub(false);}
      })
      .catch(()=>{localStorage.removeItem("tw_token");setToken(null);})
      .finally(()=>setBooting(false));
  },[token]);

  const login=()=>{window.location.href=`https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&force_verify=false`;};
  const logout=()=>{localStorage.removeItem("tw_token");setToken(null);setUserInfo(null);setIsFollower(false);setIsSub(false);};

  if(!token)return<LoginPage onLogin={login}/>;
  if(booting)return<div style={{...appStyle,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><style>{CSS}</style><LoadSpinner/></div>;

  return (
    <div style={appStyle}>
      <style>{CSS}</style>

      <header style={headerStyle}>
        {/* Logo agrandi */}
        <DaemsLogo size="header"/>

        {/* Nav */}
        <nav style={{display:"flex",gap:4}}>
          {TABS.map(({id,label,IC})=>(
            <button key={id} onClick={()=>setTab(id)} style={{
              padding:"8px 18px",borderRadius:10,border:"none",cursor:"pointer",
              fontWeight:tab===id?700:500,fontSize:"0.85rem",
              background:tab===id?"rgba(145,71,255,0.25)":"rgba(255,255,255,0.04)",
              color:tab===id?"#e8d8ff":"#706090",
              borderBottom:`2px solid ${tab===id?"#9147ff":"transparent"}`,
              transition:"all 0.15s",display:"flex",alignItems:"center",gap:7,
              boxShadow:tab===id?"0 2px 12px rgba(145,71,255,0.2)":"none",
            }}
              onMouseEnter={e=>{if(tab!==id)e.currentTarget.style.background="rgba(145,71,255,0.1)";}}
              onMouseLeave={e=>{if(tab!==id)e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
            >
              <IC/>{label}
            </button>
          ))}
        </nav>

        {/* Right — bannière + avatar menu */}
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          {userInfo&&(
            <>
              <NameBanner username={userInfo.display_name} tier={bannerTier} size="sm" subDuration={subDuration}/>
              <AvatarMenu userInfo={userInfo} isFollower={isFollower} isSub={isSub} subMonths={subMonths} onLogout={logout}/>
            </>
          )}
        </div>
      </header>

      <main style={{paddingTop:80,padding:"96px 28px 48px",maxWidth:1280,margin:"0 auto",width:"100%"}}>
        {tab==="home"        &&<HomePage token={token}/>}
        {tab==="clips"       &&<ClipsPage token={token}/>}
        {tab==="leaderboard" &&<LeaderboardPage token={token} userInfo={userInfo} isFollower={isFollower} isSub={isSub}/>}
        {tab==="shop"        &&<ShopPage/>}
      </main>
    </div>
  );
}

const appStyle={background:"#0e0e10",minHeight:"100vh",color:"#efeff1",fontFamily:"'Inter','Segoe UI',sans-serif"};
const headerStyle={
  position:"fixed",top:0,left:0,right:0,zIndex:100,height:74,
  background:"rgba(10,10,18,0.96)",backdropFilter:"blur(24px)",
  borderBottom:"1px solid rgba(145,71,255,0.2)",
  display:"flex",alignItems:"center",justifyContent:"space-between",
  padding:"0 28px",boxShadow:"0 4px 30px rgba(0,0,0,0.5)",
};

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:5px}
  ::-webkit-scrollbar-track{background:#111}
  ::-webkit-scrollbar-thumb{background:#9147ff44;border-radius:3px}
  @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
  @keyframes pulse{0%,100%{opacity:1;box-shadow:0 4px 16px rgba(145,71,255,0.35)}50%{opacity:.88;box-shadow:0 4px 28px rgba(145,71,255,0.65)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
`;