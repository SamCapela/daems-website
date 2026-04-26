import { useState, useEffect, useCallback, useRef } from "react";
import './index.css';

const CLIENT_ID      = "mk16oce917g7q5i485zlyackq33ce0";
const REDIRECT_URI   = window.location.origin;
const BROADCASTER    = "daems_";
const BROADCASTER_ID = "441069979";
const GOAL_FOLLOWERS = 600;
const GOAL_SUBS      = 50;
const SCOPES = ["user:read:email","user:read:follows","user:read:subscriptions","chat:read","chat:edit"].join(" ");

const twitchGet = async (path, token, params = {}) => {
  const url = new URL("https://api.twitch.tv/helix" + path);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "Client-Id": CLIENT_ID } });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
};

// ── IRC ────────────────────────────────────────────────────────────────────
function useIRC(token, username) {
  const [subMonths, setSubMonths] = useState(null);
  const [ircMessages, setIrcMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const usernameRef = useRef(username);
  useEffect(() => { usernameRef.current = username; }, [username]);

  const COLORS = ["#FF4500","#FF69B4","#9ACD32","#00FF7F","#1E90FF","#FF7F50","#DAA520","#8A2BE2","#00CED1","#ADFF2F"];
  const colorFor = (name) => COLORS[name.split("").reduce((a,c)=>a+c.charCodeAt(0),0) % COLORS.length];

  const parseTags = (str) => {
    const tags = {};
    str.split(";").forEach(t => { const [k,...rest]=t.split("="); tags[k]=rest.join("=")||""; });
    return tags;
  };

  const parseBadges = (str) => {
    if (!str || typeof str !== "string") return [];
    return str.split(",").map(b=>b.split("/")[0]).filter(Boolean);
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
      e.data.split(/\r?\n/).filter(Boolean).forEach(raw => {
        if (raw.startsWith("PING")) { ws.send("PONG :tmi.twitch.tv"); return; }
        if (raw.includes("001") || raw.includes("376")) setConnected(true);

        if (raw.includes("USERSTATE") && raw.includes(`#${BROADCASTER}`)) {
          const tagStr = raw.startsWith("@") ? raw.slice(1).split(" ")[0] : "";
          if (tagStr) {
            const tags = parseTags(tagStr);
            const match = (tags["badge-info"]||"").match(/subscriber\/(\d+)/);
            if (match) setSubMonths(parseInt(match[1]));
          }
        }

        if (raw.includes("PRIVMSG")) {
          let tags = {};
          if (raw.startsWith("@")) tags = parseTags(raw.slice(1).split(" ")[0]);
          const msgMatch  = raw.match(/PRIVMSG #\S+ :(.+)$/);
          const userMatch = raw.match(/:(\w+)!\w+@/);
          if (!msgMatch || !userMatch) return;
          const displayName = tags["display-name"] || userMatch[1];
          const color       = tags["color"] || colorFor(displayName);
          const badges      = tags["badges"]||"";
          const subMonthsMsg = tags["badge-info"]?.match(/subscriber\/(\d+)/)?.[1];
          const msgId       = tags["id"] || `irc-${Date.now()}-${Math.random()}`;
          const msgText     = msgMatch[1];
          const msgTs       = parseInt(tags["tmi-sent-ts"] || Date.now());
          setIrcMessages(prev => [...prev, {
            id: msgId, displayName, color, badges,
            text: msgText, isMod: tags["mod"]==="1",
            subMonths: subMonthsMsg, ts: msgTs,
          }].slice(-150));
        }

        if (raw.includes("USERNOTICE")) {
          let tags = {};
          if (raw.startsWith("@")) tags = parseTags(raw.slice(1).split(" ")[0]);
          const sysMsg = tags["system-msg"]?.replace(/\\s/g," ")||"";
          if (sysMsg) setIrcMessages(prev => [...prev, { id:`sys-${Date.now()}`, isSystem:true, text:sysMsg, ts:Date.now() }].slice(-150));
        }
      });
    };

    ws.onerror = () => {};
    ws.onclose = () => { setConnected(false); };
    return () => { wsRef.current = null; try { ws.close(); } catch {} };
  }, [token, username]);

  const sendIRC = useCallback((msg) => {
    const ws = wsRef.current;
    if (!msg?.trim() || !ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(`PRIVMSG #${BROADCASTER} :${msg.trim()}`);
    return true;
  }, []);

  // DEBUG ONLY
  useEffect(() => {
    window.__testMsg = (name = "TestUser", text = "Salut le stream !", asSub = false) =>
      setIrcMessages(prev => [...prev, {
        id: `test-${Date.now()}`, displayName: name,
        color: "#FF4500", badges: asSub ? "subscriber/0" : "", text,
        subMonths: asSub ? "3" : null, ts: Date.now(),
      }].slice(-150));
    return () => { delete window.__testMsg; };
  }, []);

  return { subMonths, ircMessages, connected, sendIRC, parseBadges };
}

// ── BANNER ─────────────────────────────────────────────────────────────────
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

function MiniUserBanner({ name, color, subMonths }) {
  const tier = getBannerTier(subMonths, true);
  const s    = bannerStyles[tier];
  return (
    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:s.bg,border:s.border,borderRadius:5,boxShadow:s.shadow,padding:"2px 10px",height:22,position:"relative",overflow:"hidden"}}>
      {s.shimmer&&<span style={{position:"absolute",inset:0,background:"linear-gradient(105deg,transparent 38%,rgba(80,180,255,0.15) 50%,transparent 62%)",animation:"shimmer 2.5s infinite"}}/>}
      <span style={{color:s.textColor,fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:"0.75rem",letterSpacing:"0.05em",textShadow:s.textShadow,zIndex:1,whiteSpace:"nowrap"}}>{name}</span>
    </span>
  );
}

