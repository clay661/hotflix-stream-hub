import { Link } from "@tanstack/react-router";
import { type Video, fmtDate, fmtViews, getCat } from "@/lib/catalog";

export function VideoCard({ v }: { v: Video }) {
  return (
    <Link to="/video/$slug" params={{ slug: v.slug }} className="group block min-w-0">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        <img src={v.thumb} alt={v.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <span className="absolute bottom-2 right-2 rounded-md bg-background/85 px-1.5 py-0.5 text-xs font-semibold">{v.duration}</span>
      </div>
      <div className="mt-2.5 min-w-0">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">{v.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="text-primary">{getCat(v.category)?.name}</span> · {fmtViews(v.views)} views · {fmtDate(v.publishedAt)}
        </p>
      </div>
    </Link>
  );
}

export function VideoGrid({ items }: { items: Video[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-6 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((v) => <VideoCard key={v.slug} v={v} />)}
    </div>
  );
}

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
