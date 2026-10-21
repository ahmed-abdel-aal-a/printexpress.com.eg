"use client";
import React from "react";
import { Store } from "lucide-react";

const petalColors = [
  "#E32636", // Red (0)
  "#DFE0E2", // Gray (45)
  "#9D32B2", // Purple (90)
  "#3553B8", // Dark Blue (135)
  "#31B4D2", // Cyan (180)
  "#7EC242", // Green (225)
  "#F9D423", // Yellow (270)
  "#F38420", // Orange (315)
];

export function FlowerLogo({
  className = "",
  size = 64,
  innerIcon,
}: {
  className?: string;
  size?: number;
  innerIcon?: React.ReactNode;
}) {
  // We draw in counter-clockwise order so each petal correctly overlaps the previous one,
  // creating the perfect clockwise Escher pinwheel effect seen in the image.
  const drawOrder = [0, 7, 6, 5, 4, 3, 2, 1];

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <filter id="petalShadow" x="-50%" y="-50%" width="200%" height="200%">
            {/* Perfectly symmetric local shadow (casts strictly to the "right" of each petal) */}
            <feDropShadow dx="2" dy="0" stdDeviation="1.5" floodColor="#000" floodOpacity="0.12" />
          </filter>
          <clipPath id="rightHalf">
            {/* Clips the second Red petal exactly in half so it doesn't overlap Orange on the left */}
            <rect x="0" y="-60" width="60" height="120" />
          </clipPath>
        </defs>
        <g transform="translate(50, 50)">
          {drawOrder.map((i) => (
            <g key={i} transform={`rotate(${i * 45})`}>
              <path
                // Perfect teardrop shape: Bezier curves to the top, perfect semicircle (A 14 14) at the tip
                d="M 0,0 C 11,-15 14,-30 14,-35 A 14 14 0 0 0 -14 -35 C -14,-30 -11,-15 0,0 Z"
                fill={petalColors[i]}
                filter="url(#petalShadow)"
              />
            </g>
          ))}
          {/* Redraw right half of Red (index 0) to complete the cyclical pinwheel overlap */}
          <g transform="rotate(0)" clipPath="url(#rightHalf)">
            <path
              d="M 0,0 C 11,-15 14,-30 14,-35 A 14 14 0 0 0 -14 -35 C -14,-30 -11,-15 0,0 Z"
              fill={petalColors[0]}
              filter="url(#petalShadow)"
            />
          </g>
          <circle cx="0" cy="0" r="8.5" fill="#FFFFFF" />
        </g>
      </svg>
      {innerIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-900 z-10">
          {innerIcon}
        </div>
      )}
    </div>
  );
}

export function BrandText({
  title = "Print",
  subtitle = "Express",
  size = "md",
  layout = "horizontal",
}: {
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl";
  layout?: "horizontal" | "vertical";
}) {
  const sizes = {
    sm: {
      pFirst: "text-4xl",
      pRest: "text-3xl",
      sub: "text-[9px]",
      ml: "ml-4",
    },
    md: {
      pFirst: "text-5xl",
      pRest: "text-4xl",
      sub: "text-xs",
      ml: "ml-6",
    },
    lg: {
      pFirst: "text-7xl",
      pRest: "text-6xl",
      sub: "text-sm",
      ml: "ml-10",
    },
    xl: {
      pFirst: "text-9xl",
      pRest: "text-8xl",
      sub: "text-xl",
      ml: "ml-16",
    },
  };

  const s = sizes[size];
  const alignment = layout === "vertical" ? "items-center" : "items-start ml-2";
  const firstLetter = title ? title[0] : "";
  const restOfTitle = title ? title.slice(1) : "";

  return (
    <div className={`flex flex-col shrink-0 ${alignment}`} dir="ltr">
      <div className="flex items-baseline italic drop-shadow-sm text-[#F9D423] pr-2">
        <span className={`${s.pFirst} font-sans font-black leading-none tracking-tight`}>
          {firstLetter}
        </span>
        <span className={`${s.pRest} font-sans font-black leading-none tracking-tight`}>
          {restOfTitle}
        </span>
      </div>
      <span className={`${s.sub} ${s.ml} font-sans font-bold tracking-[0.4em] text-[#7D7D7D] uppercase mt-0.5 italic`}>
        {subtitle}
      </span>
    </div>
  );
}

export function MainLogo({
  size = "md",
  className = "",
  layout = "horizontal",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  layout?: "horizontal" | "vertical";
}) {
  const sizeMap = { sm: 40, md: 56, lg: 80, xl: 120 };
  const logoSize = sizeMap[size];
  const flexDir = layout === "vertical" ? "flex-col" : "flex-row";
  return (
    <div className={`flex items-center gap-2 ${flexDir} ${className}`}>
      <FlowerLogo size={logoSize} />
      <BrandText size={size} layout={layout} />
    </div>
  );
}

export function ShopLogo({
  size = "md",
  className = "",
  layout = "horizontal",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  layout?: "horizontal" | "vertical";
}) {
  const sizeMap = { sm: 40, md: 56, lg: 80, xl: 120 };
  const logoSize = sizeMap[size];
  const flexDir = layout === "vertical" ? "flex-col" : "flex-row";
  return (
    <div className={`flex items-center gap-2 ${flexDir} ${className}`}>
      <FlowerLogo
        size={logoSize}
        innerIcon={<Store size={logoSize * 0.4} strokeWidth={3} />}
      />
      <BrandText title="Shop" subtitle="Express" size={size} layout={layout} />
    </div>
  );
}
