import { supabase } from "@/integrations/supabase/client";

function sessionId() {
  let id = sessionStorage.getItem("hf_session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("hf_session", id);
  }
  return id;
}

function device() {
  const w = window.innerWidth;
  return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

export function trackPageView(path: string) {
  if (path.startsWith("/admin")) return;
  let ref = "direto";
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      if (host !== location.hostname) ref = host;
    }
  } catch {}
  void supabase.rpc("track_page_view", { _path: path, _session: sessionId(), _device: device(), _referrer: ref }).then(() => {});
}

const seen = new Map<string, number>();
export function trackVideoView(videoId: string) {
  const last = seen.get(videoId) ?? 0;
  if (Date.now() - last < 5000) return;
  seen.set(videoId, Date.now());
  void supabase.rpc("track_video_view", { _video: videoId, _session: sessionId() }).then(() => {});
}
