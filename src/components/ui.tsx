"use client";

import BrandLettering from "./brand-lettering";

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

export const colors = [
  "#209b9d",
  "#ee725e",
  "#8da6ce",
  "#b679a9",
  "#c0bf50",
  "#efa83e",
];
export const colorStyle = (index: number): CSSProperties =>
  ({ "--accent": colors[index % colors.length] }) as CSSProperties;

export function Icon({ name, size = 24 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    number: <path d="M9 3 7 21M17 3l-2 18M4 9h16M3 15h16" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    back: <path d="m14 6-6 6 6 6" />,
    up: <path d="m6 14 6-6 6 6" />,
    down: <path d="m6 10 6 6 6-6" />,
    grip: <path d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01" />,
    sort: <path d="M8 20V4m-4 4 4-4 4 4M16 4v16m-4-4 4 4 4-4" />,
    next: <path d="m10 6 6 6-6 6" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    undo: (
      <>
        <path
          d="M9 5 4 10l5 5M4 10h9a6 6 0 0 1 0 12"
          transform="translate(0 -2)"
        />
      </>
    ),
    edit: (
      <>
        <path d="m15 4 5 5M4 20l5-1L20 8a2 2 0 0 0-4-4L5 15z" />
      </>
    ),
    trash: (
      <>
        <path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" />
      </>
    ),
    settings: (
      <>
        <path d="m9 3-.5 2.5-2 1.2L4 6l-2 3 2 1.8v2.4L2 15l2 3 2.5-.7 2 1.2L9 21h6l.5-2.5 2-1.2 2.5.7 2-3-2-1.8v-2.4L22 9l-2-3-2.5.7-2-1.2L15 3z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    cards: (
      <>
        <rect x="8" y="4" width="12" height="16" rx="2" />
        <path d="m8 6-5 1 2 15 11-1M12 9h4m-4 4h4" />
      </>
    ),
    crown: (
      <>
        <path d="m3 6 4 4 5-6 5 6 4-4-3 12H6zM7 21h10" />
      </>
    ),
    backspace: (
      <>
        <path d="M9 5h12v14H9L2 12zM12 10l4 4m0-4-4 4" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    repeat: (
      <>
        <path d="m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3" />
      </>
    ),
  };
  return (
    <svg
      width={Math.max(20, size)}
      height={Math.max(20, size)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.cards}
    </svg>
  );
}

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`brand ${small ? "brand-small" : ""}`}
      aria-label="Flip 7 Punkteblock"
    >
      {!small && (
        <div className="brand-fan" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      )}
      <BrandLettering />
      {!small && <div className="brand-ribbon">Dein Punkteblock.</div>}
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
  className = "",
  placement = "bottom",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  placement?: "bottom" | "menu";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const entrance = useRef<Animation | null>(null);
  const gesture = useRef<{
    start: number;
    time: number;
    distance: number;
  } | null>(null);
  const suppressClick = useRef(false);
  function dismiss() {
    if (closing.current) return;
    const dialog = ref.current;
    if (
      !dialog ||
      placement === "menu" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onClose();
      return;
    }
    closing.current = true;
    const animation = dialog.animate(
      [
        { transform: dialog.style.transform || "translateY(0)", opacity: 1 },
        { transform: "translateY(100%)", opacity: 0.5 },
      ],
      { duration: 160, easing: "ease-in", fill: "forwards" },
    );
    animation.finished
      .then(() => onClose())
      .catch(() => {
        closing.current = false;
      });
  }
  function resetGesture() {
    const dialog = ref.current;
    if (dialog && dialog.style.transform) {
      const from = dialog.style.transform;
      dialog.style.transform = "";
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        dialog.animate([{ transform: from }, { transform: "translateY(0)" }], {
          duration: 160,
          easing: "ease-out",
        });
    }
    gesture.current = null;
  }
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    if (
      dialog &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      entrance.current = dialog.animate(
        [
          { transform: "translateY(36px)", opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
    }
    (dialog?.querySelector(".sheet-heading") as HTMLElement)?.focus({
      preventScroll: true,
    });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      entrance.current?.cancel();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`sheet ${placement === "menu" ? "menu-popover" : ""} ${className}`}
      aria-labelledby="sheet-title"
      onFocusCapture={(event) => {
        if (event.target instanceof HTMLInputElement)
          entrance.current?.cancel();
      }}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div className="sheet-inner">
        {placement === "bottom" && (
          <button
            className="sheet-drag-handle"
            aria-label="Dialog nach unten schließen"
            onPointerDown={(event) => {
              suppressClick.current = false;
              gesture.current = {
                start: event.clientY,
                time: performance.now(),
                distance: 0,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!gesture.current || !ref.current) return;
              const distance = Math.max(
                0,
                event.clientY - gesture.current.start,
              );
              gesture.current.distance = distance;
              if (distance > 5) suppressClick.current = true;
              ref.current.style.transform = `translateY(${distance}px)`;
            }}
            onPointerUp={(event) => {
              const drag = gesture.current;
              if (!drag) return;
              event.currentTarget.releasePointerCapture(event.pointerId);
              if (
                drag.distance > 80 ||
                (drag.distance > 25 &&
                  drag.distance / Math.max(1, performance.now() - drag.time) >
                    0.6)
              )
                dismiss();
              else resetGesture();
              gesture.current = null;
            }}
            onPointerCancel={() => {
              suppressClick.current = true;
              resetGesture();
            }}
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              dismiss();
            }}
          >
            <span className="sheet-grip" />
          </button>
        )}
        <div className="sheet-heading" tabIndex={-1}>
          <h2 id="sheet-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Schließen"
            onClick={dismiss}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
