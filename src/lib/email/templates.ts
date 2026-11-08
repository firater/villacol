/**
 * Plain-string email bodies.
 *
 * Deliberately not React Email components: Phase 7 is server logic, and the
 * plan keeps copy in `messages/*.json` from Phase 8 onward. These are the
 * minimal, locale-aware bodies the OTP flow needs today.
 */
import type { Locale } from "@/lib/locales";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layoutEmail(options: {
  preheader: string;
  heading: string;
  bodyHtml: string;
}): string {
  const preheader = escapeHtml(options.preheader);
  const heading = escapeHtml(options.heading);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Georgia,'Times New Roman',serif;color:#18181b;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#78350f 0%,#b45309 50%,#d97706 100%);padding:28px 32px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#fef3c7;font-family:system-ui,sans-serif;">Villa Collection</p>
              <h1 style="margin:12px 0 0;font-size:26px;font-weight:600;color:#fffbea;line-height:1.25;">${heading}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#3f3f46;">
              ${options.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #e4e4e7;font-family:system-ui,sans-serif;font-size:12px;color:#71717a;line-height:1.5;">
              Villa Collection · Turkish Mediterranean villas
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

type OtpCopy = {
  subject: string;
  heading: string;
  intro: string;
  expiry: (minutes: number) => string;
  ignore: string;
};

const OTP_COPY: Record<Locale, OtpCopy> = {
  en: {
    subject: "Your booking access code",
    heading: "Your access code",
    intro: "Use this code to open your booking:",
    expiry: (minutes) => `The code expires in ${minutes} minutes.`,
    ignore: "If you did not request this, you can ignore this email.",
  },
  de: {
    subject: "Ihr Zugangscode zur Buchung",
    heading: "Ihr Zugangscode",
    intro: "Mit diesem Code öffnen Sie Ihre Buchung:",
    expiry: (minutes) => `Der Code ist ${minutes} Minuten gültig.`,
    ignore:
      "Falls Sie diesen Code nicht angefordert haben, ignorieren Sie diese E-Mail.",
  },
  ru: {
    subject: "Код доступа к бронированию",
    heading: "Ваш код доступа",
    intro: "Используйте этот код, чтобы открыть бронирование:",
    expiry: (minutes) => `Код действителен ${minutes} минут.`,
    ignore: "Если вы не запрашивали код, просто проигнорируйте это письмо.",
  },
};

export type BookingOtpEmail = {
  subject: string;
  html: string;
  text: string;
};

export function renderBookingOtpEmail(options: {
  code: string;
  guestName: string;
  locale: Locale;
  expiresInMinutes: number;
}): BookingOtpEmail {
  const copy = OTP_COPY[options.locale];
  const name = options.guestName.trim();
  const greeting = name.length > 0 ? `${name}, ` : "";
  const intro = `${greeting}${copy.intro}`;

  const text = [
    copy.heading,
    "",
    intro,
    "",
    options.code,
    "",
    copy.expiry(options.expiresInMinutes),
    copy.ignore,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 20px;">${escapeHtml(intro)}</p>
    <div style="text-align:center;margin:24px 0;padding:20px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
      <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#92400e;">One-time code</p>
      <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:8px;color:#78350f;font-family:ui-monospace,monospace;">${escapeHtml(options.code)}</p>
    </div>
    <p style="margin:0 0 12px;">${escapeHtml(copy.expiry(options.expiresInMinutes))}</p>
    <p style="margin:0;color:#71717a;font-size:13px;">${escapeHtml(copy.ignore)}</p>`;

  const html = layoutEmail({
    preheader: options.code,
    heading: copy.heading,
    bodyHtml,
  });

  return { subject: copy.subject, html, text };
}

type InquiryCopy = {
  subject: string;
  heading: string;
  intro: string;
  cta: string;
  security: string;
};

const INQUIRY_COPY: Record<Locale, InquiryCopy> = {
  en: {
    subject: "Your villa inquiry",
    heading: "Inquiry received",
    intro: "Thank you for your interest. Use the button below to track your inquiry securely.",
    cta: "View your inquiry",
    security:
      "You will need a one-time code sent to this email address to view details.",
  },
  de: {
    subject: "Ihre Villen-Anfrage",
    heading: "Anfrage eingegangen",
    intro: "Vielen Dank. Mit der Schaltfläche unten verfolgen Sie Ihre Anfrage sicher.",
    cta: "Anfrage ansehen",
    security:
      "Zum Anzeigen benötigen Sie einen Einmalcode, den wir an diese E-Mail senden.",
  },
  ru: {
    subject: "Ваш запрос на бронирование",
    heading: "Запрос получен",
    intro: "Спасибо. Откройте запрос по кнопке ниже.",
    cta: "Открыть запрос",
    security:
      "Для просмотра понадобится одноразовый код, который мы отправим на эту почту.",
  },
};

export type BookingInquiryEmail = {
  subject: string;
  html: string;
  text: string;
};

export function renderBookingInquiryEmail(options: {
  guestName: string;
  villaTitle: string;
  locale: Locale;
  statusUrl: string;
}): BookingInquiryEmail {
  const copy = INQUIRY_COPY[options.locale];
  const name = options.guestName.trim();
  const greeting = name.length > 0 ? `${name}, ` : "";

  const text = [
    copy.heading,
    "",
    `${greeting}${copy.intro}`,
    "",
    options.statusUrl,
    "",
    copy.security,
    "",
    options.villaTitle,
  ].join("\n");

  const safeUrl = escapeHtml(options.statusUrl);
  const bodyHtml = `
    <p style="margin:0 0 16px;">${escapeHtml(`${greeting}${copy.intro}`)}</p>
    <p style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:#71717a;">Villa</p>
    <p style="margin:0 0 24px;font-size:18px;font-weight:600;color:#18181b;">${escapeHtml(options.villaTitle)}</p>
    <p style="margin:0 0 24px;text-align:center;">
      <a href="${safeUrl}" style="display:inline-block;background:#18181b;color:#fafafa;text-decoration:none;padding:14px 28px;border-radius:9999px;font-size:14px;font-weight:600;">${escapeHtml(copy.cta)}</a>
    </p>
    <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5;">${escapeHtml(copy.security)}</p>
    <p style="margin:16px 0 0;font-size:12px;word-break:break-all;color:#a1a1aa;">${safeUrl}</p>`;

  const html = layoutEmail({
    preheader: options.villaTitle,
    heading: copy.heading,
    bodyHtml,
  });

  return { subject: copy.subject, html, text };
}
