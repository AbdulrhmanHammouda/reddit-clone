import React, { useCallback, useEffect, useRef, useState } from "react";

export default function ImageCarousel({ images = [], onImageClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef(null);

  const scrollToIndex = useCallback(
    (index) => {
      const container = trackRef.current;
      if (!container) return;
      const clamped = Math.max(0, Math.min(index, images.length - 1));
      const width = container.clientWidth;
      container.scrollTo({
        left: width * clamped,
        behavior: "smooth",
      });
    },
    [images.length]
  );

  useEffect(() => {
    setCurrentIndex(0);
    scrollToIndex(0);
  }, [images, scrollToIndex]);

  useEffect(() => {
    const handleResize = () => scrollToIndex(currentIndex);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentIndex, scrollToIndex]);

  const handleScroll = () => {
    const container = trackRef.current;
    if (!container) return;
    const width = container.clientWidth || 1;
    const nextIndex = Math.round(container.scrollLeft / width);
    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex);
    }
  };

  const goTo = (index) => {
    setCurrentIndex(index);
    scrollToIndex(index);
  };

  const goPrev = () => {
    if (images.length <= 1) return;
    goTo((currentIndex - 1 + images.length) % images.length);
  };

  const goNext = () => {
    if (images.length <= 1) return;
    goTo((currentIndex + 1) % images.length);
  };

  if (!images?.length) return null;

  return (
    <div className="mt-3 relative rounded-xl overflow-hidden border border-reddit-border dark:border-reddit-dark_divider bg-black/5 dark:bg-black/20">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-hidden snap-x snap-mandatory scroll-smooth touch-pan-y hide-scrollbar"
      >
        {images.map((src, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-full snap-center flex items-center justify-center bg-black/70 dark:bg-black/80"
            style={{ minHeight: 280, maxHeight: 420 }}
          >
            <img
              src={src}
              alt={`post image ${idx + 1}`}
              draggable="false"
              className="max-h-[420px] w-full h-full object-contain cursor-pointer rounded-lg"
              onClick={() => onImageClick?.(idx)}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            aria-label="Previous image"
            onClick={goPrev}
            className="absolute top-1/2 left-3 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition-opacity duration-200 ease-in-out"
          >
            &#10094;
          </button>

          <button
            aria-label="Next image"
            onClick={goNext}
            className="absolute top-1/2 right-3 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition-opacity duration-200 ease-in-out"
          >
            &#10095;
          </button>

          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to image ${idx + 1}`}
                onClick={() => goTo(idx)}
                className={`h-2.5 w-2.5 rounded-full transition-opacity duration-200 ease-in-out ${
                  currentIndex === idx ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

