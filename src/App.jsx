import { useState, useEffect, useCallback, useRef } from "react";
import './index.css';

const CLIENT_ID      = "mk16oce917g7q5i485zlyackq33ce0";
const REDIRECT_URI   = window.location.origin;
const BROADCASTER    = "daems_";
const BROADCASTER_ID = "441069979";
const GOAL_FOLLOWERS = 600;
const GOAL_SUBS      = 50;
const SCOPES = ["user:read:email","user:read:follows","user:read:subscriptions","chat:read","chat:edit"].join(" ");

const SCHEDULE = [
  { day:"Lundi",    game:"League of Legends", color:"#C89B3C", type:"GAME"    },
  { day:"Mardi",    game:"Valorant",           color:"#FF4655", type:"GAME"    },
  { day:"Mercredi", game:"OFF",                color:"#3a3060", type:"OFF"     },
  { day:"Jeudi",    game:"Collab",             color:"#9146ff", type:"COLLAB"  },
  { day:"Vendredi", game:"Just Chatting",      color:"#10b981", type:"CHAT"    },
  { day:"Samedi",   game:"Marathon",           color:"#ff6b9d", type:"SPECIAL" },
  { day:"Dimanche", game:"OFF",                color:"#3a3060", type:"OFF"     },
];

const MILESTONES = [
  { label:"10 followers",  done:true  },
  { label:"50 followers",  done:true  },
  { label:"100 followers", done:true  },
  { label:"Affiliation",   done:false, current:true, progress:596, goal:600 },
  { label:"500 followers", done:false },
  { label:"1K followers",  done:false },
  { label:"Partenaire",    done:false, dream:true   },
];

const twitchGet = async (path, token, params = {}) => {
  const url = new URL("https://api.twitch.tv/helix" + path);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const r = await fetch(url, { headers: { Authorization:`Bearer ${token}`, "Client-Id":CLIENT_ID } });
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
  const parseTags = (str) => { const t={}; str.split(";").forEach(p=>{const[k,...r]=p.split("=");t[k]=r.join("=")||"";}); return t; };
  const parseBadges = (str) => { if(!str||typeof str!=="string") return []; return str.split(",").map(b=>b.split("/")[0]).filter(Boolean); };

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
        if (raw.includes("001")||raw.includes("376")) setConnected(true);
        if (raw.includes("USERSTATE")&&raw.includes(`#${BROADCASTER}`)) {
          const tagStr=raw.startsWith("@")?raw.slice(1).split(" ")[0]:"";
          if (tagStr) { const tags=parseTags(tagStr); const m=(tags["badge-info"]||"").match(/subscriber\/(\d+)/); if(m) setSubMonths(parseInt(m[1])); }
        }
        if (raw.includes("PRIVMSG")) {
          let tags={};
          if(raw.startsWith("@")) tags=parseTags(raw.slice(1).split(" ")[0]);
          const msgMatch=raw.match(/PRIVMSG #\S+ :(.+)$/);
          const userMatch=raw.match(/:(\w+)!\w+@/);
          if(!msgMatch||!userMatch) return;
          const displayName=tags["display-name"]||userMatch[1];
          const color=tags["color"]||colorFor(displayName);
          const badges=tags["badges"]||"";
          const subMonthsMsg=tags["badge-info"]?.match(/subscriber\/(\d+)/)?.[1];
          const msgId=tags["id"]||`irc-${Date.now()}-${Math.random()}`;
          setIrcMessages(prev=>[...prev,{id:msgId,displayName,color,badges,text:msgMatch[1],isMod:tags["mod"]==="1",subMonths:subMonthsMsg,ts:parseInt(tags["tmi-sent-ts"]||Date.now())}].slice(-150));
        }
        if (raw.includes("USERNOTICE")) {
          let tags={};
          if(raw.startsWith("@")) tags=parseTags(raw.slice(1).split(" ")[0]);
          const sysMsg=tags["system-msg"]?.replace(/\\s/g," ")||"";
          if(sysMsg) setIrcMessages(prev=>[...prev,{id:`sys-${Date.now()}`,isSystem:true,text:sysMsg,ts:Date.now()}].slice(-150));
        }
      });
    };
    ws.onerror=()=>{};
    ws.onclose=()=>setConnected(false);
    return ()=>{ wsRef.current=null; try{ws.close();}catch{} };
  }, [token, username]);

  const sendIRC = useCallback((msg) => {
    const ws=wsRef.current;
    if(!msg?.trim()||!ws||ws.readyState!==WebSocket.OPEN) return false;
    ws.send(`PRIVMSG #${BROADCASTER} :${msg.trim()}`);
    return true;
  }, []);

  useEffect(() => {
    window.__testMsg = (name="TestUser",text="Salut !",asSub=false) =>
      setIrcMessages(prev=>[...prev,{id:`test-${Date.now()}`,displayName:name,color:"#FF4500",badges:asSub?"subscriber/0":"",text,subMonths:asSub?"3":null,ts:Date.now()}].slice(-150));
    return ()=>{ delete window.__testMsg; };
  }, []);

  return { subMonths, ircMessages, connected, sendIRC, parseBadges };
}

// ── STREAM STATUS ──────────────────────────────────────────────────────────
function useStreamStatus(token) {
  const [status, setStatus] = useState({ isLive:null, viewerCount:0 });
  useEffect(() => {
    if (!token) return;
    const check = () => twitchGet("/streams",token,{user_login:BROADCASTER})
      .then(d=>{ const s=d.data?.[0]; setStatus({isLive:!!s,viewerCount:s?.viewer_count??0}); })
      .catch(()=>setStatus({isLive:false,viewerCount:0}));
    check();
    const id=setInterval(check,60000);
    return ()=>clearInterval(id);
  }, [token]);
  return status;
}

