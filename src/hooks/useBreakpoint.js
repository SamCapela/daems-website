import { useState, useEffect } from "react";

export function useBreakpoint() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return {
    isMobile:  width < 768,
    isTablet:  width >= 768 && width < 1100,
    isDesktop: width >= 1100,
  };
}