// ── ICONS ──────────────────────────────────────────────────────────────────
const Icon = {
  Home:   ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  Clips:  ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>,
  Shop:   ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3z"/></svg>,
  Heart:  ()=><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  Star:   ()=><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  Users:  ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  Gift:   ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.07-.28.18-.54.18-.83C18 3.43 16.57 2 14.83 2c-.9 0-1.6.4-2.13 1.03L12 3.9l-.7-.87C10.77 2.4 10.07 2 9.17 2 7.43 2 6 3.43 6 5.17c0 .29.1.55.18.83H4c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5-.83c0-.46.37-.83.83-.83s.83.37.83.83-.37.83-.83.83H14l.83-.83zM9.17 4.34c.46 0 .83.37.83.83L10.83 6H9.17c-.46 0-.83-.37-.83-.83s.37-.83.83-.83zM20 14H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2z"/></svg>,
  Logout: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>,
};

const TABS = [
  {id:"home",  label:"Accueil", IC:Icon.Home},
  {id:"clips", label:"Clips",   IC:Icon.Clips},
  {id:"shop",  label:"Boutique",IC:Icon.Shop},
];

// ── SVG COMPONENTS ─────────────────────────────────────────────────────────
function TwitchSVG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 28" fill="white">
      <path d="M2.149 0L0 6.229v19.264h6.857V28l3.429-2.507h4.571L24 19.029V0H2.149zm19.429 17.657l-3.428 2.507H13.5l-3.429 2.507v-2.507H4.571V2.507H21.578v15.15zm-3.428-9.921v7.171h-2.286v-7.17h2.286zm-5.714 0v7.171H10.15v-7.17h2.286z"/>
    </svg>
  );
}

function RaccoonIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="14" cy="17" rx="11" ry="13" fill="#7d7c84" stroke="#1c1828" strokeWidth="1.8"/>
      <ellipse cx="14" cy="19" rx="6" ry="8" fill="#f8bcc0"/>
      <ellipse cx="50" cy="17" rx="11" ry="13" fill="#7d7c84" stroke="#1c1828" strokeWidth="1.8"/>
      <ellipse cx="50" cy="19" rx="6" ry="8" fill="#f8bcc0"/>
      <circle cx="32" cy="38" r="24" fill="#7d7c84" stroke="#1c1828" strokeWidth="1.8"/>
      <ellipse cx="32" cy="46" rx="15" ry="11" fill="#c4c2cc"/>
      <ellipse cx="22" cy="35" rx="9.5" ry="7" fill="#1c1828" transform="rotate(-6 22 35)"/>
      <ellipse cx="42" cy="35" rx="9.5" ry="7" fill="#1c1828" transform="rotate(6 42 35)"/>
      <circle cx="22" cy="35" r="6" fill="#f8f8ff"/>
      <circle cx="42" cy="35" r="6" fill="#f8f8ff"/>
      <circle cx="23" cy="36" r="3.8" fill="#1c1828"/>
      <circle cx="43" cy="36" r="3.8" fill="#1c1828"/>
      <circle cx="25" cy="34" r="1.4" fill="white"/>
      <circle cx="45" cy="34" r="1.4" fill="white"/>
      <ellipse cx="32" cy="46" rx="3.5" ry="2.5" fill="#1c1828"/>
      <path d="M 25 52 Q 32 58 39 52" stroke="#1c1828" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function RaccoonMascot({ size = 220, style }) {
  return (
    <svg width={size} height={size * (260/220)} viewBox="0 0 220 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <defs>
        <radialGradient id="raccBg" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="110" cy="160" rx="96" ry="82" fill="url(#raccBg)"/>
      {/* Tail */}
      <g transform="translate(176,226) rotate(-28)">
        <ellipse cx="0" cy="0" rx="12" ry="34" fill="#7d7c84"/>
        <ellipse cx="0" cy="-12" rx="9" ry="8" fill="#c4c2cc"/>
        <ellipse cx="0" cy="4"  rx="9" ry="7" fill="#c4c2cc"/>
        <ellipse cx="0" cy="18" rx="8" ry="7" fill="#c4c2cc"/>
        <ellipse cx="0" cy="0" rx="12" ry="34" fill="none" stroke="#1c1828" strokeWidth="2"/>
      </g>
      {/* Body */}
      <ellipse cx="110" cy="218" rx="54" ry="38" fill="#7d7c84" stroke="#1c1828" strokeWidth="2.5"/>
      <ellipse cx="110" cy="218" rx="35" ry="25" fill="#c4c2cc"/>
      {/* Left ear */}
      <ellipse cx="62" cy="67" rx="23" ry="27" fill="#7d7c84" stroke="#1c1828" strokeWidth="2.5"/>
      <ellipse cx="62" cy="70"  rx="13" ry="17" fill="#f8bcc0"/>
      {/* Right ear */}
      <ellipse cx="158" cy="67" rx="23" ry="27" fill="#7d7c84" stroke="#1c1828" strokeWidth="2.5"/>
      <ellipse cx="158" cy="70" rx="13" ry="17" fill="#f8bcc0"/>
      {/* Head */}
      <circle cx="110" cy="118" r="60" fill="#7d7c84" stroke="#1c1828" strokeWidth="2.5"/>
      {/* Muzzle */}
      <ellipse cx="110" cy="131" rx="42" ry="30" fill="#c4c2cc"/>
      {/* Eye masks */}
      <ellipse cx="84" cy="109" rx="22" ry="16" fill="#1c1828" transform="rotate(-7 84 109)"/>
      <ellipse cx="136" cy="109" rx="22" ry="16" fill="#1c1828" transform="rotate(7 136 109)"/>
      {/* Eye whites */}
      <circle cx="84"  cy="109" r="12.5" fill="#f8f8ff"/>
      <circle cx="136" cy="109" r="12.5" fill="#f8f8ff"/>
      {/* Pupils */}
      <circle cx="86"  cy="110" r="8" fill="#1c1828"/>
      <circle cx="138" cy="110" r="8" fill="#1c1828"/>
      {/* Eye shines */}
      <circle cx="89"  cy="106" r="2.8" fill="white"/>
      <circle cx="141" cy="106" r="2.8" fill="white"/>
      {/* Nose */}
      <ellipse cx="110" cy="131" rx="8" ry="6" fill="#1c1828"/>
      {/* Smile */}
      <path d="M 97 143 Q 110 157 123 143" stroke="#1c1828" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Left arm */}
      <path d="M 63 198 Q 50 178 50 163" stroke="#7d7c84" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <circle cx="50" cy="161" r="10" fill="#7d7c84" stroke="#1c1828" strokeWidth="2"/>
      {/* Right arm raised (wave) */}
      <path d="M 157 196 Q 184 168 190 142" stroke="#7d7c84" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <circle cx="190" cy="140" r="12" fill="#7d7c84" stroke="#1c1828" strokeWidth="2"/>
      {/* Head highlight */}
      <ellipse cx="95" cy="84" rx="10" ry="6" fill="rgba(255,255,255,0.13)" transform="rotate(-25 95 84)"/>
      {/* Sparkle accent top-right */}
      <g transform="translate(200,74)">
        <path d="M0,-7 L1.3,-1.3 L7,0 L1.3,1.3 L0,7 L-1.3,1.3 L-7,0 L-1.3,-1.3 Z" fill="#f97316" opacity="0.85"/>
      </g>
      {/* Sparkle accent top-left */}
      <g transform="translate(26,88)">
        <path d="M0,-5 L0.9,-0.9 L5,0 L0.9,0.9 L0,5 L-0.9,0.9 L-5,0 L-0.9,-0.9 Z" fill="#a78bfa" opacity="0.7"/>
      </g>
      {/* Small star near raised paw */}
      <g transform="translate(202,116)">
        <path d="M0,-4 L0.7,-0.7 L4,0 L0.7,0.7 L0,4 L-0.7,0.7 L-4,0 L-0.7,-0.7 Z" fill="#fbbf24" opacity="0.9"/>
      </g>
    </svg>
  );
}