// ── ANIMATED COUNTER ───────────────────────────────────────────────────────
function useCountUp(target, enabled=true, duration=1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled||target===null||target===undefined) return;
    let frame;
    const start=performance.now();
    const tick=(now)=>{
      const t=Math.min((now-start)/duration,1);
      const eased=1-(1-t)**3;
      setCount(Math.round(eased*target));
      if(t<1) frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(frame);
  }, [target, enabled]);
  return count;
}

// ── SCROLL REVEAL ──────────────────────────────────────────────────────────
function useReveal(threshold=0.15) {
  const ref=useRef(null);
  const [visible,setVisible]=useState(false);
  useEffect(()=>{
    const el=ref.current; if(!el) return;
    const obs=new IntersectionObserver(([e])=>{ if(e.isIntersecting){setVisible(true);obs.disconnect();} },{threshold});
    obs.observe(el);
    return ()=>obs.disconnect();
  },[]);
  return [ref,visible];
}

// ── BANNER SYSTEM ──────────────────────────────────────────────────────────
function formatSubDuration(months) {
  if(!months) return null;
  if(months<12) return `${months} mois`;
  const y=Math.floor(months/12),m=months%12;
  if(m===0) return y===1?"1 an":`${y} ans`;
  return `${y} an${y>1?"s":""} et ${m} mois`;
}
function getBannerTier(subMonths,isSub) {
  if(!isSub||subMonths===null) return 0;
  if(subMonths<3) return 1; if(subMonths<6) return 2; if(subMonths<12) return 3; return 4;
}
const RANKS=[{name:"Bronze",stars:1},{name:"Silver",stars:2},{name:"Gold",stars:3},{name:"Platinum",stars:4},{name:"Diamond",stars:5}];
const bannerStyles=[
  {bg:"linear-gradient(135deg,#6B3A1F 0%,#C8956C 45%,#7B4A2F 100%)",border:"2px solid #A06030",shadow:"0 0 10px #5A3010aa,inset 0 1px 0 rgba(255,200,130,0.25)",textColor:"#FFE0A0",textShadow:"1px 2px 6px #3a2010,0 0 10px rgba(200,120,40,0.4)",starColor:"#FFD700",starGlow:"rgba(200,140,60,0.6)",shimmer:false,subColor:"#FFD070"},
  {bg:"linear-gradient(135deg,#6A7D8E 0%,#BDD0E0 45%,#7A8D9E 100%)",border:"2px solid #8AAABB",shadow:"0 0 14px rgba(160,200,230,0.3),inset 0 1px 0 rgba(255,255,255,0.3)",textColor:"#E8F4FF",textShadow:"1px 2px 4px #304050,0 0 12px rgba(150,200,255,0.5)",starColor:"#C8E0F8",starGlow:"rgba(150,200,240,0.6)",shimmer:false,subColor:"#A8D0F0"},
  {bg:"linear-gradient(135deg,#A07010 0%,#FFD700 40%,#FFA800 70%,#A07010 100%)",border:"2px solid #FFD700",shadow:"0 0 22px rgba(255,200,0,0.5),inset 0 1px 0 rgba(255,255,200,0.4)",textColor:"#FFF8DC",textShadow:"1px 2px 4px #6B4400,0 0 14px rgba(255,210,0,0.7)",starColor:"#FFFACD",starGlow:"rgba(255,210,0,0.7)",shimmer:false,subColor:"#FFE080"},
  {bg:"linear-gradient(135deg,#5A3A8C 0%,#C0A0F0 35%,#8060C0 65%,#6040A0 100%)",border:"2px solid #A080E0",shadow:"0 0 22px rgba(170,120,255,0.45),inset 0 1px 0 rgba(220,180,255,0.35)",textColor:"#F0E8FF",textShadow:"1px 2px 4px #3A2060,0 0 16px rgba(180,130,255,0.7)",starColor:"#DCC8FF",starGlow:"rgba(180,130,255,0.7)",shimmer:false,subColor:"#D0B0FF"},
  {bg:"linear-gradient(135deg,#050D1A 0%,#0E2550 35%,#081830 65%,#020810 100%)",border:"2px solid #3A9AFF",shadow:"0 0 28px rgba(50,150,255,0.65),0 0 55px rgba(50,150,255,0.2),inset 0 1px 0 rgba(100,180,255,0.2)",textColor:"#70D8FF",textShadow:"0 0 12px #38B0FF,0 0 24px #0070FF,1px 2px 6px #000",starColor:"#50D0FF",starGlow:"rgba(50,160,255,0.8)",shimmer:true,subColor:"#60C8FF"},
];

