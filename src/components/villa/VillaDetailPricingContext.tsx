"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { getVillaQuote, type QuoteDisplay } from "@/actions/public/quote.actions";

import { useCalendarSelection } from "./calendar/CalendarContext";

const QUOTE_DEBOUNCE_MS = 150;

export type VillaDetailQuoteState =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; display: QuoteDisplay };

type VillaDetailPricingContextValue = {
  guestCount: number;
  setGuestCount: Dispatch<SetStateAction<number>>;
  quote: VillaDetailQuoteState;
};

const VillaDetailPricingContext =
  createContext<VillaDetailPricingContextValue | null>(null);

type ProviderProps = {
  villaId: number;
  capacity: number;
  children: ReactNode;
};

export function VillaDetailPricingProvider({
  villaId,
  capacity,
  children,
}: ProviderProps) {
  const { checkIn, checkOut } = useCalendarSelection();
  const [guestCount, setGuestCount] = useState(() =>
    Math.min(2, Math.max(1, capacity)),
  );
  const [quote, setQuote] = useState<VillaDetailQuoteState>({ status: "empty" });

  useEffect(() => {
    if (checkIn === null || checkOut === null) {
      setQuote({ status: "empty" });
      return;
    }

    let active = true;
    setQuote({ status: "loading" });

    const timer = setTimeout(() => {
      void getVillaQuote({ villaId, checkIn, checkOut, guestCount }).then(
        (result) => {
          if (!active) return;
          setQuote(
            result.ok
              ? { status: "ready", display: result.data }
              : { status: "error", message: result.error },
          );
        },
      );
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [checkIn, checkOut, guestCount, villaId]);

  return (
    <VillaDetailPricingContext.Provider
      value={{ guestCount, setGuestCount, quote }}
    >
      {children}
    </VillaDetailPricingContext.Provider>
  );
}

export function useVillaDetailPricing(): VillaDetailPricingContextValue {
  const value = useContext(VillaDetailPricingContext);
  if (value === null) {
    throw new Error(
      "useVillaDetailPricing must be used within VillaDetailPricingProvider",
    );
  }
  return value;
}