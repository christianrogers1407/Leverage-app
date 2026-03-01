export function TopNav(props: { title: string; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 bg-bg/70 backdrop-blur border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight">{props.title}</div>
        <div>{props.right}</div>
      </div>
    </div>
  );
}