function NameBanner({username,tier=0,size="md",subDuration=null}) {
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

function MiniUserBanner({name,color,subMonths}) {
  const tier=getBannerTier(subMonths,true),s=bannerStyles[tier];
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
  Logout: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>,
  Clock:  ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>,
};

function TwitchSVG() {
  return <svg width="18" height="18" viewBox="0 0 24 28" fill="white"><path d="M2.149 0L0 6.229v19.264h6.857V28l3.429-2.507h4.571L24 19.029V0H2.149zm19.429 17.657l-3.428 2.507H13.5l-3.429 2.507v-2.507H4.571V2.507H21.578v15.15zm-3.428-9.921v7.171h-2.286v-7.17h2.286zm-5.714 0v7.171H10.15v-7.17h2.286z"/></svg>;
}

function RaccoonIcon({size=36}) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
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

function RaccoonMascot({size=220,style}) {
  return (
    <svg width={size} height={size*(260/220)} viewBox="0 0 220 260" fill="none" style={style}>
      <defs><radialGradient id="raccBg" cx="50%" cy="60%" r="50%"><stop offset="0%" stopColor="#9146ff" stopOpacity="0.2"/><stop offset="100%" stopColor="#9146ff" stopOpacity="0"/></radialGradient></defs>
      <ellipse cx="110" cy="160" rx="96" ry="82" fill="url(#raccBg)"/>
      <g transform="translate(176,226) rotate(-28)"><ellipse cx="0" cy="0" rx="12" ry="34" fill="#7d7c84"/><ellipse cx="0" cy="-12" rx="9" ry="8" fill="#c4c2cc"/><ellipse cx="0" cy="4" rx="9" ry="7" fill="#c4c2cc"/><ellipse cx="0" cy="18" rx="8" ry="7" fill="#c4c2cc"/><ellipse cx="0" cy="0" rx="12" ry="34" fill="none" stroke="#1c1828" strokeWidth="2"/></g>
      <ellipse cx="110" cy="218" rx="54" ry="38" fill="#7d7c84" stroke="#1c1828" strokeWidth="2.5"/>
      <ellipse cx="110" cy="218" rx="35" ry="25" fill="#c4c2cc"/>
      <ellipse cx="62" cy="67" rx="23" ry="27" fill="#7d7c84" stroke="#1c1828" strokeWidth="2.5"/>
      <ellipse cx="62" cy="70" rx="13" ry="17" fill="#f8bcc0"/>
      <ellipse cx="158" cy="67" rx="23" ry="27" fill="#7d7c84" stroke="#1c1828" strokeWidth="2.5"/>
      <ellipse cx="158" cy="70" rx="13" ry="17" fill="#f8bcc0"/>
      <circle cx="110" cy="118" r="60" fill="#7d7c84" stroke="#1c1828" strokeWidth="2.5"/>
      <ellipse cx="110" cy="131" rx="42" ry="30" fill="#c4c2cc"/>
      <ellipse cx="84" cy="109" rx="22" ry="16" fill="#1c1828" transform="rotate(-7 84 109)"/>
      <ellipse cx="136" cy="109" rx="22" ry="16" fill="#1c1828" transform="rotate(7 136 109)"/>
      <circle cx="84" cy="109" r="12.5" fill="#f8f8ff"/>
      <circle cx="136" cy="109" r="12.5" fill="#f8f8ff"/>
      <circle cx="86" cy="110" r="8" fill="#1c1828"/>
      <circle cx="138" cy="110" r="8" fill="#1c1828"/>
      <circle cx="89" cy="106" r="2.8" fill="white"/>
      <circle cx="141" cy="106" r="2.8" fill="white"/>
      <ellipse cx="110" cy="131" rx="8" ry="6" fill="#1c1828"/>
      <path d="M 97 143 Q 110 157 123 143" stroke="#1c1828" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M 63 198 Q 50 178 50 163" stroke="#7d7c84" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <circle cx="50" cy="161" r="10" fill="#7d7c84" stroke="#1c1828" strokeWidth="2"/>
      <path d="M 157 196 Q 184 168 190 142" stroke="#7d7c84" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <circle cx="190" cy="140" r="12" fill="#7d7c84" stroke="#1c1828" strokeWidth="2"/>
      <ellipse cx="95" cy="84" rx="10" ry="6" fill="rgba(255,255,255,0.13)" transform="rotate(-25 95 84)"/>
      <g transform="translate(200,74)"><path d="M0,-7 L1.3,-1.3 L7,0 L1.3,1.3 L0,7 L-1.3,1.3 L-7,0 L-1.3,-1.3 Z" fill="#ff6b9d" opacity="0.85"/></g>
      <g transform="translate(26,88)"><path d="M0,-5 L0.9,-0.9 L5,0 L0.9,0.9 L0,5 L-0.9,0.9 L-5,0 L-0.9,-0.9 Z" fill="#bf7fff" opacity="0.7"/></g>
      <g transform="translate(202,116)"><path d="M0,-4 L0.7,-0.7 L4,0 L0.7,0.7 L0,4 L-0.7,0.7 L-4,0 L-0.7,-0.7 Z" fill="#f5e642" opacity="0.9"/></g>
    </svg>
  );
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function LoadSpinner() {
  return <div style={{display:"flex",justifyContent:"center",padding:48}}><div style={{width:34,height:34,borderRadius:"50%",border:"3px solid rgba(145,70,255,0.15)",borderTopColor:"#9146ff",animation:"spin 0.75s linear infinite"}}/></div>;
}
function NavBtn({onClick,children}) { return <button onClick={onClick} className="btn btn-ghost btn-sm">{children}</button>; }
function Badge({color,children}) {
  return <span style={{background:`${color}18`,border:`1px solid ${color}44`,color,borderRadius:6,padding:"2px 8px",fontSize:"0.68rem",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>{children}</span>;
}

// ── AURORA BACKGROUND ──────────────────────────────────────────────────────
function AuroraBackground() {
  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",width:"70%",height:"70%",top:"-20%",left:"-10%",background:"radial-gradient(circle,rgba(145,70,255,0.38) 0%,transparent 65%)",filter:"blur(90px)",animation:"aurora1 14s ease-in-out infinite"}}/>
      <div style={{position:"absolute",width:"60%",height:"60%",top:"5%",right:"-15%",background:"radial-gradient(circle,rgba(255,107,157,0.28) 0%,transparent 65%)",filter:"blur(80px)",animation:"aurora2 18s ease-in-out infinite"}}/>
      <div style={{position:"absolute",width:"50%",height:"50%",bottom:"-5%",left:"30%",background:"radial-gradient(circle,rgba(245,230,66,0.14) 0%,transparent 65%)",filter:"blur(70px)",animation:"aurora3 22s ease-in-out infinite"}}/>
      {/* noise overlay */}
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.045}} aria-hidden="true">
        <filter id="noiseF"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
        <rect width="100%" height="100%" filter="url(#noiseF)"/>
      </svg>
    </div>
  );
}

// ── LIVE BADGE ─────────────────────────────────────────────────────────────
function LiveBadge({isLive,viewerCount}) {
  if (isLive===null) return null;
  if (isLive) return (
    <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(239,68,68,0.14)",border:"1px solid rgba(239,68,68,0.42)",borderRadius:99,padding:"7px 18px"}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"livePulse 1.4s ease-in-out infinite"}}/>
      <span style={{fontFamily:"var(--font-display)",fontSize:"0.9rem",color:"#ef4444",letterSpacing:"0.1em"}}>EN LIVE</span>
      {viewerCount>0&&<span style={{fontSize:"0.75rem",color:"rgba(239,68,68,0.75)",fontFamily:"var(--font-body)",fontWeight:500}}>· {viewerCount.toLocaleString("fr-FR")} viewers</span>}
    </div>
  );
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(145,70,255,0.12)",border:"1px solid rgba(145,70,255,0.3)",borderRadius:99,padding:"7px 18px"}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:"var(--color-brand)",opacity:0.7}}/>
      <span style={{fontFamily:"var(--font-body)",fontSize:"0.82rem",color:"var(--color-brand-light)",fontWeight:500}}>Hors ligne — voir le planning</span>
    </div>
  );
}

