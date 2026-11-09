"use client";

import * as React from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CursorFox from "@/components/cursor-fox";

interface Project {
  title: string;
  description: string;
  image: string;
  tags: string[];
  link: string;
}

interface ProjectPathMapProps {
  projects: Project[];
}

type Stop =
  | { type: "project"; project: Project; index: number }
  | { type: "seeMore" };

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface TreeSpot {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

const TREE_IMAGES = [
  "/images/trees/shrine-oak.svg",
  "/images/trees/silver-pine.svg",
  "/images/trees/moon-birch.svg",
];

// Deterministic 0..1 "random" from a point, so the hand-drawn wobble below is
// stable across re-renders (same technique as the old interactive-map.tsx).
function seededWobble(x: number, y: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

const WOBBLE_AMPLITUDE = 10;

function wobblyCurve(x1: number, y1: number, x2: number, y2: number) {
  const wob1 = (seededWobble(x1, y1) - 0.5) * 2 * WOBBLE_AMPLITUDE;
  const wob2 = (seededWobble(x2, y2) - 0.5) * 2 * WOBBLE_AMPLITUDE;
  if (y1 === y2) {
    // Horizontal leg: wobble perpendicular, i.e. vertically.
    const midX1 = x1 + (x2 - x1) * 0.33;
    const midX2 = x1 + (x2 - x1) * 0.67;
    return `C${midX1} ${y1 + wob1} ${midX2} ${y2 + wob2} ${x2} ${y2}`;
  }
  // Vertical leg: wobble perpendicular, i.e. horizontally.
  const midY1 = y1 + (y2 - y1) * 0.33;
  const midY2 = y1 + (y2 - y1) * 0.67;
  return `C${x1 + wob1} ${midY1} ${x2 + wob2} ${midY2} ${x2} ${y2}`;
}

// Connects two anchor points with a gentle dog-leg: down, across, down.
function connectorPath(a: { x: number; y: number }, b: { x: number; y: number }, bendRatio = 0.4) {
  const dropY = a.y + (b.y - a.y) * bendRatio;
  let d = `M${a.x} ${a.y}`;
  d += wobblyCurve(a.x, a.y, a.x, dropY);
  d += wobblyCurve(a.x, dropY, b.x, dropY);
  d += wobblyCurve(b.x, dropY, b.x, b.y);
  return d;
}

function rectsOverlap(a: Rect, b: Rect) {
  return !(b.right < a.left || b.left > a.right || b.bottom < a.top || b.top > a.bottom);
}

function randomTreeRect(marginStart: number, marginEnd: number, bandTop: number, bandBottom: number): Rect {
  const height = Math.round(70 + Math.random() * 26);
  const width = Math.round((height * 400) / 520);
  const left = marginStart + Math.random() * Math.max(marginEnd - marginStart - width, 10);
  const top = bandTop + Math.random() * Math.max(bandBottom - bandTop - height, 10);
  return { left, top, right: left + width, bottom: top + height };
}

// Scatters the existing tree SVGs in the margins beside each card as single,
// spaced-apart trees. Only the cards are treated as hard obstacles, and the
// path's own margin is generous enough that we don't need to check the
// stroked line separately.
function scatterTrees(cardRects: (Rect | null)[], sectionWidth: number): TreeSpot[] {
  const spots: TreeSpot[] = [];
  const cardObstacles: Rect[] = cardRects
    .filter((r): r is Rect => !!r)
    .map((r) => ({ left: r.left - 20, top: r.top - 20, right: r.right + 20, bottom: r.bottom + 20 }));

  const addTree = (rect: Rect) => {
    spots.push({
      src: TREE_IMAGES[spots.length % TREE_IMAGES.length],
      left: rect.left,
      top: rect.top,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
    });
  };

  cardRects.forEach((rect, i) => {
    if (!rect || i === cardRects.length - 1) return; // keep the "See more" CTA clear of clutter

    const cardMidX = (rect.left + rect.right) / 2;
    const onLeft = cardMidX < sectionWidth / 2;
    const marginStart = onLeft ? rect.right + 24 : 24;
    const marginEnd = onLeft ? sectionWidth - 24 : rect.left - 24;
    if (marginEnd - marginStart < 60) return;

    const bandTop = rect.top - 20;
    const bandBottom = rect.bottom + 170;

    // Single trees scattered through the margin, spaced apart from everything placed so far.
    for (let t = 0; t < 5; t++) {
      for (let attempt = 0; attempt < 12; attempt++) {
        const candidate = randomTreeRect(marginStart, marginEnd, bandTop, bandBottom);
        const obstacles = [
          ...cardObstacles,
          ...spots.map((s) => ({ left: s.left - 10, top: s.top - 10, right: s.left + s.width + 10, bottom: s.top + s.height + 10 })),
        ];
        if (!obstacles.some((o) => rectsOverlap(o, candidate))) {
          addTree(candidate);
          break;
        }
      }
    }
  });

  return spots;
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const jitter = ((index % 5) - 2) * 1.2;
  const asymmetricRadius =
    index % 2 === 0 ? "1.25rem 1.75rem 1.25rem 1.75rem" : "1.75rem 1.25rem 1.75rem 1.25rem";

  return (
    <Link href={project.link} className="block">
      <motion.div
        className="group relative bg-gradient-to-br from-card to-background border-2 border-primary/20 overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
        style={{ borderRadius: asymmetricRadius }}
        initial={{ opacity: 0, rotate: jitter }}
        animate={{ opacity: 1, rotate: jitter }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        whileHover={{ y: -8, scale: 1.02, rotate: 0 }}
      >
        <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5">
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 90vw, 380px"
            className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="p-5">
          <h3 className="font-display text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        </div>

        <div className="absolute top-0 left-0 w-10 h-10 border-l-2 border-t-2 border-primary/30 rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-r-2 border-b-2 border-primary/30 rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    </Link>
  );
}

function SeeMoreNode() {
  return (
    <Link
      href="/work"
      className="group inline-flex items-center gap-2 px-6 py-3 bg-primary rounded-full text-primary-foreground font-semibold hover:bloom-soft transition-all"
    >
      See More
      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export default function ProjectPathMap({ projects }: ProjectPathMapProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stopRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [metrics, setMetrics] = useState<{ width: number; height: number } | null>(null);
  const [connectors, setConnectors] = useState<string[]>([]);
  const [treeSpots, setTreeSpots] = useState<TreeSpot[]>([]);

  const stops = useMemo<Stop[]>(
    () => [
      ...projects.map((project, index): Stop => ({ type: "project", project, index })),
      { type: "seeMore" },
    ],
    [projects]
  );

  useLayoutEffect(() => {
    function measure() {
      const section = sectionRef.current;
      if (!section) return;
      const sectionRect = section.getBoundingClientRect();

      const rects: (Rect | null)[] = stopRefs.current.map((el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          left: r.left - sectionRect.left,
          top: r.top - sectionRect.top,
          right: r.right - sectionRect.left,
          bottom: r.bottom - sectionRect.top,
        };
      });

      const paths: string[] = [];
      for (let i = 0; i < rects.length - 1; i++) {
        const a = rects[i];
        const b = rects[i + 1];
        if (!a || !b) continue;
        paths.push(
          connectorPath(
            { x: (a.left + a.right) / 2, y: a.bottom },
            { x: (b.left + b.right) / 2, y: b.top }
          )
        );
      }

      setConnectors(paths);
      setMetrics({ width: sectionRect.width, height: sectionRect.height });
      setTreeSpots(scatterTrees(rects, sectionRect.width));
    }

    measure();
    const ro = new ResizeObserver(measure);
    if (sectionRef.current) ro.observe(sectionRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [stops.length]);

  return (
    <div ref={sectionRef} className="relative max-w-5xl mx-auto px-6 pt-8 pb-24">
      {metrics && (
        <svg
          className="absolute inset-0 z-0 pointer-events-none overflow-visible"
          width={metrics.width}
          height={metrics.height}
        >
          {connectors.map((d, i) => (
            <path
              key={i}
              d={d}
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="10 9"
              fill="none"
              opacity={0.7}
            />
          ))}
        </svg>
      )}

      {treeSpots.map((tree, i) => (
        <Image
          key={i}
          src={tree.src}
          alt=""
          width={tree.width}
          height={tree.height}
          unoptimized
          className="absolute z-0 pointer-events-none select-none"
          style={{ left: tree.left, top: tree.top }}
        />
      ))}

      <div className="relative z-10">
        {stops.map((stop, i) => (
          <div
            key={stop.type === "project" ? stop.project.title : "see-more"}
            className={`flex first:mt-0 mt-28 md:mt-40 ${
              stop.type === "seeMore" ? "justify-center" : stop.index % 2 === 0 ? "justify-start" : "justify-end"
            }`}
          >
            <div
              ref={(el) => {
                stopRefs.current[i] = el;
              }}
              style={stop.type === "project" ? { width: "clamp(260px, 42vw, 380px)" } : undefined}
            >
              {stop.type === "project" ? (
                <ProjectCard project={stop.project} index={stop.index} />
              ) : (
                <SeeMoreNode />
              )}
            </div>
          </div>
        ))}
      </div>

      <CursorFox containerRef={sectionRef} />
    </div>
  );
}
