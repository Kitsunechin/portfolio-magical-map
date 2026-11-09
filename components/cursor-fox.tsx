"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface CursorFoxProps {
  containerRef: React.RefObject<HTMLElement | null>;
  /** Where to start before the first mousemove fires, in container-relative px. */
  initial?: { x: number; y: number };
}

// Same fox artwork as the old maze (components/interactive-map.tsx), just
// re-driven by the cursor instead of keyboard + wall-collision physics.
export default function CursorFox({ containerRef, initial = { x: 200, y: 120 } }: CursorFoxProps) {
  const rawX = useMotionValue(initial.x);
  const rawY = useMotionValue(initial.y);
  const foxX = useSpring(rawX, { stiffness: 150, damping: 15, mass: 0.6 });
  const foxY = useSpring(rawY, { stiffness: 150, damping: 15, mass: 0.6 });
  const [direction, setDirection] = useState<"left" | "right">("right");
  const lastX = useRef(initial.x);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      rawX.set(x);
      rawY.set(y);

      if (x - lastX.current > 2) setDirection("right");
      else if (lastX.current - x > 2) setDirection("left");
      lastX.current = x;
    };

    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, [containerRef, rawX, rawY]);

  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      style={{
        x: foxX,
        y: foxY,
        left: -42,
        top: -34.5,
        scaleX: direction === "right" ? -1 : 1,
      }}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          viewBox="0 0 640 520"
          width="84"
          height="69"
          className="drop-shadow-[0_0_14px_rgba(120,182,226,0.7)]"
        >
          <defs>
            <linearGradient id="cf-leg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b8c6cc" /><stop offset=".45" stopColor="#7d8a90" /><stop offset="1" stopColor="#1f2427" />
            </linearGradient>
            <linearGradient id="cf-legBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8f9ca2" /><stop offset=".5" stopColor="#565f64" /><stop offset="1" stopColor="#15191b" />
            </linearGradient>
            <linearGradient id="cf-t1" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#9aa4a8" /><stop offset="1" stopColor="#e3e8ea" />
            </linearGradient>
            <linearGradient id="cf-t2" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#6f797d" /><stop offset="1" stopColor="#c3cbce" />
            </linearGradient>
            <linearGradient id="cf-ear" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#d9e2e6" /><stop offset="1" stopColor="#2b3236" />
            </linearGradient>
          </defs>

          <g>
            <path d="M400 330 C420 230 470 120 560 40 C530 120 500 220 440 330Z" fill="url(#cf-t2)" />
            <path d="M405 330 C450 220 530 130 630 90 C570 160 520 250 450 335Z" fill="url(#cf-t1)" />
            <path d="M405 335 C470 260 560 200 640 190 C570 240 520 300 455 345Z" fill="url(#cf-t2)" />
            <path d="M400 330 C400 220 420 110 480 20 C470 110 460 220 430 330Z" fill="url(#cf-t1)" />
            <path d="M405 340 C480 300 570 290 635 300 C570 320 510 350 455 360Z" fill="url(#cf-t1)" />
            <path d="M400 345 C460 350 540 390 600 450 C530 420 470 400 420 380Z" fill="url(#cf-t2)" />
            <path d="M398 340 C440 380 480 440 500 500 C460 450 430 420 395 390Z" fill="url(#cf-t1)" />
            <g fill="#f4f7f8" opacity=".85">
              <path d="M455 200 C480 150 510 110 545 70 C515 120 495 160 470 210Z" />
              <path d="M480 260 C520 210 570 170 615 120 C575 180 535 220 495 270Z" />
              <path d="M500 330 C550 315 590 310 625 305 C585 320 545 330 505 340Z" />
              <path d="M420 120 C430 90 445 60 465 40 C450 75 440 100 432 130Z" />
            </g>
            <g fill="#4f585c" opacity=".6">
              <path d="M430 300 C450 250 480 200 520 150 C495 205 470 250 445 305Z" />
              <path d="M470 380 C510 395 545 420 575 445 C540 430 505 415 465 395Z" />
            </g>
            <path d="M600 450 C580 420 560 400 540 395 L600 450Z M500 500 C495 470 485 450 470 440Z" fill="#f4f7f8" />
          </g>

          <path d="M190 330 L178 470 L170 498 L196 498 L204 470 L222 340Z" fill="url(#cf-legBack)" />
          <path d="M370 340 L392 420 L378 498 L402 498 L418 420 L405 335Z" fill="url(#cf-legBack)" />

          <path d="M150 230 C175 215 210 260 260 270 C320 280 380 270 410 300 C432 325 425 370 400 385 C350 395 280 385 240 380 C210 377 190 370 175 350 C150 320 140 270 150 230Z" fill="#c4d1d6" />
          <path d="M190 360 C240 372 320 380 400 382 C380 392 300 392 240 386 C215 383 198 375 190 360Z" fill="#a3b1b7" />

          <path d="M205 345 L200 470 L190 505 L220 505 L228 470 L245 360Z" fill="url(#cf-leg)" />
          <path d="M340 360 L355 420 L342 505 L370 505 L384 420 L390 360Z" fill="url(#cf-leg)" />
          <path d="M190 505 L196 496 L202 505Z M342 505 L348 496 L354 505Z" fill="#0f1214" />

          <path d="M120 160 C160 150 200 170 215 210 L210 260 C185 250 160 245 140 250Z" fill="#2a3134" />

          <path d="M120 170 L150 175 L135 200 L165 205 L140 228 L172 240 L148 262 L180 275 L158 300 L190 310 L170 335 L150 300 L140 330 L130 290 L118 305 L118 260 L105 270 L112 220 L98 225Z" fill="#eef3f5" />

          <path d="M40 140 L60 132 C90 120 120 112 150 110 C175 110 195 125 200 150 C202 175 185 195 160 205 L140 215 L118 210 L120 196 L100 192 C80 178 60 160 40 150Z" fill="#c4d1d6" />
          <path d="M42 147 C70 152 100 160 130 168 L120 182 C95 178 70 166 42 150Z" fill="#eef3f5" />
          <path d="M120 196 L150 200 L138 214 L165 210 L150 228 L125 218Z" fill="#eef3f5" />
          <path d="M30 140 L44 136 L46 148 L34 150Z" fill="#0f1214" />
          <path d="M100 140 C110 136 122 136 132 142" fill="none" stroke="#1a1f22" strokeWidth="5" strokeLinecap="round" />
          <path d="M104 132 C112 128 122 128 128 131" fill="none" stroke="#8e9ba1" strokeWidth="3" strokeLinecap="round" />

          <path d="M175 120 L215 70 L210 150 L190 155Z" fill="#2a3134" />
          <path d="M140 115 C140 80 155 45 178 20 C192 50 196 90 186 128 Z" fill="url(#cf-ear)" />
          <path d="M152 112 C153 85 163 60 176 40 C184 65 184 95 178 120Z" fill="#3a4246" />
          <path d="M148 100 L160 104 L150 112 L165 116 L150 120Z" fill="#eef3f5" />

          <g fill="#78b6e2">
            <circle cx="300" cy="320" r="5" /><circle cx="250" cy="300" r="3" />
            <circle cx="470" cy="180" r="4" /><circle cx="540" cy="260" r="3" />
          </g>
        </svg>
      </motion.div>

      <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl -z-10" />
    </motion.div>
  );
}
