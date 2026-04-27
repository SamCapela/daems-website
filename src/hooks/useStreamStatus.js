import { useState, useEffect } from "react";
import { BROADCASTER, twitchGet } from "../constants";

export function useStreamStatus(token) {
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
