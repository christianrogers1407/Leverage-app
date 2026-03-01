"use client";

import { cn } from "@/lib/utils";

export function Toggle(props: {
  left: string;
  right: string;
  value: "left" | "right";
  onChange: (v: "left" | "right") => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-white/5 border border-white/10 p-1">
      <button
        className={cn("px-3 py-1.5 text-xs rounded-lg", props.value === "left" ? "bg-white/10" : "text-muted")}
        onClick={() => props.onChange("left")}
        type="button"
      >
        {props.left}
      </button>
      <button
        className={cn("px-3 py-1.5 text-xs rounded-lg", props.value === "right" ? "bg-white/10" : "text-muted")}
        onClick={() => props.onChange("right")}
        type="button"
      >
        {props.right}
      </button>
    </div>
  );
}
