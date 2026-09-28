import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageTitle, Panel, Stat, useDashboard, shortDay, num, adminInput } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;
const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 } };
const pie = ["var(--primary)", "var(--foreground)", "var(--muted-foreground)", "var(--accent)"];

function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, error } = useDashboard(days);
  if (error) return <p>Não foi possível carregar os dados.</p>;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-card" />;
  const series = data.visitors_series.map((d) => ({ ...d, day: shortDay(d.day) }));
  return (
    <>
      <PageTitle
        title="Analytics"
        subtitle="Tráfego e comportamento dos visitantes"
        action={
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={adminInput}>
            <option value={7}>7 dias</option><option value={30}>30 dias</option><option value={90}>90 dias</option>
          </select>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Visualizações de página" value={num(data.page_views)} />
        <Stat label="Visitantes únicos" value={num(data.total_visitors)} />
        <Stat label="Páginas por sessão" value={data.avg_pages_per_session} />
        <Stat label="Visualizações de vídeos" value={num(data.total_views)} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Visitantes x páginas vistas" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={series}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" {...axis} /><YAxis {...axis} width={40} />
                <Tooltip {...tip} />
                <Line type="monotone" dataKey="views" name="Páginas vistas" stroke="var(--foreground)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="visitors" name="Visitantes" stroke="var(--primary)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Dispositivos">
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.devices} dataKey="total" nameKey="device" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {data.devices.map((_, i) => <Cell key={i} fill={pie[i % pie.length]} stroke="none" />)}
                </Pie>
                <Tooltip {...tip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {data.devices.map((d, i) => (
              <li key={d.device} className="flex justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: pie[i % pie.length] }} />{d.device}</span><span className="text-muted-foreground">{num(d.total)}</span></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Páginas mais acessadas" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.top_pages} layout="vertical">
                <XAxis type="number" {...axis} /><YAxis type="category" dataKey="path" {...axis} width={150} tickFormatter={(t: string) => (t.length > 22 ? t.slice(0, 22) + "…" : t)} />
                <Tooltip {...tip} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="total" name="Acessos" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Desempenho por categoria">
          <ul className="space-y-3 text-sm">
            {data.top_categories.map((c) => {
              const max = data.top_categories[0]?.views || 1;
              return (
                <li key={c.name}>
                  <div className="flex justify-between"><span>{c.name}</span><span className="text-muted-foreground">{num(c.views)}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${(c.views / max) * 100}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </>
  );
}
