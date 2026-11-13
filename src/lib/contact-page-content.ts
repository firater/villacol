import type { Locale } from "@/lib/locales";

type ContactInfoBlock = {
  eyebrow: string;
  headline: string;
  body: string;
  emailLabel: string;
  emailValue: string;
  phoneLabel: string;
  phoneDisplay: string;
  phoneTel: string;
  whatsappLabel: string;
  whatsappCta: string;
  hoursLabel: string;
  hoursValue: string;
  footnote: string;
  findVillaCta: string;
};

type ContactPageBlock = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  formSectionLabel: string;
  info: ContactInfoBlock;
};

type MessagesFile = {
  contactPage: ContactPageBlock;
  layout: {
    home: {
      discountCta: {
        whatsappUrl: string;
      };
    };
  };
};

export async function loadContactPageCopy(locale: Locale) {
  const messages = (await import(`../../messages/${locale}.json`))
    .default as MessagesFile;

  return {
    page: messages.contactPage,
    whatsappUrl: messages.layout.home.discountCta.whatsappUrl,
  };
}

export type ContactPageCopy = Awaited<ReturnType<typeof loadContactPageCopy>>;
