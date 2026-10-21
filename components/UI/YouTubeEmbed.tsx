"use client";
import React, { useState, useEffect, useRef } from "react";

function extractVideoId(url: string): string {
  const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];
  return "";
}

// Global counter to give each instance a unique ID
let instanceCounter = 0;

export default function YouTubeEmbed({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const instanceId = useRef(++instanceCounter);
  const videoId = extractVideoId(src);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  useEffect(() => {
    // Listen for other videos starting - stop this one
    const handleOtherPlay = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail !== instanceId.current) {
        setIsPlaying(false);
      }
    };

    window.addEventListener("youtube-embed-play", handleOtherPlay);
    return () => {
      window.removeEventListener("youtube-embed-play", handleOtherPlay);
    };
  }, []);

  const handlePlay = () => {
    // Tell all other instances to stop
    window.dispatchEvent(
      new CustomEvent("youtube-embed-play", { detail: instanceId.current })
    );
    setIsPlaying(true);
  };

  if (isPlaying) {
    const playingClass = className
      .replace(/overflow-hidden/g, "")
      .replace(/cursor-pointer/g, "");
    return (
      <div className={playingClass}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
          className="w-full h-full"
          style={{ border: "none" }}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </div>
    );
  }

  return (
    <div
      className={`${className} cursor-pointer group`}
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      aria-label="تشغيل الفيديو"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handlePlay();
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailUrl}
        alt="صورة مصغرة للفيديو"
        className="w-full h-full object-cover"
      />

      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
          <svg
            className="w-8 h-8 md:w-10 md:h-10 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
