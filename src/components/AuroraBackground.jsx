export function AuroraBackground() {
  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",width:"70%",height:"70%",top:"-20%",left:"-10%",background:"radial-gradient(circle,rgba(145,70,255,0.38) 0%,transparent 65%)",filter:"blur(90px)",animation:"aurora1 14s ease-in-out infinite"}}/>
      <div style={{position:"absolute",width:"60%",height:"60%",top:"5%",right:"-15%",background:"radial-gradient(circle,rgba(255,107,157,0.28) 0%,transparent 65%)",filter:"blur(80px)",animation:"aurora2 18s ease-in-out infinite"}}/>
      <div style={{position:"absolute",width:"50%",height:"50%",bottom:"-5%",left:"30%",background:"radial-gradient(circle,rgba(245,230,66,0.14) 0%,transparent 65%)",filter:"blur(70px)",animation:"aurora3 22s ease-in-out infinite"}}/>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.045}} aria-hidden="true">
        <filter id="noiseF"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
        <rect width="100%" height="100%" filter="url(#noiseF)"/>
      </svg>
    </div>
  );
}
