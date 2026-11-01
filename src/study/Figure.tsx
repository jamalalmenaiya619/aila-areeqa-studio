import { PHOTOS } from "../lib/content";

/** A photo with its caption and credit line (by, license, source link), exactly like the old fig(). */
export function Fig({ k, caption, className = "" }: { k: string; caption: string; className?: string }) {
  const p = PHOTOS[k] || ({} as { by?: string; lic?: string; page?: string });
  return (
    <figure className={className || undefined}>
      <div className="frame"><img src={`/img/${k}.jpg`} alt={caption} loading="lazy" /></div>
      <figcaption>{caption}<span className="cr">Photo: {p.by || ""} · {p.lic || ""} · <a href={p.page || "#"} target="_blank" rel="noopener">source</a></span></figcaption>
    </figure>
  );
}
export function Srcs({ list }: { list?: [string, string][] }) {
  if (!list || !list.length) return null;
  return <div className="srcs"><span>Sources</span>{list.map(([t, u], i) => <a key={i} href={u} target="_blank" rel="noopener">{t}</a>)}</div>;
}
