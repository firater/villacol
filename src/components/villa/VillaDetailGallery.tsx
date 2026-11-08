import Image from "next/image";

type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
  isMain: boolean;
};

type Props = {
  title: string;
  images: GalleryImage[];
};

const MAIN_ASPECT = "16 / 9";
const THUMB_ASPECT = "4 / 3";

/**
 * Hero + thumbnail strip with reserved boxes so decoding never collapses layout.
 */
export function VillaDetailGallery({ title, images }: Props) {
  const sorted = [...images].sort((a, b) => {
    if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
    return 0;
  });
  const main = sorted[0];
  const thumbs = sorted.slice(1, 5);
  const mainAlt = main?.alt ?? title;

  return (
    <div className="space-y-3">
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800"
        style={{ aspectRatio: MAIN_ASPECT }}
      >
        {main ? (
          <Image
            src={main.url}
            alt={mainAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
            —
          </div>
        )}
      </div>
      {thumbs.length > 0 ? (
        <ul className="grid grid-cols-4 gap-2 sm:gap-3">
          {thumbs.map((img) => (
            <li key={img.id}>
              <div
                className="relative overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
                style={{ aspectRatio: THUMB_ASPECT }}
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? title}
                  fill
                  sizes="(max-width: 640px) 22vw, 15vw"
                  className="object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