function DaemsLogo({ size = "md" }) {
  const cfg = {
    header: { iconSize: 34, fs: "1.65rem" },
    lg:     { iconSize: 52, fs: "2.6rem"  },
    md:     { iconSize: 28, fs: "1.35rem" },
    sm:     { iconSize: 22, fs: "1.05rem" },
  }[size] || { iconSize: 28, fs: "1.35rem" };
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <RaccoonIcon size={cfg.iconSize}/>
      <span style={{fontFamily:"'Fredoka',sans-serif",fontWeight:700,fontSize:cfg.fs,color:"#f1f0ff",letterSpacing:"0.01em",lineHeight:1}}>
        daems<span style={{color:"#f97316",display:"inline-block",animation:"underscoreBlink 2s ease-in-out infinite"}}>_</span>
      </span>
    </div>
  );
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function LoadSpinner() {
  return (
    <div style={{display:"flex",justifyContent:"center",padding:48}}>
      <div style={{width:34,height:34,borderRadius:"50%",border:"3px solid rgba(124,58,237,0.15)",borderTopColor:"#7c3aed",animation:"spin 0.75s linear infinite"}}/>
    </div>
  );
}

function NavBtn({onClick,children}) {
  return (
    <button onClick={onClick} className="btn btn-ghost btn-sm">{children}</button>
  );
}

