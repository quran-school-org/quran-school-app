/**
 * Suit une media query (ex. « (min-width: 1024px) »). Valeur initiale lue
 * tout de suite pour éviter un premier rendu faux ; repli « faux » sans matchMedia.
 */
import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const read = () => (typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(read);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
