export function LoadSpinner() {
  return <div style={{display:"flex",justifyContent:"center",padding:48}}><div style={{width:34,height:34,borderRadius:"50%",border:"3px solid rgba(145,70,255,0.15)",borderTopColor:"#9146ff",animation:"spin 0.75s linear infinite"}}/></div>;
}

export function NavBtn({onClick,children}) {
  return <button onClick={onClick} className="btn btn-ghost btn-sm">{children}</button>;
}

export function Badge({color,children}) {
  return <span style={{background:`${color}18`,border:`1px solid ${color}44`,color,borderRadius:6,padding:"2px 8px",fontSize:"0.68rem",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>{children}</span>;
}
