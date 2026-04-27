import { useState, useEffect } from "react";

export function useCountUp(target, enabled=true, duration=1800) {
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
