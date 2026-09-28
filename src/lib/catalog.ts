export type Category = { slug: string; name: string; description: string };
export type Creator = { slug: string; name: string; bio: string; verified: boolean; avatar: string };
export type Video = {
  slug: string; title: string; description: string; duration: string; views: number;
  publishedAt: string; category: string; creator: string; tags: string[]; thumb: string;
};

export const categories: Category[] = [
  { slug: "viagens", name: "Viagens", description: "Destinos, roteiros e paisagens pelo mundo." },
  { slug: "esportes", name: "Esportes", description: "Treinos, competições e bastidores do esporte." },
  { slug: "musica", name: "Música", description: "Clipes, sessões ao vivo e bastidores musicais." },
  { slug: "tecnologia", name: "Tecnologia", description: "Reviews, tutoriais e novidades tech." },
  { slug: "estilo-de-vida", name: "Estilo de vida", description: "Rotinas, culinária, casa e bem-estar." },
  { slug: "entretenimento", name: "Entretenimento", description: "Humor, curiosidades e cultura pop." },
];

const avatar = (s: string) => `https://picsum.photos/seed/av-${s}/200/200`;
export const creators: Creator[] = [
  { slug: "rota-livre", name: "Rota Livre", bio: "Viajando o Brasil e o mundo com câmera na mão.", verified: true, avatar: avatar("rota") },
  { slug: "pulso-esportivo", name: "Pulso Esportivo", bio: "Análises e treinos para quem vive o esporte.", verified: true, avatar: avatar("pulso") },
  { slug: "estudio-som", name: "Estúdio Som", bio: "Sessões acústicas e produção musical.", verified: false, avatar: avatar("som") },
  { slug: "byte-lab", name: "Byte Lab", bio: "Tecnologia explicada sem complicação.", verified: true, avatar: avatar("byte") },
  { slug: "casa-e-sabor", name: "Casa & Sabor", bio: "Receitas simples e ideias para o dia a dia.", verified: false, avatar: avatar("casa") },
];

const titles: [string, string, string][] = [
  ["Pôr do sol na Chapada Diamantina", "viagens", "rota-livre"],
  ["Roteiro de 3 dias em Lisboa", "viagens", "rota-livre"],
  ["Treino funcional de 20 minutos", "esportes", "pulso-esportivo"],
  ["Os melhores lances da rodada", "esportes", "pulso-esportivo"],
  ["Sessão acústica ao entardecer", "musica", "estudio-som"],
  ["Como gravar voz em casa", "musica", "estudio-som"],
  ["Review: o notebook mais leve do ano", "tecnologia", "byte-lab"],
  ["Automatize sua casa com pouco dinheiro", "tecnologia", "byte-lab"],
  ["Pão caseiro em 5 passos", "estilo-de-vida", "casa-e-sabor"],
  ["Organização de cozinha pequena", "estilo-de-vida", "casa-e-sabor"],
  ["Curiosidades sobre o cinema clássico", "entretenimento", "byte-lab"],
  ["Trilha até o Pico da Bandeira", "viagens", "rota-livre"],
  ["Corrida de rua: guia para iniciantes", "esportes", "pulso-esportivo"],
  ["Bastidores de um show ao vivo", "musica", "estudio-som"],
  ["Montando um setup minimalista", "tecnologia", "byte-lab"],
  ["Café da manhã rápido e saudável", "estilo-de-vida", "casa-e-sabor"],
  ["Quiz de cultura pop em 10 perguntas", "entretenimento", "estudio-som"],
  ["Mergulho em Fernando de Noronha", "viagens", "rota-livre"],
];

const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const videos: Video[] = titles.map(([title, category, creator], i) => ({
  slug: slugify(title), title, category, creator,
  description: `${title}. Um vídeo de demonstração da Hotflix com conteúdo neutro para mostrar a experiência da plataforma.`,
  duration: `${4 + ((i * 7) % 18)}:${String((i * 13) % 60).padStart(2, "0")}`,
  views: 1200 + ((i * 7919) % 480000),
  publishedAt: new Date(Date.UTC(2026, 8, 26 - i * 2)).toISOString(),
  tags: [category, "demonstração", i % 2 ? "novo" : "destaque"],
  thumb: `https://picsum.photos/seed/hf-${i}/640/360`,
}));

export const byCat = (slug: string) => videos.filter((v) => v.category === slug);
export const byCreator = (slug: string) => videos.filter((v) => v.creator === slug);
export const getCat = (slug: string) => categories.find((c) => c.slug === slug);
export const getCreator = (slug: string) => creators.find((c) => c.slug === slug);
export const getVideo = (slug: string) => videos.find((v) => v.slug === slug);
export const mostViewed = () => [...videos].sort((a, b) => b.views - a.views);
export const newest = () => [...videos].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export const fmtViews = (n: number) =>
  n >= 1000 ? `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : String(n);
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
