import { useState, useEffect, useCallback, useRef } from "react";
import { BROADCASTER } from "../constants";

export function useIRC(token, username) {
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
