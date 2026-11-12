"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  getUnreadDeals,
  markDealsRead,
  type UnreadDeal,
} from "@/actions/public/deal.actions";
import { Link } from "@/i18n/navigation";

const DEAL_IMAGES = [
  "/smr2.webp",
  "/smr3.jpg",
  "/smr4.webp",
  "/best.png",
] as const;

type Props = {
  initialDeals: UnreadDeal[];
  initialUnreadCount: number;
};

export function NotificationBellDropdown({
  initialDeals,
  initialUnreadCount,
}: Props) {
  const t = useTranslations("layout.notifications");
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [deals] = useState(initialDeals);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const rootRef = useRef<HTMLDivElement>(null);
  const markedOnOpenRef = useRef(false);

  const syncUnreadCount = useCallback(async () => {
    const result = await getUnreadDeals();
    if (!result.ok) return;
    setUnreadCount(result.data.unreadCount);
  }, []);

  useEffect(() => {
    void syncUnreadCount();
  }, [syncUnreadCount]);

  useEffect(() => {
    if (!open) {
      markedOnOpenRef.current = false;
      return;
    }
    if (markedOnOpenRef.current) return;
    markedOnOpenRef.current = true;

    const dealIds = deals.map((deal) => deal.id);
    setUnreadCount(0);

    void (async () => {
      if (dealIds.length === 0) return;
      const result = await markDealsRead({ dealIds });
      if (!result.ok) {
        await syncUnreadCount();
      }
    })();
  }, [deals, open, syncUnreadCount]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  const showUnreadPulse = unreadCount > 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="relative inline-flex items-center justify-center bg-white px-4 py-2.5 text-stone-900 transition-colors hover:bg-stone-50/80 hover:text-stone-950"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("openMenu")}
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon className="h-5 w-5" />
        {showUnreadPulse ? (
          <span className="absolute right-2 top-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label={t("panelTitle")}
          className="absolute end-0 top-full z-50 mt-3 w-[min(90vw,30rem)] rounded-[2rem] border border-stone-200/90 bg-stone-50 p-6 shadow-2xl sm:p-8"
        >
          <header className="border-b border-stone-300/50 pb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-400">
              {t("panelKicker")}
            </p>
            <h2 className="mt-1 font-serif text-3xl tracking-tight text-neutral-900">{t("panelTitle")}</h2>
          </header>

          {deals.length === 0 ? (
            <EmptyMagazineState message={t("empty")} />
          ) : (
            <div className="no-scrollbar mt-6 max-h-[min(60vh,450px)] space-y-10 overflow-y-auto pr-1">
              {deals.map((deal, index) => (
                <DealMagazineCard
                  key={deal.id}
                  deal={deal}
                  imageSrc={DEAL_IMAGES[index % DEAL_IMAGES.length]}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function DealMagazineCard({
  deal,
  imageSrc,
}: {
  deal: UnreadDeal;
  imageSrc: string;
}) {
  const t = useTranslations("layout.notifications");

  const cardBody = (
    <article className="group space-y-4">
      <div
        className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl bg-stone-200 ring-1 ring-stone-200/80"
        style={{ aspectRatio: "2 / 1" }}
      >
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(max-width: 640px) 90vw, 480px"
          className="object-cover"
        />
      </div>
      <h3 className="font-serif text-2xl leading-tight tracking-tight text-neutral-950">{deal.title}</h3>
      <p className="line-clamp-3 font-sans text-sm leading-relaxed text-neutral-600">{deal.body}</p>
      {deal.link ? (
        <p className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-neutral-900">
          <span>{t("viewOffer")}</span>
          <ArrowRightIcon className="size-4 text-orange-600" />
        </p>
      ) : null}
    </article>
  );

  const interactiveClass =
    "block w-full rounded-2xl text-left transition hover:bg-stone-100/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500";

  if (deal.link) {
    const external = /^https?:\/\//i.test(deal.link);
    if (external) {
      return (
        <a
          href={deal.link}
          target="_blank"
          rel="noopener noreferrer"
          className={interactiveClass}
        >
          {cardBody}
        </a>
      );
    }
    if (deal.link.startsWith("/")) {
      return (
        <Link href={deal.link as "/"} className={interactiveClass}>
          {cardBody}
        </Link>
      );
    }
    return (
      <a href={deal.link} className={interactiveClass}>
        {cardBody}
      </a>
    );
  }

  return <div className={interactiveClass}>{cardBody}</div>;
}

function EmptyMagazineState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      <JournalIcon className="size-10 text-stone-400" />
      <p className="mt-5 max-w-[16rem] font-serif text-xl leading-snug text-neutral-700">{message}</p>
    </div>
  );
}

function JournalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M6 4h12a2 2 0 0 1 2 2v14H6V4Z" />
      <path d="M6 8h12M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}
