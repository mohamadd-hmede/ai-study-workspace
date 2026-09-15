"use client";

import { useRef, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";

import type { Material } from "@/types/material";

import { generateMaterialSummary } from "@/lib/material-summary";

import "katex/dist/katex.min.css";

type MaterialSummaryProps = {
  material: Material;
};

const PDF_PAGE_WIDTH_MM = 210;
const PDF_PAGE_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 12;

const BREAK_SENSITIVE_SELECTOR = "h1, h2, h3, p, li, tr, .katex-display";

type UnsafeZone = {
  top: number;
  bottom: number;
};

function collectUnsafeZones(container: HTMLElement): UnsafeZone[] {
  const containerTop = container.getBoundingClientRect().top;

  const zones: UnsafeZone[] = [];

  container.querySelectorAll(BREAK_SENSITIVE_SELECTOR).forEach((element) => {
    const rect = element.getBoundingClientRect();

    zones.push({
      top: rect.top - containerTop,
      bottom: rect.bottom - containerTop,
    });
  });

  return zones.sort((a, b) => a.top - b.top);
}

function computeBreakPoints(
  totalHeightPx: number,
  pageHeightPx: number,
  unsafeZones: UnsafeZone[],
): number[] {
  const breakPoints = [0];

  let cursor = 0;

  while (cursor < totalHeightPx) {
    let nextBreak = Math.min(cursor + pageHeightPx, totalHeightPx);

    if (nextBreak < totalHeightPx) {
      const violatingZone = unsafeZones.find(
        (zone) => zone.top < nextBreak && zone.bottom > nextBreak,
      );

      if (violatingZone) {
        const zoneHeight = violatingZone.bottom - violatingZone.top;

        const canMoveWholeElement =
          zoneHeight < pageHeightPx && violatingZone.top > cursor + 1;

        if (canMoveWholeElement) {
          nextBreak = violatingZone.top;
        }
      }
    }

    if (nextBreak <= cursor) {
      nextBreak = Math.min(cursor + pageHeightPx, totalHeightPx);
    }

    breakPoints.push(nextBreak);

    cursor = nextBreak;
  }

  return breakPoints;
}

export default function MaterialSummary({ material }: MaterialSummaryProps) {
  const summaryContainerRef = useRef<HTMLDivElement | null>(null);

  const [summary, setSummary] = useState<string | null>(null);

  const [generatingSummary, setGeneratingSummary] = useState(false);

  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleGenerateSummary = async () => {
    if (generatingSummary) {
      return;
    }

    setGeneratingSummary(true);
    setSummaryError(null);

    try {
      const generatedSummary = await generateMaterialSummary(material);

      setSummary(generatedSummary);
    } catch {
      setSummaryError("Failed to generate summary. Please try again.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!summary || !summaryContainerRef.current || downloadingPdf) {
      return;
    }

    setDownloadingPdf(true);
    setSummaryError(null);

    try {
      const html2canvas = (await import("html2canvas-pro")).default;

      const { jsPDF } = await import("jspdf");

      const sourceElement = summaryContainerRef.current;

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const sourceRect = sourceElement.getBoundingClientRect();

      const sourceWidthPx = sourceRect.width;
      const totalHeightPx = sourceElement.scrollHeight;

      const contentWidthMm = PDF_PAGE_WIDTH_MM - PDF_MARGIN_MM * 2;

      const contentHeightMm = PDF_PAGE_HEIGHT_MM - PDF_MARGIN_MM * 2;

      const pxPerMm = sourceWidthPx / contentWidthMm;

      const pageHeightPx = contentHeightMm * pxPerMm;

      const unsafeZones = collectUnsafeZones(sourceElement);

      const breakPoints = computeBreakPoints(
        totalHeightPx,
        pageHeightPx,
        unsafeZones,
      );

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      for (let index = 0; index < breakPoints.length - 1; index++) {
        const sourceTop = breakPoints[index];

        const sourceBottom = breakPoints[index + 1];

        const sourceSliceHeight = sourceBottom - sourceTop;

        if (sourceSliceHeight <= 0) {
          continue;
        }

        const captureContainer = document.createElement("div");

        captureContainer.style.position = "fixed";
        captureContainer.style.left = "-10000px";
        captureContainer.style.top = "0";
        captureContainer.style.width = `${sourceWidthPx}px`;
        captureContainer.style.height = `${sourceSliceHeight}px`;
        captureContainer.style.overflow = "hidden";
        captureContainer.style.backgroundColor = "#ffffff";
        captureContainer.style.pointerEvents = "none";

        const clonedSummary = sourceElement.cloneNode(true) as HTMLElement;

        clonedSummary.removeAttribute("id");

        clonedSummary.style.width = `${sourceWidthPx}px`;

        clonedSummary.style.maxWidth = "none";
        clonedSummary.style.margin = "0";

        clonedSummary.style.transform = `translateY(-${sourceTop}px)`;

        clonedSummary.style.transformOrigin = "top left";

        captureContainer.appendChild(clonedSummary);

        document.body.appendChild(captureContainer);

        try {
          const canvas = await html2canvas(captureContainer, {
            scale: 2,
            width: sourceWidthPx,
            height: sourceSliceHeight,
            backgroundColor: "#ffffff",
            useCORS: true,
            logging: false,
          });

          const imageData = canvas.toDataURL("image/png");

          const imageHeightMm = sourceSliceHeight / pxPerMm;

          if (index > 0) {
            pdf.addPage();
          }

          pdf.addImage(
            imageData,
            "PNG",
            PDF_MARGIN_MM,
            PDF_MARGIN_MM,
            contentWidthMm,
            imageHeightMm,
          );
        } finally {
          captureContainer.remove();
        }
      }

      const fileName = material.name.replace(/\.[^/.]+$/, "");

      pdf.save(`${fileName}-summary.pdf`);
    } catch (error) {
      console.error("PDF download error:", error);

      setSummaryError("Failed to download summary as PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Summary</h2>

          <p className="mt-1 text-sm text-gray-500">
            Generate a study summary from this material.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={generatingSummary}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingSummary ? "Generating..." : "Generate Summary"}
          </button>

          {summary && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloadingPdf ? "Downloading..." : "Download PDF"}
            </button>
          )}
        </div>
      </div>

      {summaryError && (
        <p className="mt-4 text-sm text-red-600">{summaryError}</p>
      )}

      {summary && (
        <div
          ref={summaryContainerRef}
          className="mx-auto mt-6 max-w-4xl rounded-xl border border-gray-200 bg-white px-6 py-6 text-gray-700 shadow-sm"
        >
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-6 text-2xl font-bold text-gray-900">
                  {children}
                </h1>
              ),

              h2: ({ children }) => (
                <h2 className="mb-3 mt-8 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900">
                  {children}
                </h2>
              ),

              h3: ({ children }) => (
                <h3 className="mb-2 mt-5 text-lg font-semibold text-gray-900">
                  {children}
                </h3>
              ),

              p: ({ children }) => <p className="mb-3 leading-7">{children}</p>,

              ul: ({ children }) => (
                <ul className="mb-4 list-disc space-y-2 pl-6">{children}</ul>
              ),

              ol: ({ children }) => (
                <ol className="mb-4 list-decimal space-y-2 pl-6">{children}</ol>
              ),

              li: ({ children }) => <li className="leading-7">{children}</li>,

              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900">
                  {children}
                </strong>
              ),

              table: ({ children }) => (
                <div className="my-5 overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    {children}
                  </table>
                </div>
              ),

              thead: ({ children }) => (
                <thead className="bg-gray-100">{children}</thead>
              ),

              th: ({ children }) => (
                <th className="border border-gray-200 px-4 py-3 font-semibold text-gray-900">
                  {children}
                </th>
              ),

              td: ({ children }) => (
                <td className="border border-gray-200 px-4 py-3 text-gray-700">
                  {children}
                </td>
              ),

              img: () => null,
            }}
          >
            {summary}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
