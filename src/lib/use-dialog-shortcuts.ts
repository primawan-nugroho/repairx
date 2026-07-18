"use client";

import { useEffect } from "react";

/** Esc closes the dialog, Ctrl/Cmd+Enter submits it — the two shortcuts a
 * keyboard-driven data-entry user reaches for first. Shared across the order,
 * shift-entry, and repair-planner dialogs so the behavior stays consistent. */
export function useDialogShortcuts(
  formRef: React.RefObject<HTMLFormElement | null>,
  onClose: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [formRef, onClose, enabled]);
}
