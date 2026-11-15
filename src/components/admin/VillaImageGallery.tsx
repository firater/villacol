"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";

import {
  createVillaImage,
  deleteVillaImage,
  reorderVillaImages,
} from "@/actions/admin/image.actions";
import type { AdminVillaImageRow } from "@/db/queries/admin.villas.queries";
import { useRouter } from "@/i18n/navigation";

type Props = {
  villaId: number;
  initialImages: AdminVillaImageRow[];
  onError: (message: string) => void;
};

type GalleryImage = AdminVillaImageRow;

function SortableThumb({
  image,
  index,
  pending,
  onRemove,
}: {
  image: GalleryImage;
  index: number;
  pending: boolean;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  const isMain = index === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-[4/3] overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 ${
        isMain
          ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950"
          : "ring-1 ring-zinc-200 dark:ring-zinc-800"
      } ${isDragging ? "opacity-80 shadow-lg" : ""}`}
      {...attributes}
      {...listeners}
    >
      <Image
        src={image.url}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, 200px"
        className="object-cover"
        draggable={false}
      />
      {isMain ? (
        <span className="absolute left-2 top-2 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
          Main
        </span>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onRemove(image.id);
        }}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/75 disabled:opacity-40"
        aria-label="Remove image"
      >
        ×
      </button>
    </div>
  );
}

export function VillaImageGallery({ villaId, initialImages, onError }: Props) {
  const router = useRouter();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>(() =>
    [...initialImages].sort(
      (a, b) => a.orderValue - b.orderValue || a.id.localeCompare(b.id),
    ),
  );

  useEffect(() => {
    setImages(
      [...initialImages].sort(
        (a, b) => a.orderValue - b.orderValue || a.id.localeCompare(b.id),
      ),
    );
  }, [initialImages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const persistOrder = useCallback(
    (ordered: GalleryImage[]) => {
      startTransition(async () => {
        const result = await reorderVillaImages({
          villaId,
          orderedImageIds: ordered.map((img) => img.id),
        });
        if (!result.ok) {
          onError(result.error);
          return;
        }
        router.refresh();
      });
    },
    [onError, router, villaId],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over === null || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(images, oldIndex, newIndex);
    setImages(next);
    persistOrder(next);
  }

  function removeImage(imageId: string) {
    onError("");
    startTransition(async () => {
      const result = await deleteVillaImage({ imageId });
      if (!result.ok) {
        onError(result.error);
        return;
      }
      const next = images.filter((img) => img.id !== imageId);
      setImages(next);
      if (next.length > 0) {
        await reorderVillaImages({
          villaId,
          orderedImageIds: next.map((img) => img.id),
        });
      }
      router.refresh();
    });
  }

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) return;

      onError("");
      setUploading(true);

      try {
        let orderBase = images.length;
        for (const file of list) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("villaId", String(villaId));

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const payload = (await response.json()) as { url?: string; error?: string };
          if (!response.ok || payload.url === undefined) {
            throw new Error(payload.error ?? "Upload failed");
          }

          const created = await createVillaImage({
            villaId,
            url: payload.url,
            orderValue: orderBase,
            isMain: orderBase === 0 && images.length === 0,
          });

          if (!created.ok) {
            throw new Error(created.error);
          }

          orderBase += 1;
        }

        router.refresh();
      } catch (error) {
        onError(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [images.length, onError, router, villaId],
  );

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    if (uploading || pending) return;
    void uploadFiles(event.dataTransfer.files);
  }

  const busy = uploading || pending;

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver
            ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/20"
            : "border-zinc-300 bg-zinc-50/80 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/40"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <p className="font-serif text-lg text-zinc-800 dark:text-zinc-100">
          {uploading ? "Uploading…" : "Drop images here"}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          or click to browse · JPEG, PNG, WebP up to 12MB
        </p>
        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const files = event.target.files;
            if (files !== null && files.length > 0) {
              void uploadFiles(files);
            }
            event.target.value = "";
          }}
        />
      </div>

      {images.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((img) => img.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((image, index) => (
                <SortableThumb
                  key={image.id}
                  image={image}
                  index={index}
                  pending={pending}
                  onRemove={removeImage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No images yet.</p>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Drag thumbnails to reorder. The first image is the main photo.
      </p>
    </div>
  );
}