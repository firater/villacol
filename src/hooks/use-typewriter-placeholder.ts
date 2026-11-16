"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  phrases: readonly string[];
  enabled: boolean;
  typingMs?: number;
  deletingMs?: number;
  pauseMs?: number;
  typoChance?: number;
};

/**
 * Cycles phrases with a typewriter effect and occasional typo correction.
 */
export function useTypewriterPlaceholder({
  phrases,
  enabled,
  typingMs = 72,
  deletingMs = 44,
  pauseMs = 2600,
  typoChance = 0.22,
}: Options): string {
  const [display, setDisplay] = useState("");
  const phraseIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const deletingRef = useRef(false);
  const pauseUntilRef = useRef(0);
  const typoFixRef = useRef(false);

  useEffect(() => {
    if (!enabled || phrases.length === 0) {
      setDisplay("");
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    const pickWrongChar = (correct: string): string => {
      const alts = "aeiouáéíóúanı".split("").filter((c) => c !== correct.toLowerCase());
      return alts[Math.floor(Math.random() * alts.length)] ?? "x";
    };

    const tick = () => {
      const now = Date.now();
      if (now < pauseUntilRef.current) {
        timer = setTimeout(tick, pauseUntilRef.current - now);
        return;
      }

      const phrase = phrases[phraseIndexRef.current % phrases.length] ?? "";
      if (phrase.length === 0) return;

      if (deletingRef.current) {
        charIndexRef.current = Math.max(0, charIndexRef.current - 1);
        setDisplay(phrase.slice(0, charIndexRef.current));
        if (charIndexRef.current === 0) {
          deletingRef.current = false;
          phraseIndexRef.current += 1;
          pauseUntilRef.current = now + 400;
        }
        timer = setTimeout(tick, deletingMs);
        return;
      }

      if (typoFixRef.current) {
        typoFixRef.current = false;
        charIndexRef.current = Math.max(0, charIndexRef.current - 1);
        setDisplay(phrase.slice(0, charIndexRef.current));
        pauseUntilRef.current = now + 120;
        timer = setTimeout(tick, deletingMs);
        return;
      }

      const nextIndex = charIndexRef.current;
      if (nextIndex >= phrase.length) {
        deletingRef.current = true;
        pauseUntilRef.current = now + pauseMs;
        timer = setTimeout(tick, pauseMs);
        return;
      }

      const correctChar = phrase[nextIndex] ?? "";
      if (
        nextIndex > 2 &&
        Math.random() < typoChance &&
        /[a-zA-ZüğıöçşÜĞİÖÇŞáéíóúàè]/u.test(correctChar)
      ) {
        const wrong = pickWrongChar(correctChar);
        charIndexRef.current = nextIndex + 1;
        setDisplay(`${phrase.slice(0, nextIndex)}${wrong}`);
        typoFixRef.current = true;
        pauseUntilRef.current = now + 520;
        timer = setTimeout(tick, typingMs);
        return;
      }

      charIndexRef.current = nextIndex + 1;
      setDisplay(phrase.slice(0, charIndexRef.current));
      timer = setTimeout(tick, typingMs);
    };

    phraseIndexRef.current = 0;
    charIndexRef.current = 0;
    deletingRef.current = false;
    typoFixRef.current = false;
    pauseUntilRef.current = 0;
    tick();

    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [enabled, phrases, typingMs, deletingMs, pauseMs, typoChance]);

  return display;
}