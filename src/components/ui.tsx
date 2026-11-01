// Small shared pieces. Every new section should reuse these before making anything new.
import { useEffect, useRef, type ReactNode, type ButtonHTMLAttributes } from "react";

export function Button({ variant = "solid", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "link" }) {
  return <button {...p} className={`ui-btn ui-btn-${variant} ${className}`.trim()} />;
}

export function Card({ title, kicker, children, footer, className = "" }: { title?: ReactNode; kicker?: ReactNode; children?: ReactNode; footer?: ReactNode; className?: string }) {
  return (
    <section className={`ui-card ${className}`.trim()}>
      {kicker && <div className="ui-kicker">{kicker}</div>}
      {title && <h3 className="ui-card-title">{title}</h3>}
      {children}
      {footer && <div className="ui-card-foot">{footer}</div>}
    </section>
  );
}

/** Status tag. kind: conf, new, sharp, down, none (the Intel meanings). */
export function Tag({ kind = "none", children }: { kind?: string; children: ReactNode }) {
  return <span className={`tag t-${kind}`}>{children}</span>;
}

export function Tabs<T extends string>({ tabs, current, onChange, label, className = "" }: { tabs: { id: T; label: ReactNode }[]; current: T; onChange: (id: T) => void; label: string; className?: string }) {
  return (
    <nav role="tablist" aria-label={label} className={className}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" id={"tab-" + t.id} aria-selected={t.id === current} data-p={t.id} onClick={() => onChange(t.id)}>{t.label}</button>
      ))}
    </nav>
  );
}

export function Table({ head, rows, className }: { head: ReactNode[]; rows: { key?: string | number; cells: { content: ReactNode; className?: string }[] }[]; className?: string }) {
  return (
    <div className="tbl"><table className={className}>
      <tbody>
        <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
        {rows.map((r, i) => <tr key={r.key ?? i}>{r.cells.map((c, j) => <td key={j} className={c.className}>{c.content}</td>)}</tr>)}
      </tbody>
    </table></div>
  );
}

export function PriceLadder({ items }: { items: { value: string; label: string }[] }) {
  return <div className="price">{items.map((it, i) => <div key={i}><b>{it.value}</b><span>{it.label}</span></div>)}</div>;
}

export function Modal({ open, onClose, label, children, className = "" }: { open: boolean; onClose: () => void; label: string; children: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    document.addEventListener("keydown", onKey, true);
    const f = box.current?.querySelector<HTMLElement>("[data-autofocus], textarea, input, [data-close]");
    f?.focus();
    return () => { document.removeEventListener("keydown", onKey, true); prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={`lightbox ${className}`.trim()} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lbinner" ref={box}>{children}</div>
    </div>
  );
}
