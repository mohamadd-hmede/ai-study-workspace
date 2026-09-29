"use client";

import { useEffect, useRef, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";

import type { Material } from "@/types/material";

import { generateMaterialSummary } from "@/lib/material-summary";

import "katex/dist/katex.min.css";

import { Download, FileText, Info, RefreshCw } from "lucide-react";

type MaterialSummaryProps = {
  material: Material;
  initialGeneration?: boolean;
  onGenerated?: (generatedAt: number) => void;
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

export default function MaterialSummary({
  material,
  initialGeneration = false,
  onGenerated,
}: MaterialSummaryProps) {
  const summaryContainerRef = useRef<HTMLDivElement | null>(null);

  const [summary, setSummary] = useState<string | null>(null);

  const [generatingSummary, setGeneratingSummary] = useState(initialGeneration);

  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!initialGeneration) {
      return;
    }

    let isActive = true;

    const generateInitialSummary = async () => {
      try {
        const generatedSummary = await generateMaterialSummary(material);

        if (isActive) {
          setSummary(generatedSummary);
          onGenerated?.(Date.now());
        }
      } catch {
        if (isActive) {
          setSummaryError("Failed to generate summary. Please try again.");
        }
      } finally {
        if (isActive) {
          setGeneratingSummary(false);
        }
      }
    };

    void generateInitialSummary();

    return () => {
      isActive = false;
    };
  }, [initialGeneration, material, onGenerated]);

  const handleGenerateSummary = async () => {
    if (generatingSummary) {
      return;
    }

    setGeneratingSummary(true);
    setSummaryError(null);

    try {
      const generatedSummary = await generateMaterialSummary(material);

      setSummary(generatedSummary);
      onGenerated?.(Date.now());
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
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {!summary ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>

            {generatingSummary ? (
              <>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">
                  Generating Summary...
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  AI is analyzing {material.name} and preparing your summary.
                </p>

                <div className="mt-5 h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
              </>
            ) : summaryError ? (
              <>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">
                  Couldn&apos;t generate summary
                </h2>

                <p className="mt-2 max-w-md text-sm text-red-600">
                  {summaryError}
                </p>

                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Try Again
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Summary
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  A concise summary generated from {material.name}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${generatingSummary ? "animate-spin" : ""}`}
                />
                {generatingSummary ? "Regenerating..." : "Regenerate Summary"}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {downloadingPdf ? "Downloading..." : "Download PDF"}
              </button>
            </div>
          </div>

          {summaryError && (
            <p className="mx-5 mt-4 text-sm text-red-600">{summaryError}</p>
          )}

          <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

            <p className="text-sm leading-5 text-slate-600">
              This summary is temporary and isn&apos;t saved. Download it if you
              want to keep a copy before leaving or refreshing this page.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div
              ref={summaryContainerRef}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-6 text-slate-700 sm:px-7"
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-6 text-2xl font-bold text-slate-950">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-4 mt-7 rounded-lg bg-blue-50 px-4 py-3 text-base font-semibold text-blue-900 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-5 text-base font-semibold text-slate-900">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 text-sm leading-7 text-slate-600">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 list-disc space-y-2 pl-6">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 list-decimal space-y-2 pl-6">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-7">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900">
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
                    <thead className="bg-slate-100">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="border border-slate-200 px-4 py-3 font-semibold text-slate-900">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-slate-200 px-4 py-3 text-slate-700">
                      {children}
                    </td>
                  ),
                  img: () => null,
                }}
              >
                {summary}
              </ReactMarkdown>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
