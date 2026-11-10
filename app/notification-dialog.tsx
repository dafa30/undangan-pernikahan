"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CircleAlert, Heart } from "lucide-react";

export type Notification = {
  title: string;
  message?: string;
  kind: "success" | "error";
};

export function NotificationDialog({
  notification,
  onClose,
}: {
  notification: Notification | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (notification && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [notification]);

  const Icon = notification?.kind === "success" ? Heart : CircleAlert;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          dialogRef.current?.close();
        }
      }}
      aria-labelledby="notification-title"
      aria-describedby={notification?.message ? "notification-message" : undefined}
      className="m-auto w-[calc(100%-3rem)] max-w-sm overflow-visible rounded-4xl bg-transparent p-0 text-center backdrop:bg-[#1c2918]/60 backdrop:backdrop-blur-sm"
    >
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20, scale: shouldReduceMotion ? 1 : 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative overflow-hidden rounded-4xl border border-[#dce8d4] bg-[#fafaf8] px-8 py-10 shadow-2xl"
        >
          <div className="pointer-events-none absolute inset-2 rounded-[1.65rem] border border-[#e5eee0]" />
          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e5eee0] text-[#678254]">
            <Icon size={28} fill={notification.kind === "success" ? "currentColor" : "none"} aria-hidden="true" />
          </div>
          <h2 id="notification-title" className="relative text-2xl font-serif text-[#2b3824]">
            {notification.title}
          </h2>
          {notification.message && (
            <p id="notification-message" className="relative mt-3 text-sm leading-relaxed text-[#678254]">
              {notification.message}
            </p>
          )}
          <form method="dialog" className="relative mt-8">
            <button type="submit" autoFocus className="rounded-full bg-[#37482d] px-8 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#455a38] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#678254]">
              Tutup
            </button>
          </form>
        </motion.div>
      )}
    </dialog>
  );
}