function Badge({color,children}) {
  return (
    <span style={{background:`${color}18`,border:`1px solid ${color}44`,color,borderRadius:6,padding:"2px 8px",fontSize:"0.68rem",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
      {children}
    </span>
  );
}

// ── CHAT ───────────────────────────────────────────────────────────────────
function TwitchChat({ ircMessages, connected, sendIRC, parseBadges, userInfo }) {
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState([]);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const allMessages = (() => {
    const ircTexts = new Set(ircMessages.map(m => m.text));
    const filteredLocal = localMessages.filter(m => !ircTexts.has(m.text));
    const all = [...ircMessages, ...filteredLocal];
    all.sort((a,b) => (a.ts||0) - (b.ts||0));
    return all;
  })();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [allMessages.length]);

  const badgeEmoji = (badge) => {
    const map = { broadcaster:"🎙", moderator:"⚔️", subscriber:"⭐", vip:"💎", staff:"🛡", partner:"✅", premium:"👑" };
    return map[badge] || null;
  };

  const send = () => {
    if (!input.trim() || !connected) return;
    const sent = sendIRC(input.trim());
    if (sent) {
      setLocalMessages(prev => [...prev, {
        id: `local-${Date.now()}`,
        displayName: userInfo?.display_name || "Moi",
        color: "#7c3aed",
        badges: "",
        text: input.trim(),
        isLocal: true,
        ts: Date.now(),
      }].slice(-150));
      setInput("");
      inputRef.current?.focus();
    }
  };

  return (
    <div style={{borderRadius:16,border:"1px solid rgba(124,58,237,0.22)",display:"flex",flexDirection:"column",height:"100%",minHeight:460,overflow:"hidden",background:"#0d0b1e"}}>
      {/* Header */}
      <div style={{padding:"10px 14px",background:"rgba(124,58,237,0.1)",borderBottom:"1px solid rgba(124,58,237,0.18)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#a78bfa"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          <span style={{fontFamily:"'Fredoka',sans-serif",fontSize:"0.85rem",fontWeight:600,color:"#a78bfa",letterSpacing:"0.08em"}}>Chat live</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:connected?"#10b981":"#ef4444",boxShadow:connected?"0 0 7px #10b981":"none"}}/>
          <span style={{fontSize:"0.65rem",color:connected?"#10b981":"#ef4444",fontWeight:600}}>{connected?"Connecté":"Déconnecté"}</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:2}}>
        {allMessages.length === 0 && (
          <div style={{color:"#3a3660",fontSize:"0.8rem",textAlign:"center",marginTop:40,fontStyle:"italic"}}>En attente de messages…</div>
        )}
        {allMessages.map(msg => (
          msg.isSystem ? (
            <div key={msg.id} style={{background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.22)",borderRadius:8,padding:"6px 10px",fontSize:"0.78rem",color:"#a78bfa",textAlign:"center",margin:"4px 0"}}>
              🎉 {msg.text}
            </div>
          ) : (
            <div key={msg.id} style={{display:"flex",gap:6,alignItems:"flex-start",padding:"2px 4px",borderRadius:6,transition:"background 0.1s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              <span style={{fontSize:"0.7rem",flexShrink:0,paddingTop:2}}>
                {parseBadges(typeof msg.badges==="string"?msg.badges:"").map(b=>badgeEmoji(b)).filter(Boolean).join("")}
              </span>
              <div style={{flex:1,fontSize:"0.82rem",lineHeight:1.5,wordBreak:"break-word"}}>
                {msg.subMonths ? (
                  <span style={{display:"inline-flex",alignItems:"center",marginRight:6,verticalAlign:"middle"}}>
                    <MiniUserBanner name={msg.displayName} color={msg.color} subMonths={parseInt(msg.subMonths)}/>
                  </span>
                ) : (
                  <span style={{color:msg.color,fontWeight:700,marginRight:4}}>{msg.displayName}</span>
                )}
                <span style={{color:msg.isLocal?"#c0a8ff":"#ccc8e0"}}>: {msg.text}</span>
              </div>
            </div>
          )
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"10px 12px",borderTop:"1px solid rgba(124,58,237,0.15)",display:"flex",gap:8,flexShrink:0,background:"rgba(0,0,0,0.22)"}}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder={connected?"Envoyer un message…":"Connexion…"}
          disabled={!connected} maxLength={500}
          className="chat-input"
        />
        <button onClick={send} disabled={!connected||!input.trim()}
          style={{background:connected&&input.trim()?"linear-gradient(135deg,#7c3aed,#5b21b6)":"rgba(255,255,255,0.05)",border:"none",borderRadius:8,padding:"8px 14px",color:connected&&input.trim()?"#fff":"#3a3660",cursor:connected&&input.trim()?"pointer":"not-allowed",transition:"all 0.18s",flexShrink:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── ACTIVITY TICKER ────────────────────────────────────────────────────────
function ActivityTicker({ token }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!token) return;
    fetch(`${window.location.origin}/api/recent-activity`)
      .then(r=>r.json()).then(d=>{ const l=d.data||[]; if(l.length>0) setItems([...l,...l]); }).catch(()=>{});
  }, [token]);
  if (items.length === 0) return null;

  const typeClass = (type) => type==="sub"?"ticker-item-sub":type==="subgift"?"ticker-item-gift":"ticker-item-cheer";

  return (
    <div style={{position:"relative",overflow:"hidden",background:"rgba(124,58,237,0.05)",border:"1px solid rgba(124,58,237,0.14)",borderRadius:14,padding:"11px 0"}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:80,background:"linear-gradient(to right,#0b0914,transparent)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:80,background:"linear-gradient(to left,#0b0914,transparent)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,padding:"0 20px"}}>
        <span style={{fontFamily:"'Fredoka',sans-serif",fontSize:"0.75rem",color:"#5e5a7e",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase"}}>Activité récente</span>
        <div style={{flex:1,height:1,background:"rgba(124,58,237,0.15)"}}/>
      </div>
      <div style={{display:"flex",gap:10,padding:"2px 20px",animation:"ticker 90s linear infinite",width:"max-content"}}>
        {items.map((item,i)=>(
          <div key={i} className={typeClass(item.type)}
            style={{display:"flex",alignItems:"center",gap:8,background:"var(--item-color,rgba(124,58,237,0.1))",border:"1px solid var(--item-border,rgba(124,58,237,0.22))",borderRadius:20,padding:"5px 14px",whiteSpace:"nowrap",flexShrink:0}}>
            <span style={{fontSize:"0.82rem"}}>{item.icon}</span>
            <span style={{color:"#e8e0ff",fontWeight:700,fontSize:"0.8rem"}}>{item.name}</span>
            <span style={{color:"#6e6a8a",fontSize:"0.7rem"}}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── GOAL CARD ──────────────────────────────────────────────────────────────
function GoalCard({icon,label,value,goal,color}) {
  const current = value ?? 0;
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  const pctDisplay = Math.round(pct);
  return (
    <div style={{background:`linear-gradient(135deg,${color}12,${color}05)`,border:`1px solid ${color}28`,borderRadius:14,padding:"16px 20px",flex:1}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{color,opacity:0.88}}>{icon}</div>
          <span style={{fontFamily:"'Fredoka',sans-serif",fontSize:"0.78rem",color:"#7a7698",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600}}>{label}</span>
        </div>
        <div style={{lineHeight:1}}>
          <span style={{fontFamily:"'Fredoka',sans-serif",fontSize:"1.5rem",fontWeight:700,color:"#f1f0ff"}}>{value !== null ? value.toLocaleString("fr-FR") : "…"}</span>
          <span style={{fontSize:"0.75rem",color:"#4a4868",fontWeight:500}}>{" /"}{goal.toLocaleString("fr-FR")}</span>
        </div>
      </div>
      <div style={{position:"relative",height:10,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${pct}%`,background:`linear-gradient(90deg,${color}55,${color})`,borderRadius:99,boxShadow:`0 0 12px ${color}70`,transition:"width 1.2s cubic-bezier(.4,0,.2,1)"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.1) 50%,transparent 62%)",animation:"shimmer 2.8s infinite"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
        <span style={{fontSize:"0.62rem",color:"#3a3858"}}>{value !== null ? value.toLocaleString("fr-FR") : "…"}&thinsp;/&thinsp;{goal.toLocaleString("fr-FR")}</span>
        <span style={{fontFamily:"'Fredoka',sans-serif",fontSize:"0.72rem",fontWeight:600,color:pct>=90?color:"#4a4868"}}>{pctDisplay}%</span>
      </div>
    </div>
  );
}

// ── HOME ───────────────────────────────────────────────────────────────────
function HomePage({ token, userInfo, ircMessages, connected, sendIRC, parseBadges }) {
  const [stats, setStats] = useState({followers:null,subs:null});
  useEffect(() => {
    if (!token) return;
    Promise.all([
      twitchGet("/channels/followers",token,{broadcaster_id:BROADCASTER_ID,first:1}),
      fetch(`${window.location.origin}/api/sub-count`).then(r=>r.ok?r.json():{total:null}).catch(()=>({total:null})),
    ]).then(([f,s])=>setStats({followers:f.total??null,subs:s.total??null})).catch(()=>{});
  }, [token]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Player + Chat */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16,minHeight:460}}>
        <div style={{borderRadius:16,overflow:"hidden",border:"1px solid rgba(124,58,237,0.28)",boxShadow:"0 0 40px rgba(124,58,237,0.12)"}}>
          <iframe src={`https://player.twitch.tv/?channel=${BROADCASTER}&parent=${window.location.hostname}&autoplay=false`}
            height="100%" width="100%" style={{display:"block",minHeight:420,border:"none"}} allowFullScreen/>
        </div>
        <TwitchChat ircMessages={ircMessages} connected={connected} sendIRC={sendIRC} parseBadges={parseBadges} userInfo={userInfo}/>
      </div>

      {/* Activity */}
      <ActivityTicker token={token}/>

      {/* Goals + SubGift */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,columnGap:28,alignItems:"stretch"}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <GoalCard icon={<Icon.Users/>} label="Followers" value={stats.followers} goal={GOAL_FOLLOWERS} color="#7c3aed"/>
          <GoalCard icon={<Icon.Star/>}  label="Abonnés"   value={stats.subs}      goal={GOAL_SUBS}      color="#f97316"/>
        </div>
        <div style={{animation:"giftFloat 3.5s ease-in-out infinite"}}>
          <a href={`https://www.twitch.tv/${BROADCASTER}`} target="_blank" rel="noreferrer"
            style={{display:"block",borderRadius:14,overflow:"hidden",cursor:"pointer",textDecoration:"none",boxShadow:"0 0 14px rgba(124,58,237,0.5), 0 0 8px rgba(249,115,22,0.3)",transition:"transform 0.25s,box-shadow 0.25s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";e.currentTarget.style.boxShadow="0 0 32px rgba(124,58,237,0.85), 0 0 18px rgba(249,115,22,0.6)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 0 14px rgba(124,58,237,0.5), 0 0 8px rgba(249,115,22,0.3)";}}
          >
            <img src="/racoonsubgift.png" alt="Offrir un sub" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",borderRadius:14}}/>
          </a>
        </div>
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
      <div style={{display:"flex",gap:10,marginBottom:24,alignItems:"center"}}>
        <span style={{fontFamily:"'Fredoka',sans-serif",fontSize:"0.82rem",color:"#5e5a7e",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em"}}>Période</span>
        {["week","month"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`filter-btn${filter===f?" active":""}`}>
            {f==="week"?"Cette semaine":"Ce mois"}
          </button>
        ))}
        <span style={{marginLeft:"auto",color:"#3a3858",fontSize:"0.76rem"}}>Page {page}</span>
      </div>
      {loading ? <LoadSpinner/> : clips.length===0 ? (
        <div style={{textAlign:"center",padding:72,color:"#3a3858"}}>
          <RaccoonIcon size={52} style={{margin:"0 auto 16px",opacity:0.4}}/>
          <p style={{fontSize:"0.9rem"}}>Aucun clip sur cette période.</p>
        </div>
      ) : (
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

function ClipCard({clip}) {
  return (
    <a href={clip.url} target="_blank" rel="noreferrer" className="clip-card">
      <div style={{position:"relative"}}>
        <img src={clip.thumbnail_url} alt={clip.title} style={{width:"100%",aspectRatio:"16/9",objectFit:"cover",display:"block"}}/>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.25)"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(124,58,237,0.88)",borderRadius:"50%",width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px rgba(124,58,237,0.6)"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.75)",borderRadius:6,padding:"3px 8px",display:"flex",alignItems:"center",gap:5}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#a78bfa"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
          <span style={{color:"#a78bfa",fontWeight:700,fontSize:"0.72rem"}}>{clip.view_count?.toLocaleString("fr-FR")}</span>
        </div>
      </div>
      <div style={{padding:"12px 14px"}}>
        <div style={{color:"#e0d8f8",fontWeight:600,fontSize:"0.87rem",lineHeight:1.35,marginBottom:8,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{clip.title}</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.7rem",color:"#5e5a7e"}}>
          <span>{clip.creator_name}</span>
          <span>{new Date(clip.created_at).toLocaleDateString("fr-FR")}</span>
        </div>
      </div>
    </a>
  );
}

// ── SHOP ───────────────────────────────────────────────────────────────────
function ShopPage() {
  return (
    <div>
      {/* Header with mascot */}
      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:32,alignItems:"center",marginBottom:40,background:"linear-gradient(135deg,rgba(124,58,237,0.08),rgba(249,115,22,0.05))",border:"1px solid rgba(124,58,237,0.18)",borderRadius:20,padding:"32px 40px",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",top:-60,right:120,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div>
          <h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:"2rem",fontWeight:700,color:"#f1f0ff",marginBottom:10,lineHeight:1.15}}>
            La boutique <span style={{color:"#f97316"}}>daems_</span>
          </h2>
          <p style={{color:"#7a7698",fontSize:"0.95rem",lineHeight:1.6,maxWidth:420}}>
            Des merches exclusifs arrivent bientôt… Le raton vous prépare quelque chose de beau. Restez connectés. 👀
          </p>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,marginTop:16,padding:"8px 16px",background:"rgba(249,115,22,0.12)",border:"1px solid rgba(249,115,22,0.28)",borderRadius:99}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#f97316",animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:"0.78rem",color:"#f97316",fontWeight:700,letterSpacing:"0.06em"}}>Coming soon</span>
          </div>
        </div>
        <div style={{animation:"raccoonFloat 4s ease-in-out infinite",filter:"drop-shadow(0 10px 24px rgba(124,58,237,0.35))"}}>
          <img src="/logo-round.png" alt="daems_" style={{width:148,height:148,objectFit:"contain",display:"block"}}/>
        </div>
      </div>

      {/* Items grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
        {Array.from({length:6}).map((_,i)=>(
          <div key={i} className="shop-item">
            <div style={{width:58,height:58,borderRadius:14,background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.7rem"}}>🔒</div>
            <span style={{background:"linear-gradient(135deg,#7c3aed,#5b21b6)",color:"#fff",fontSize:"0.68rem",fontWeight:800,padding:"4px 14px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.14em",boxShadow:"0 2px 12px rgba(124,58,237,0.4)"}}>Bientôt</span>
            <div style={{position:"absolute",inset:0,background:`linear-gradient(105deg,transparent 38%,rgba(124,58,237,0.05) 50%,transparent 62%)`,animation:`shimmer ${2.2+i*0.35}s infinite`}}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AVATAR MENU ────────────────────────────────────────────────────────────
function AvatarMenu({userInfo, isFollower, isSub, subMonths, onLogout}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:8}}>
        <img src={userInfo.profile_image_url} alt="" style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${open?"#7c3aed":"rgba(124,58,237,0.4)"}`,transition:"border-color 0.2s",boxShadow:open?"0 0 14px rgba(124,58,237,0.5)":"none"}}/>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="#5e5a7e" style={{transform:open?"rotate(180deg)":"",transition:"transform 0.2s"}}><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      {open&&(
        <div className="avatar-dropdown">
          <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(124,58,237,0.15)",background:"rgba(124,58,237,0.08)"}}>
            <div style={{fontFamily:"'Fredoka',sans-serif",color:"#f1f0ff",fontWeight:600,fontSize:"0.95rem"}}>{userInfo.display_name}</div>
            <div style={{display:"flex",gap:5,marginTop:7}}>
              {isFollower&&<Badge color="#ef4444"><Icon.Heart/>Follow</Badge>}
              {isSub&&<Badge color="#7c3aed"><Icon.Star/>Sub {subMonths?`· ${subMonths}m`:""}</Badge>}
            </div>
          </div>
          <div style={{padding:"6px 0"}}>
            <a href={`https://www.twitch.tv/${userInfo.login}`} target="_blank" rel="noreferrer" className="avatar-menu-link">
              <TwitchSVG/> Voir mon profil Twitch
            </a>
            <div style={{height:1,background:"rgba(124,58,237,0.1)",margin:"4px 0"}}/>
            <button onClick={()=>{setOpen(false);onLogout();}} className="avatar-menu-btn">
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
    <div className="login-page">
      <div className="login-glow-1"/>
      <div className="login-glow-2"/>
      <div className="login-inner">
        <div className="login-text">
          <DaemsLogo size="lg"/>
          <h1 className="login-title">
            Le QG officiel de<br/>la <span className="acc">communauté</span>
          </h1>
          <p className="login-subtitle">
            Rejoins la meute, suis le stream en direct, débloque ta bannière exclusive et accède à tous les contenus réservés à la communauté !
          </p>
          <div className="login-features">
            {["Bannière de fidélité exclusive selon tes mois d'abonnement","Chat live intégré directement sur le site","Clips et meilleurs moments de daems_","Boutique exclusive — bientôt disponible"].map((f,i)=>(
              <div key={i} className="login-feature">
                <div className="login-feature-dot"/>
                {f}
              </div>
            ))}
          </div>
          <button onClick={onLogin} className="btn btn-twitch">
            <TwitchSVG/> Se connecter avec Twitch
          </button>
          <p className="login-disclaimer">Site fan non affilié à Twitch Inc.</p>
        </div>
        <div className="login-mascot">
          <div className="login-mascot-glow"/>
          <RaccoonMascot size={300} className="raccoon-float"/>
        </div>
      </div>
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

  const { subMonths, ircMessages, connected, sendIRC, parseBadges } = useIRC(token, userInfo?.login);
  const subDuration = isSub ? formatSubDuration(subMonths) : null;
  const bannerTier  = getBannerTier(subMonths, isSub);

  // DEBUG ONLY
  useEffect(() => {
    window.__forceUnsub = () => setIsSub(false);
    window.__resetSub   = () => setIsSub(true);
    return () => { delete window.__forceUnsub; delete window.__resetSub; };
  }, []);

  const login = () => {
    window.location.href = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&force_verify=false`;
  };

  const logout = () => {
    localStorage.removeItem("tw_token");
    setToken(null); setUserInfo(null); setIsFollower(false); setIsSub(false);
  };

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

  useEffect(() => {
    if (!token || !userInfo || subMonths === null) return;
    fetch(`${window.location.origin}/api/store-viewer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, user_id: userInfo.id, display_name: userInfo.display_name, sub_months: subMonths, is_sub: isSub }),
    }).catch(()=>{});
  }, [token, userInfo?.id, subMonths, isSub]);

  if(!token) return <LoginPage onLogin={login}/>;
  if(booting) return (
    <div className="app-wrapper" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <LoadSpinner/>
    </div>
  );

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <img src="/logo-daems.png" alt="daems_" style={{height:58,objectFit:"contain",display:"block"}}/>
        <nav className="app-nav">
          {TABS.map(({id,label,IC})=>(
            <button key={id} onClick={()=>setTab(id)} className={`nav-tab${tab===id?" active":""}`}>
              <IC/>{label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          {userInfo&&(
            <>
              {!isSub&&(
                <a href={`https://www.twitch.tv/subs/${BROADCASTER}`} target="_blank" rel="noreferrer" className="btn btn-accent btn-sm">
                  <Icon.Star/>S'abonner
                </a>
              )}
              <NameBanner username={userInfo.display_name} tier={bannerTier} size="sm" subDuration={subDuration}/>
              <AvatarMenu userInfo={userInfo} isFollower={isFollower} isSub={isSub} subMonths={subMonths} onLogout={logout}/>
            </>
          )}
        </div>
      </header>
      <main className="app-main">
        {tab==="home"  && <HomePage token={token} userInfo={userInfo} ircMessages={ircMessages} connected={connected} sendIRC={sendIRC} parseBadges={parseBadges}/>}
        {tab==="clips" && <ClipsPage token={token}/>}
        {tab==="shop"  && <ShopPage/>}
      </main>
    </div>
  );
}
