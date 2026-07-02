"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type ReadMoreProps = {
  children: ReactNode;
  maxHeight?: number;
  className?: string;
};

export function ReadMore({ children, maxHeight = 220, className }: ReadMoreProps) {
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const checkOverflow = () => {
      const height = element.scrollHeight;
      setFullHeight(height);
      setIsTruncated(height > maxHeight + 1);
    };

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(element);

    return () => observer.disconnect();
  }, [maxHeight, children]);

  const collapsed = isTruncated && !expanded;
  const animatedMaxHeight = collapsed
    ? maxHeight
    : isTruncated
      ? fullHeight || maxHeight
      : undefined;

  function handleToggle() {
    const element = contentRef.current;
    if (element) {
      setFullHeight(element.scrollHeight);
    }
    setExpanded((value) => !value);
  }

  return (
    <div className={className}>
      <div className="relative">
        <div
          id={contentId}
          ref={contentRef}
          className={
            isTruncated
              ? "overflow-hidden transition-[max-height] duration-500 ease-in-out motion-reduce:transition-none"
              : undefined
          }
          style={animatedMaxHeight !== undefined ? { maxHeight: animatedMaxHeight } : undefined}
        >
          {children}
        </div>
        {isTruncated && (
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-cream to-transparent transition-opacity duration-500 ease-in-out motion-reduce:transition-none ${
              expanded ? "opacity-0" : "opacity-100"
            }`}
          />
        )}
      </div>
      {isTruncated && (
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="mt-3 cursor-pointer font-sans text-sm font-normal text-sage-dark transition-colors hover:text-stone"
        >
          {expanded ? "Vis mindre" : "Les mer"}
        </button>
      )}
    </div>
  );
}
