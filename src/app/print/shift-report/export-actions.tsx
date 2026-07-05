"use client";

import { useState } from "react";

export function ExportActions({ filename }: { filename: string }) {
  const [busy, setBusy] = useState(false);

  async function exportJpg() {
    setBusy(true);
    try {
      const { toJpeg } = await import("html-to-image");
      const node = document.getElementById("print-report")!;
      const dataUrl = await toJpeg(node, { quality: 0.95, backgroundColor: "#ffffff", pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${filename}.jpg`;
      link.href = dataUrl;
      link.click();
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf() {
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");
      const node = document.getElementById("print-report")!;
      const dataUrl = await toPng(node, { backgroundColor: "#ffffff", pixelRatio: 2 });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [img.width, img.height],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
      pdf.save(`${filename}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mb-4 flex w-[1200px] justify-end gap-3 print:hidden">
      <button
        onClick={exportJpg}
        disabled={busy}
        className="rounded-full border border-[#0f0f10] px-5 py-2 text-xs font-bold uppercase tracking-[1px] text-[#0f0f10] disabled:opacity-50"
      >
        {busy ? "Working..." : "Download JPG"}
      </button>
      <button
        onClick={exportPdf}
        disabled={busy}
        className="rounded-full bg-[#0f0f10] px-5 py-2 text-xs font-bold uppercase tracking-[1px] text-white disabled:opacity-50"
      >
        {busy ? "Working..." : "Download PDF"}
      </button>
    </div>
  );
}
