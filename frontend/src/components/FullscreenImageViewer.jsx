import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function FullscreenImageViewer({ images = [], index = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(index ?? 0);
  const [visible, setVisible] = useState(false);
  const trackRef = useRef(null);
  const isManualScrollRef = useRef(false);

  const clampedIndex = (value) => {
    if (!images.length) return 0;
    return Math.max(0, Math.min(value, images.length - 1));
  };

  const scrollToIndex = useCallback((targetIndex) => {
    const container = trackRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const left = width * targetIndex;
    isManualScrollRef.current = true;
    container.scrollLeft = left;
    container.scrollTo?.({
      left,
      behavior: "smooth",
    });
    window.setTimeout(() => {
      isManualScrollRef.current = false;
    }, 200);
  }, []);

  useEffect(() => {
    setCurrentIndex(clampedIndex(index));
  }, [index, images.length]);

  useEffect(() => {
    scrollToIndex(currentIndex);
  }, [currentIndex, scrollToIndex]);

  const handleScroll = () => {
    if (isManualScrollRef.current) return;
    const container = trackRef.current;
    if (!container) return;
    const width = container.clientWidth || 1;
    const nextIndex = Math.round(container.scrollLeft / width);
    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex);
    }
  };

  const goTo = (idx) => {
    const next = clampedIndex(idx);
    setCurrentIndex(next);
    scrollToIndex(next);
  };

  const goPrev = () => {
    if (images.length <= 1) return;
    const next = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(next);
    scrollToIndex(next);
  };

  const goNext = () => {
    if (images.length <= 1) return;
    const next = (currentIndex + 1) % images.length;
    setCurrentIndex(next);
    scrollToIndex(next);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setVisible(true);
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!images?.length) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/70 dark:bg-black/80 backdrop-blur-md flex items-center justify-center px-4 transition-opacity duration-200 ease-in-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <button
        aria-label="Close viewer"
        onClick={onClose}
        className="absolute top-4 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70 text-white transition-opacity duration-200 ease-in-out"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            aria-label="Previous image"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-3 hover:bg-black/70 text-white transition-opacity duration-200 ease-in-out z-20"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-3 hover:bg-black/70 text-white transition-opacity duration-200 ease-in-out z-20"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="w-full max-w-6xl h-[90vh]">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex w-full h-full overflow-hidden snap-x snap-mandatory scroll-smooth touch-pan-y hide-scrollbar no-scrollbar"
        >
          {images.map((src, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-full h-full snap-center flex items-center justify-center bg-black/60 rounded-xl px-4"
            >
              <img
                src={src}
                alt={`fullscreen image ${idx + 1}`}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none"
                draggable="false"
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
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
        )}
      </div>
    </div>
  );
}

