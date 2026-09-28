import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageTitle, Panel, Stat, useDashboard, shortDay, num, adminInput } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;
const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 } };

function DashboardPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useDashboard(days);
  if (error) return <p>Não foi possível carregar o dashboard.</p>;
  if (isLoading || !data) return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />)}</div>;

  const avg = data.total_videos ? Math.round(data.total_views / data.total_videos) : 0;
  const topVideo = data.top_videos[0];
  const topCat = data.top_categories[0];
  const vs = data.visitors_series.map((d) => ({ ...d, day: shortDay(d.day) }));
  const vv = data.video_views_series.map((d) => ({ ...d, day: shortDay(d.day) }));
  const su = data.signups_series.map((d) => ({ ...d, day: shortDay(d.day) }));

  return (
    <>
      <PageTitle
        title="Dashboard"
        subtitle="Visão geral da plataforma"
        action={
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={adminInput}>
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Visitantes (total)" value={num(data.total_visitors)} />
        <Stat label="Visitantes hoje" value={num(data.visitors_today)} />
        <Stat label="Visitantes na semana" value={num(data.visitors_week)} />
        <Stat label="Usuários cadastrados" value={num(data.total_users)} />
        <Stat label="Total de vídeos" value={num(data.total_videos)} />
        <Stat label="Visualizações de vídeos" value={num(data.total_views)} />
        <Stat label="Média por vídeo" value={num(avg)} hint="visualizações" />
        <Stat label="Comentários" value={num(data.total_comments)} />
        <Stat label="Vídeo mais visto" value={topVideo ? num(topVideo.views) : "—"} hint={topVideo?.title} />
        <Stat label="Categoria mais vista" value={topCat?.name ?? "—"} hint={topCat ? `${num(topCat.views)} visualizações` : undefined} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Visitantes ao longo do tempo">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={vs}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" {...axis} /><YAxis {...axis} width={36} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="visitors" name="Visitantes" stroke="var(--primary)" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Visualizações de vídeos ao longo do tempo">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={vv}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" {...axis} /><YAxis {...axis} width={36} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="views" name="Visualizações" stroke="var(--foreground)" fill="var(--accent)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Vídeos mais vistos">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.top_videos} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" {...axis} /><YAxis type="category" dataKey="title" {...axis} width={130} tickFormatter={(t: string) => (t.length > 18 ? t.slice(0, 18) + "…" : t)} />
                <Tooltip {...tip} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="views" name="Visualizações" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Categorias mais vistas">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.top_categories}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" {...axis} /><YAxis {...axis} width={44} />
                <Tooltip {...tip} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="views" name="Visualizações" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Novos cadastros">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={su}>
                <XAxis dataKey="day" {...axis} /><YAxis {...axis} width={28} allowDecimals={false} />
                <Tooltip {...tip} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="users" name="Cadastros" fill="var(--foreground)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Usuários mais ativos">
          {data.active_users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não há comentários de usuários.</p>
          ) : (
            <ul className="space-y-3">
              {data.active_users.map((u, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{u.display_name ?? u.email}</span>
                  <span className="shrink-0 text-muted-foreground">{u.comments} comentários</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
