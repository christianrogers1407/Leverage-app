import { cn } from "@/lib/utils";

export function Card(props: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-panel/80 border border-white/5 p-4 shadow-sm", props.className)}>
      {props.title ? <div className="text-sm text-muted mb-2">{props.title}</div> : null}
      {props.children}
    </div>
  );
}
