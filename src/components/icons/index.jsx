export const Icon = {
  Home:   ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  Clips:  ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>,
  Shop:   ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3z"/></svg>,
  Heart:  ()=><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  Star:   ()=><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  Users:  ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  Logout: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>,
  Clock:  ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>,
};

export function TwitchSVG() {
  return <svg width="18" height="18" viewBox="0 0 24 28" fill="white"><path d="M2.149 0L0 6.229v19.264h6.857V28l3.429-2.507h4.571L24 19.029V0H2.149zm19.429 17.657l-3.428 2.507H13.5l-3.429 2.507v-2.507H4.571V2.507H21.578v15.15zm-3.428-9.921v7.171h-2.286v-7.17h2.286zm-5.714 0v7.171H10.15v-7.17h2.286z"/></svg>;
}

export function RaccoonIcon({size=36}) {
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

export function RaccoonMascot({size=220,style}) {
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
