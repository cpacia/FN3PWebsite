"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/**
 * Product photos. On phones, a swipeable strip with a position indicator; from
 * `lg` up, every photo laid out in a column beside the sticky buy box, which
 * is how you look at a garment front and back without clicking through
 * thumbnails. Photos are multiplied onto the panel, like the cards.
 */
export function ProductGallery({
  images,
  title,
}: {
  images: { url: string; alt: string }[];
  title: string;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-4/5 items-center justify-center rounded-3xl bg-fn-panel font-display text-xl font-bold uppercase tracking-widest text-fn-ink/30">
        FN3P
      </div>
    );
  }

  const onScroll = () => {
    const el = strip.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <>
      {/* Phones and tablets */}
      <div className="relative lg:hidden">
        <div
          ref={strip}
          onScroll={onScroll}
          className="-mx-5 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] sm:mx-0 [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div
              key={img.url}
              className="relative aspect-4/5 w-full shrink-0 snap-center bg-fn-panel sm:rounded-3xl"
            >
              <Image
                src={img.url}
                alt={img.alt || `${title}, photo ${i + 1}`}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-contain p-[8%] mix-blend-multiply"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-4 flex justify-center gap-2" aria-hidden>
            {images.map((img, i) => (
              <span
                key={img.url}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-fn-ink" : "w-1.5 bg-fn-ink/25"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className={`hidden gap-4 lg:grid ${images.length > 1 ? "grid-cols-2" : ""}`}>
        {images.map((img, i) => (
          <div
            key={img.url}
            className={`relative aspect-4/5 overflow-hidden rounded-3xl bg-fn-panel ${
              // An odd count leads with one big photo, so the column ends square.
              images.length > 1 && images.length % 2 === 1 && i === 0 ? "col-span-2" : ""
            }`}
          >
            <Image
              src={img.url}
              alt={img.alt || `${title}, photo ${i + 1}`}
              fill
              priority={i === 0}
              sizes={images.length > 1 && !(images.length % 2 === 1 && i === 0) ? "30vw" : "60vw"}
              className="object-contain p-[8%] mix-blend-multiply"
            />
          </div>
        ))}
      </div>
    </>
  );
}