// ── HERO SECTION ───────────────────────────────────────────────────────────
function HeroSection({isLive,viewerCount}) {
  return (
    <section style={{
      position:"relative",overflow:"hidden",
      /* extend full-width past app-main padding */
      width:"calc(100% + 56px)",marginLeft:-28,marginTop:-96,
      padding:"160px 28px 100px",
      minHeight:"90vh",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      textAlign:"center",
    }}>
      <AuroraBackground/>
      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:28,animation:"fadeInUp 0.8s ease both"}}>
        <LiveBadge isLive={isLive} viewerCount={viewerCount}/>
        <h1 style={{
          fontFamily:"var(--font-display)",
          fontSize:"clamp(5.5rem,16vw,13rem)",
          lineHeight:0.88,letterSpacing:"0.02em",
          background:"linear-gradient(135deg,#9146ff 0%,#ff6b9d 55%,#f5e642 100%)",
          backgroundSize:"200% 200%",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
          animation:"gradientShift 5s ease-in-out infinite",
        }}>DAEMS</h1>
        <p style={{fontFamily:"var(--font-body)",fontSize:"1.1rem",color:"var(--text-secondary)",maxWidth:480,lineHeight:1.65,fontWeight:400}}>
          Streamer Twitch FR — League of Legends · Valorant · Collabs · Just Chatting
        </p>
        <div style={{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center",marginTop:4}}>
          <a href={`https://www.twitch.tv/${BROADCASTER}`} target="_blank" rel="noreferrer" className="btn btn-twitch">
            <TwitchSVG/> Rejoindre sur Twitch
          </a>
          <a href={`https://www.twitch.tv/subs/${BROADCASTER}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{padding:"13px 32px",fontSize:"0.95rem"}}>
            S'abonner
          </a>
        </div>
      </div>
      {/* scroll indicator */}
      <div style={{position:"absolute",bottom:36,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:6,opacity:0.35,animation:"scrollBounce 2s ease-in-out infinite"}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-muted)"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </section>
  );
}

// ── OFFLINE CARD ───────────────────────────────────────────────────────────
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

function OfflineCard() {
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

// ── CHAT ───────────────────────────────────────────────────────────────────
function TwitchChat({ircMessages,connected,sendIRC,parseBadges,userInfo}) {
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

// ── ACTIVITY TICKER ────────────────────────────────────────────────────────
function ActivityTicker({token}) {
  const [items,setItems]=useState([]);
  useEffect(()=>{
    if(!token) return;
    fetch(`${window.location.origin}/api/recent-activity`).then(r=>r.json()).then(d=>{const l=d.data||[];if(l.length>0)setItems([...l,...l]);}).catch(()=>{});
  },[token]);
  if(items.length===0) return null;
  const typeClass=(type)=>type==="sub"?"ticker-item-sub":type==="subgift"?"ticker-item-gift":"ticker-item-cheer";
  return (
    <div style={{position:"relative",overflow:"hidden",background:"rgba(145,70,255,0.05)",border:"1px solid rgba(145,70,255,0.13)",borderRadius:14,padding:"11px 0",margin:"0 0 24px"}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:80,background:"linear-gradient(to right,var(--bg-base),transparent)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:80,background:"linear-gradient(to left,var(--bg-base),transparent)",zIndex:2,pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,padding:"0 20px"}}>
        <span style={{fontFamily:"var(--font-body)",fontSize:"0.72rem",color:"var(--text-muted)",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>Activité récente</span>
        <div style={{flex:1,height:1,background:"rgba(145,70,255,0.14)"}}/>
      </div>
      <div style={{display:"flex",gap:10,padding:"2px 20px",animation:"ticker 90s linear infinite",width:"max-content"}}>
        {items.map((item,i)=>(
          <div key={i} className={typeClass(item.type)}
            style={{display:"flex",alignItems:"center",gap:8,background:"rgba(145,70,255,0.1)",border:"1px solid rgba(145,70,255,0.22)",borderRadius:20,padding:"5px 14px",whiteSpace:"nowrap",flexShrink:0}}>
            <span style={{fontSize:"0.82rem"}}>{item.icon}</span>
            <span style={{color:"var(--text-primary)",fontWeight:700,fontSize:"0.8rem"}}>{item.name}</span>
            <span style={{color:"var(--text-muted)",fontSize:"0.7rem"}}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BENTO STATS ────────────────────────────────────────────────────────────
function BentoStats({stats}) {
  const [ref,visible]=useReveal(0.18);
  const followCount=useCountUp(stats.followers,visible&&stats.followers!==null);
  const subCount=useCountUp(stats.subs,visible&&stats.subs!==null);
  const goalPct=stats.followers!==null?Math.min(100,(stats.followers/GOAL_FOLLOWERS)*100):0;
  const subPct=stats.subs!==null?Math.min(100,(stats.subs/GOAL_SUBS)*100):0;

  const reveal={opacity:visible?1:0,transform:visible?"none":"translateY(32px)",transition:"opacity 0.7s ease,transform 0.7s ease"};

  return (
    <section ref={ref} style={{padding:"72px 0",...reveal}}>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"0.05em",color:"var(--text-primary)",marginBottom:36,textAlign:"center"}}>LA COMMUNAUTÉ</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:18}}>
        {/* Followers — wide card */}
        <div style={{background:"linear-gradient(135deg,rgba(145,70,255,0.13),rgba(145,70,255,0.04))",border:"1px solid rgba(145,70,255,0.26)",borderRadius:"24px 8px 24px 8px",padding:"32px 28px",gridColumn:"span 2",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-50,right:-50,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(145,70,255,0.16),transparent)",pointerEvents:"none"}}/>
          <span style={{fontFamily:"var(--font-body)",fontSize:"0.72rem",color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.16em",fontWeight:600}}>Followers</span>
          <div style={{fontFamily:"var(--font-display)",fontSize:"clamp(3rem,7vw,5rem)",color:"var(--text-primary)",letterSpacing:"0.03em",lineHeight:1,marginTop:6}}>
            {stats.followers!==null?followCount.toLocaleString("fr-FR"):"—"}
          </div>
          <div style={{marginTop:18}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
              <span style={{fontSize:"0.7rem",color:"var(--text-muted)"}}>Objectif {GOAL_FOLLOWERS}</span>
              <span style={{fontSize:"0.7rem",color:"var(--color-brand-light)",fontWeight:700}}>{Math.round(goalPct)}%</span>
            </div>
            <div style={{height:7,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
              <div style={{width:`${goalPct}%`,height:"100%",background:"linear-gradient(90deg,#9146ff,#ff6b9d)",borderRadius:99,boxShadow:"0 0 14px rgba(145,70,255,0.55)",transition:"width 1.6s cubic-bezier(.4,0,.2,1)"}}/>
            </div>
          </div>
        </div>

        {/* Subs */}
        <div style={{background:"linear-gradient(135deg,rgba(255,107,157,0.12),rgba(255,107,157,0.04))",border:"1px solid rgba(255,107,157,0.26)",borderRadius:"8px 24px 8px 24px",padding:"32px 28px"}}>
          <span style={{fontFamily:"var(--font-body)",fontSize:"0.72rem",color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.16em",fontWeight:600}}>Abonnés</span>
          <div style={{fontFamily:"var(--font-display)",fontSize:"clamp(3rem,7vw,5rem)",color:"var(--text-primary)",letterSpacing:"0.03em",lineHeight:1,marginTop:6}}>
            {stats.subs!==null?subCount.toLocaleString("fr-FR"):"—"}
          </div>
          <div style={{marginTop:18}}>
            <div style={{height:7,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden",marginBottom:7}}>
              <div style={{width:`${subPct}%`,height:"100%",background:"linear-gradient(90deg,#ff6b9d,#f5e642)",borderRadius:99,boxShadow:"0 0 14px rgba(255,107,157,0.45)",transition:"width 1.6s cubic-bezier(.4,0,.2,1)"}}/>
            </div>
            <span style={{fontSize:"0.7rem",color:"rgba(255,107,157,0.7)",fontWeight:500}}>Objectif {GOAL_SUBS} · {Math.round(subPct)}%</span>
          </div>
        </div>

        {/* Statut */}
        <div style={{background:"linear-gradient(135deg,rgba(245,230,66,0.08),rgba(245,230,66,0.02))",border:"1px solid rgba(245,230,66,0.18)",borderRadius:18,padding:"32px 28px",display:"flex",flexDirection:"column",justifyContent:"space-between",gap:16}}>
          <span style={{fontFamily:"var(--font-body)",fontSize:"0.72rem",color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.16em",fontWeight:600}}>Statut</span>
          <div>
            <div style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",color:"#f5e642",letterSpacing:"0.06em"}}>AFFILIÉ</div>
            <div style={{fontSize:"0.72rem",color:"var(--text-muted)",marginTop:3}}>Twitch Affiliate</div>
          </div>
          <div style={{width:42,height:42,borderRadius:12,background:"rgba(245,230,66,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#f5e642"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── PLANNING SECTION ───────────────────────────────────────────────────────
function PlanningSection() {
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

// ── ROADMAP ────────────────────────────────────────────────────────────────
function RoadmapSection() {
  const [ref,visible]=useReveal(0.1);
  const scrollRef=useRef(null);
  const dragging=useRef(false);
  const startX=useRef(0);
  const scrollLeft=useRef(0);

  const onMouseDown=(e)=>{dragging.current=true;startX.current=e.pageX-scrollRef.current.offsetLeft;scrollLeft.current=scrollRef.current.scrollLeft;};
  const onMouseMove=(e)=>{if(!dragging.current)return;e.preventDefault();const x=e.pageX-scrollRef.current.offsetLeft;scrollRef.current.scrollLeft=scrollLeft.current-(x-startX.current);};
  const onMouseUp=()=>{dragging.current=false;};

  return (
    <section ref={ref} style={{padding:"72px 0",opacity:visible?1:0,transform:visible?"none":"translateY(32px)",transition:"opacity 0.7s ease 0.2s,transform 0.7s ease 0.2s"}}>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"0.05em",color:"var(--text-primary)",marginBottom:12}}>LA ROADMAP</h2>
      <p style={{color:"var(--text-muted)",fontSize:"0.85rem",marginBottom:36,fontFamily:"var(--font-body)"}}>Le chemin parcouru et les prochains paliers — fais glisser pour explorer.</p>
      <div ref={scrollRef} className="roadmap-scroll" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
        <div style={{display:"flex",alignItems:"center",padding:"48px 24px",minWidth:"max-content",gap:0}}>
          {MILESTONES.map((m,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,width:140}}>
                {/* node */}
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
              {/* connector */}
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

// ── ABOUT ──────────────────────────────────────────────────────────────────
function AboutSection() {
  const [ref,visible]=useReveal(0.15);
  return (
    <section ref={ref} style={{padding:"72px 0 96px",display:"grid",gridTemplateColumns:"1fr auto",gap:56,alignItems:"center",opacity:visible?1:0,transform:visible?"none":"translateY(32px)",transition:"opacity 0.7s ease 0.15s,transform 0.7s ease 0.15s"}}>
      <div>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"clamp(2rem,5vw,3.5rem)",letterSpacing:"0.05em",color:"var(--text-primary)",marginBottom:24}}>QUI EST DAEMS ?</h2>
        <p style={{fontFamily:"var(--font-body)",fontSize:"1.05rem",color:"var(--text-secondary)",lineHeight:1.82,maxWidth:520}}>
          Daems_, c'est un streamer FR passionné qui mélange gaming compétitif, moments détente et collabs communautaires. De League of Legends à Valorant en passant par les Just Chatting en famille — chaque stream est une nouvelle aventure avec la meute du raton couronné.
        </p>
        <div style={{display:"flex",gap:12,marginTop:28,flexWrap:"wrap"}}>
          <a href={`https://www.twitch.tv/${BROADCASTER}`} target="_blank" rel="noreferrer" className="btn btn-twitch"><TwitchSVG/> Suivre sur Twitch</a>
        </div>
      </div>
      <div style={{animation:"raccoonFloat 5s ease-in-out infinite",filter:"drop-shadow(0 24px 48px rgba(145,70,255,0.32))"}}>
        <RaccoonMascot size={220}/>
      </div>
    </section>
  );
}

// ── CLIPS ──────────────────────────────────────────────────────────────────
function ClipsPage({token}) {
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

function ClipCard({clip}) {
  return (
    <a href={clip.url} target="_blank" rel="noreferrer" className="clip-card">
      <div style={{position:"relative"}}>
        <img src={clip.thumbnail_url} alt={clip.title} style={{width:"100%",aspectRatio:"16/9",objectFit:"cover",display:"block"}}/>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.2)"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(145,70,255,0.88)",borderRadius:"50%",width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px rgba(145,70,255,0.6)"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.72)",borderRadius:6,padding:"3px 8px",display:"flex",alignItems:"center",gap:5}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--color-brand-light)"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
          <span style={{color:"var(--color-brand-light)",fontWeight:700,fontSize:"0.72rem"}}>{clip.view_count?.toLocaleString("fr-FR")}</span>
        </div>
      </div>
      <div style={{padding:"12px 14px"}}>
        <div style={{color:"var(--text-primary)",fontWeight:600,fontSize:"0.87rem",lineHeight:1.35,marginBottom:8,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{clip.title}</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.7rem",color:"var(--text-muted)"}}>
          <span>{clip.creator_name}</span>
          <span>{new Date(clip.created_at).toLocaleDateString("fr-FR")}</span>
        </div>
      </div>
    </a>
  );
}

// ── SHOP ───────────────────────────────────────────────────────────────────
function ShopPage() {
  const [email,setEmail]=useState("");
  const [submitted,setSubmitted]=useState(false);
  const [ref,visible]=useReveal(0.1);

  const MYSTERY=[
    {label:"T-Shirt Raton",   tease:"Coton premium"},
    {label:"Hoodie DAEMS",    tease:"Édition limitée"},
    {label:"Poster Signé",    tease:"Art exclusif"},
  ];

  return (
    <div ref={ref} style={{opacity:visible?1:0,transform:visible?"none":"translateY(22px)",transition:"opacity 0.6s ease,transform 0.6s ease"}}>
      {/* Hero */}
      <div style={{textAlign:"center",padding:"72px 40px",position:"relative",overflow:"hidden",borderRadius:"24px 8px 24px 8px",background:"linear-gradient(135deg,rgba(145,70,255,0.08),rgba(255,107,157,0.06))",border:"1px solid rgba(145,70,255,0.2)",marginBottom:56}}>
        <div style={{position:"absolute",top:-80,left:"20%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(145,70,255,0.18),transparent)",filter:"blur(70px)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-60,right:"10%",width:320,height:320,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,107,157,0.14),transparent)",filter:"blur(60px)",pointerEvents:"none"}}/>
        {/* noise */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.04,pointerEvents:"none"}} aria-hidden="true">
          <filter id="noiseS"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
          <rect width="100%" height="100%" filter="url(#noiseS)"/>
        </svg>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{animation:"raccoonFloat 4s ease-in-out infinite",display:"inline-block",marginBottom:24}}>
            <img src="/logo-round.png" alt="daems_" style={{width:120,height:120,objectFit:"contain"}}/>
          </div>
          <h1 style={{fontFamily:"var(--font-display)",fontSize:"clamp(2.5rem,7vw,5rem)",letterSpacing:"0.04em",color:"var(--text-primary)",marginBottom:14}}>LA BOUTIQUE DU RATON</h1>
          <p style={{fontFamily:"var(--font-body)",fontSize:"1.05rem",color:"var(--text-secondary)",marginBottom:36,maxWidth:420,margin:"0 auto 36px"}}>Des merches exclusifs en préparation — le raton est aux fourneaux.</p>
          {!submitted?(
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",maxWidth:480,margin:"0 auto"}}>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&email.includes("@")&&setSubmitted(true)}
                placeholder="ton@email.com" className="shop-email-input"/>
              <button onClick={()=>email.includes("@")&&setSubmitted(true)} className="btn btn-twitch" style={{whiteSpace:"nowrap",padding:"12px 24px"}}>
                Préviens-moi au lancement
              </button>
            </div>
          ):(
            <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:99,padding:"12px 24px"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#10b981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              <span style={{color:"#10b981",fontWeight:700,fontSize:"0.9rem",fontFamily:"var(--font-body)"}}>Parfait ! On te préviendra au lancement.</span>
            </div>
          )}
        </div>
      </div>

      {/* Mystery products */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
        {MYSTERY.map((item,i)=>(
          <div key={i} style={{borderRadius:"20px 6px 20px 6px",background:"rgba(145,70,255,0.04)",border:"1px solid rgba(145,70,255,0.13)",padding:"48px 24px",display:"flex",flexDirection:"column",alignItems:"center",gap:18,position:"relative",overflow:"hidden"}}>
            {/* blurred silhouette */}
            <div style={{width:110,height:110,borderRadius:20,background:`linear-gradient(135deg,rgba(145,70,255,${0.15+i*0.05}),rgba(255,107,157,${0.1+i*0.03}))`,filter:"blur(14px)",boxShadow:"0 8px 32px rgba(145,70,255,0.18)"}}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",letterSpacing:"0.06em",color:"rgba(145,70,255,0.45)"}}>{item.label}</div>
              <div style={{fontSize:"0.72rem",color:"var(--text-muted)",marginTop:4,fontFamily:"var(--font-body)"}}>{item.tease}</div>
            </div>
            <div style={{background:"rgba(145,70,255,0.12)",border:"1px solid rgba(145,70,255,0.22)",color:"rgba(145,70,255,0.6)",borderRadius:99,padding:"4px 14px",fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.12em"}}>BIENTÔT</div>
            {/* glassmorphism overlay */}
            <div style={{position:"absolute",inset:0,backdropFilter:"blur(2px)",background:"rgba(10,0,16,0.08)",pointerEvents:"none"}}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AVATAR MENU ────────────────────────────────────────────────────────────
function AvatarMenu({userInfo,isFollower,isSub,subMonths,onLogout}) {
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    const h=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:8}}>
        <img src={userInfo.profile_image_url} alt="" style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${open?"#9146ff":"rgba(145,70,255,0.4)"}`,transition:"border-color 0.2s",boxShadow:open?"0 0 14px rgba(145,70,255,0.5)":"none"}}/>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--text-muted)" style={{transform:open?"rotate(180deg)":"",transition:"transform 0.2s"}}><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      {open&&(
        <div className="avatar-dropdown">
          <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(145,70,255,0.14)",background:"rgba(145,70,255,0.07)"}}>
            <div style={{fontFamily:"var(--font-body)",color:"var(--text-primary)",fontWeight:700,fontSize:"0.95rem"}}>{userInfo.display_name}</div>
            <div style={{display:"flex",gap:5,marginTop:7}}>
              {isFollower&&<Badge color="#ef4444"><Icon.Heart/>Follow</Badge>}
              {isSub&&<Badge color="#9146ff"><Icon.Star/>Sub {subMonths?`· ${subMonths}m`:""}</Badge>}
            </div>
          </div>
          <div style={{padding:"6px 0"}}>
            <a href={`https://www.twitch.tv/${userInfo.login}`} target="_blank" rel="noreferrer" className="avatar-menu-link">
              <TwitchSVG/> Voir mon profil Twitch
            </a>
            <div style={{height:1,background:"rgba(145,70,255,0.1)",margin:"4px 0"}}/>
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
      <div className="login-glow-1"/><div className="login-glow-2"/>
      <div className="login-inner">
        <div className="login-text">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <RaccoonIcon size={36}/>
            <span style={{fontFamily:"var(--font-display)",fontSize:"2rem",letterSpacing:"0.06em",color:"var(--text-primary)"}}>
              DAEMS<span style={{color:"var(--color-accent)",animation:"underscoreBlink 2s ease-in-out infinite",display:"inline-block"}}>_</span>
            </span>
          </div>
          <h1 className="login-title">Le QG officiel<br/>de la <span className="acc">communauté</span></h1>
          <p className="login-subtitle">Rejoins la meute, suis le stream en direct, débloque ta bannière exclusive et accède à tous les contenus réservés à la communauté.</p>
          <div className="login-features">
            {["Bannière de fidélité selon tes mois d'abonnement","Chat live intégré directement sur le site","Clips et meilleurs moments de daems_","Boutique exclusive — bientôt disponible"].map((f,i)=>(
              <div key={i} className="login-feature"><div className="login-feature-dot"/>{f}</div>
            ))}
          </div>
          <button onClick={onLogin} className="btn btn-twitch"><TwitchSVG/> Se connecter avec Twitch</button>
          <p className="login-disclaimer">Site fan non affilié à Twitch Inc.</p>
        </div>
        <div className="login-mascot">
          <div className="login-mascot-glow"/>
          <RaccoonMascot size={300} style={{animation:"raccoonFloat 4s ease-in-out infinite",filter:"drop-shadow(0 22px 28px rgba(145,70,255,0.32))"}}/>
        </div>
      </div>
    </div>
  );
}

// ── HOME PAGE ──────────────────────────────────────────────────────────────
function HomePage({token,userInfo,ircMessages,connected,sendIRC,parseBadges,isLive,viewerCount,stats}) {
  return (
    <div>
      <HeroSection isLive={isLive} viewerCount={viewerCount}/>

      {/* Stream + Chat */}
      <div style={{padding:"48px 0 32px"}}>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"clamp(1.8rem,4vw,2.8rem)",letterSpacing:"0.05em",color:"var(--text-primary)",marginBottom:24}}>LE STREAM</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16,minHeight:460}}>
          <div style={{borderRadius:16,overflow:"hidden",border:"1px solid rgba(145,70,255,0.26)",boxShadow:"0 0 40px rgba(145,70,255,0.1)"}}>
            {isLive===false?(
              <OfflineCard/>
            ):(
              <iframe src={`https://player.twitch.tv/?channel=${BROADCASTER}&parent=${window.location.hostname}&autoplay=false`}
                height="100%" width="100%" style={{display:"block",minHeight:420,border:"none"}} allowFullScreen/>
            )}
          </div>
          <TwitchChat ircMessages={ircMessages} connected={connected} sendIRC={sendIRC} parseBadges={parseBadges} userInfo={userInfo}/>
        </div>
      </div>

      <ActivityTicker token={token}/>
      <BentoStats stats={stats}/>
      <PlanningSection/>
      <RoadmapSection/>
      <AboutSection/>
    </div>
  );
}

