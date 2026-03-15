import { useEffect, useState } from "react";

export function useBreakpoint() {
    const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
    useEffect(() => {
        const handler = () => setW(window.innerWidth);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return { isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024, w };
}