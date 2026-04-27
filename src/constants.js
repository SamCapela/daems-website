export const CLIENT_ID      = "mk16oce917g7q5i485zlyackq33ce0";
export const REDIRECT_URI   = window.location.origin;
export const BROADCASTER    = "daems_";
export const BROADCASTER_ID = "441069979";
export const GOAL_FOLLOWERS = 600;
export const GOAL_SUBS      = 50;
export const SCOPES = ["user:read:email","user:read:follows","user:read:subscriptions","chat:read","chat:edit"].join(" ");

export const SCHEDULE = [
  { day:"Lundi",    game:"League of Legends", color:"#C89B3C", type:"GAME"    },
  { day:"Mardi",    game:"Valorant",           color:"#FF4655", type:"GAME"    },
  { day:"Mercredi", game:"OFF",                color:"#3a3060", type:"OFF"     },
  { day:"Jeudi",    game:"Collab",             color:"#9146ff", type:"COLLAB"  },
  { day:"Vendredi", game:"Just Chatting",      color:"#10b981", type:"CHAT"    },
  { day:"Samedi",   game:"Marathon",           color:"#ff6b9d", type:"SPECIAL" },
  { day:"Dimanche", game:"OFF",                color:"#3a3060", type:"OFF"     },
];

export const MILESTONES = [
  { label:"10 followers",  done:true  },
  { label:"50 followers",  done:true  },
  { label:"100 followers", done:true  },
  { label:"Affiliation",   done:false, current:true, progress:596, goal:600 },
  { label:"500 followers", done:false },
  { label:"1K followers",  done:false },
  { label:"Partenaire",    done:false, dream:true   },
];

export const twitchGet = async (path, token, params = {}) => {
  const url = new URL("https://api.twitch.tv/helix" + path);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const r = await fetch(url, { headers: { Authorization:`Bearer ${token}`, "Client-Id":CLIENT_ID } });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
};
