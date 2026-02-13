"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageViewer({ src, alt = "Foto", onClose }: ImageViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = alt.replace(/[^a-zA-Z0-9]/g, "_") + ".jpg";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(src, "_blank");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[60] w-full bg-transparent backdrop:bg-black/80"
      onClick={handleBackdropClick}
    >
      <div className="flex min-h-full flex-col items-center justify-center p-4 pointer-events-none">
        {/* Controls */}
        <div className="pointer-events-auto mb-3 flex gap-2">
          <Button
            onClick={handleDownload}
            size="sm"
            variant="outline"
            className="gap-2 rounded-full bg-card/90 backdrop-blur"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </Button>
          <Button
            onClick={onClose}
            size="icon"
            variant="outline"
            className="rounded-full bg-card/90 backdrop-blur"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Image */}
        <div className="pointer-events-auto relative max-h-[80vh] max-w-[90vw] overflow-hidden rounded-2xl">
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={900}
            unoptimized
            className="max-h-[80vh] w-auto object-contain"
          />
        </div>
      </div>
    </dialog>
  );
}