// ── TABS ───────────────────────────────────────────────────────────────────
const TABS = [
  {id:"home",  label:"Accueil",  IC:Icon.Home},
  {id:"clips", label:"Clips",    IC:Icon.Clips},
  {id:"shop",  label:"Boutique", IC:Icon.Shop},
];

// ── MAIN ───────────────────────────────────────────────────────────────────
export default function App() {
  const [token,setToken]         = useState(()=>localStorage.getItem("tw_token"));
  const [userInfo,setUserInfo]   = useState(null);
  const [isFollower,setIsFollower] = useState(false);
  const [isSub,setIsSub]         = useState(false);
  const [tab,setTab]             = useState("home");
  const [booting,setBooting]     = useState(true);
  const [stats,setStats]         = useState({followers:null,subs:null});

  const {subMonths,ircMessages,connected,sendIRC,parseBadges} = useIRC(token, userInfo?.login);
  const {isLive,viewerCount} = useStreamStatus(token);
  const subDuration = isSub ? formatSubDuration(subMonths) : null;
  const bannerTier  = getBannerTier(subMonths, isSub);

  useEffect(()=>{
    window.__forceUnsub=()=>setIsSub(false);
    window.__resetSub=()=>setIsSub(true);
    return ()=>{ delete window.__forceUnsub; delete window.__resetSub; };
  },[]);

  const login=()=>{
    window.location.href=`https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&force_verify=false`;
  };
  const logout=()=>{
    localStorage.removeItem("tw_token");
    setToken(null);setUserInfo(null);setIsFollower(false);setIsSub(false);
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
        if(!u) throw new Error("no user");
        setUserInfo(u);
        try{const f=await twitchGet("/channels/followed",token,{user_id:u.id,broadcaster_id:BROADCASTER_ID});setIsFollower((f.data?.length??0)>0);}catch{setIsFollower(false);}
        try{const s=await twitchGet("/subscriptions/user",token,{broadcaster_id:BROADCASTER_ID,user_id:u.id});setIsSub(Array.isArray(s.data)&&s.data.length>0);}catch{setIsSub(false);}
      })
      .catch(()=>{localStorage.removeItem("tw_token");setToken(null);})
      .finally(()=>setBooting(false));
  },[token]);

  useEffect(()=>{
    if(!token) return;
    Promise.all([
      twitchGet("/channels/followers",token,{broadcaster_id:BROADCASTER_ID,first:1}),
      fetch(`${window.location.origin}/api/sub-count`).then(r=>r.ok?r.json():{total:null}).catch(()=>({total:null})),
    ]).then(([f,s])=>setStats({followers:f.total??null,subs:s.total??null})).catch(()=>{});
  },[token]);

  useEffect(()=>{
    if(!token||!userInfo||subMonths===null) return;
    fetch(`${window.location.origin}/api/store-viewer`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,user_id:userInfo.id,display_name:userInfo.display_name,sub_months:subMonths,is_sub:isSub})}).catch(()=>{});
  },[token,userInfo?.id,subMonths,isSub]);

  if(!token) return <LoginPage onLogin={login}/>;
  if(booting) return (
    <div className="app-wrapper" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <LoadSpinner/>
    </div>
  );

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-logo">
          <img src="/logo-daems.png" alt="daems_" style={{height:220,objectFit:"contain",display:"block"}}/>
        </div>
        <nav className="app-nav">
          {TABS.map(({id,label,IC})=>(
            <button key={id} onClick={()=>setTab(id)} className={`nav-tab${tab===id?" active":""}`}>
              <IC/>{label}
            </button>
          ))}
          {tab==="home"&&(
            <button onClick={()=>document.getElementById("planning")?.scrollIntoView({behavior:"smooth"})} className="nav-tab">
              <Icon.Clock/>Planning
            </button>
          )}
        </nav>
        <div className="header-actions">
          {userInfo&&(
            <>
              <a href={`https://www.twitch.tv/${BROADCASTER}`} target="_blank" rel="noreferrer" className="btn btn-twitch btn-sm" style={{gap:6}}>
                <TwitchSVG/> Twitch
              </a>
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
        {tab==="home"  && <HomePage token={token} userInfo={userInfo} ircMessages={ircMessages} connected={connected} sendIRC={sendIRC} parseBadges={parseBadges} isLive={isLive} viewerCount={viewerCount} stats={stats}/>}
        {tab==="clips" && <ClipsPage token={token}/>}
        {tab==="shop"  && <ShopPage/>}
      </main>
    </div>
  );
}
