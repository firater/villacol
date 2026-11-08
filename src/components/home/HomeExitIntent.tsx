"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  isExitIntentCooldownActive,
  isExitIntentUsed,
  setExitIntentCooldown,
} from "@/lib/exit-intent-cookies";

import { ExitIntentModal } from "./ExitIntentModal";
import { ExitIntentTimer } from "./ExitIntentTimer";

const DESKTOP_QUERY = "(min-width: 768px)";

/**
 * Homepage exit-intent: mouse-leave modal on desktop + floating countdown widget.
 */
export function HomeExitIntent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [offerTick, setOfferTick] = useState(0);
  const exitTriggeredRef = useRef(false);

  const openModal = useCallback(() => {
    if (isExitIntentUsed()) return;
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const dismissModal = useCallback(() => {
    setExitIntentCooldown();
    setModalOpen(false);
  }, []);

  const onOfferPersisted = useCallback(() => {
    setOfferTick((key) => key + 1);
  }, []);

  useEffect(() => {
    if (isExitIntentUsed()) return;

    const media = window.matchMedia(DESKTOP_QUERY);
    if (!media.matches) return;

    const onMouseLeave = (event: MouseEvent) => {
      if (event.clientY >= 0) return;
      if (exitTriggeredRef.current) return;
      if (isExitIntentUsed()) return;
      if (isExitIntentCooldownActive()) return;
      if (modalOpen) return;

      exitTriggeredRef.current = true;
      openModal();
    };

    document.addEventListener("mouseleave", onMouseLeave);
    return () => document.removeEventListener("mouseleave", onMouseLeave);
  }, [modalOpen, openModal]);

  return (
    <>
      <ExitIntentModal
        open={modalOpen}
        onClose={closeModal}
        onDismiss={dismissModal}
        onOfferPersisted={onOfferPersisted}
      />
      <ExitIntentTimer refreshKey={offerTick} onOpenModal={openModal} />
    </>
  );
}
