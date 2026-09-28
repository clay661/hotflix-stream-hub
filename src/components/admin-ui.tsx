import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      {title && <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 truncate font-display text-2xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const adminInput = "rounded-xl border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary";
export const adminBtn = "rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50";
export const ghostBtn = "rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-secondary";

export type Dashboard = {
  total_visitors: number; visitors_today: number; visitors_week: number; page_views: number;
  total_users: number; total_videos: number; total_views: number; total_comments: number;
  avg_pages_per_session: number;
  visitors_series: { day: string; visitors: number; views: number }[];
  video_views_series: { day: string; views: number }[];
  signups_series: { day: string; users: number }[];
  top_videos: { title: string; slug: string; views: number }[];
  top_categories: { name: string; views: number }[];
  active_users: { display_name: string | null; email: string | null; comments: number }[];
  devices: { device: string; total: number }[];
  top_pages: { path: string; total: number }[];
};

export function useDashboard(days: number) {
  return useQuery({
    queryKey: ["admin-dashboard", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_dashboard", { _days: days });
      if (error) throw error;
      return data as unknown as Dashboard;
    },
  });
}

export const shortDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
export const num = (n: number) => n.toLocaleString("pt-BR");
