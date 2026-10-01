"use client";

import { useEffect, useRef, useState } from "react";

import { puter } from "@heyputer/puter.js";

import type { WorkBook } from "xlsx";

import type { Material } from "@/types/material";

import type { PptxViewer as PptxViewerType } from "@aiden0z/pptx-renderer";

import { getMaterialFileCapability } from "@/lib/material-file-capabilities";

import { getMaterialFileLabel } from "@/components/materials/MaterialFileIcon";

type MaterialPreviewProps = {
  material: Material;
};

type SpreadsheetCell = string | number | boolean | null;

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];

  let row: string[] = [];

  let cell = "";

  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        cell += '"';

        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(cell);

      cell = "";

      continue;
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(cell);

      if (row.some((value) => value.trim())) {
        rows.push(row);
      }

      row = [];

      cell = "";

      continue;
    }

    cell += character;
  }

  row.push(cell);

  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rows;
};

export default function MaterialPreview({ material }: MaterialPreviewProps) {
  const capability =
    material.capability ??
    getMaterialFileCapability(
      material.originalFileName || material.name,

      material.type,
    );

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [textContent, setTextContent] = useState<string | null>(null);

  const [workbook, setWorkbook] = useState<WorkBook | null>(null);

  const [spreadsheetRows, setSpreadsheetRows] = useState<SpreadsheetCell[][]>(
    [],
  );

  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);

  const [docxError, setDocxError] = useState(false);

  const [docxScale, setDocxScale] = useState(1);

  const [pptxBuffer, setPptxBuffer] = useState<ArrayBuffer | null>(null);

  const [pptxError, setPptxError] = useState(false);

  const [pptxZoom, setPptxZoom] = useState(100);

  const docxContainerRef = useRef<HTMLDivElement | null>(null);

  const pptxContainerRef = useRef<HTMLDivElement | null>(null);

  const pptxViewerRef = useRef<PptxViewerType | null>(null);

  const zoomOut = () => {
    setDocxScale((current) => Math.max(0.5, current - 0.1));
  };

  const zoomIn = () => {
    setDocxScale((current) => Math.min(2, current + 0.1));
  };

  const pptxZoomOut = async () => {
    const viewer = pptxViewerRef.current;

    if (!viewer) {
      return;
    }

    const nextZoom = Math.max(50, pptxZoom - 10);

    await viewer.setZoom(nextZoom);

    setPptxZoom(nextZoom);
  };

  const pptxZoomIn = async () => {
    const viewer = pptxViewerRef.current;

    if (!viewer) {
      return;
    }

    const nextZoom = Math.min(200, pptxZoom + 10);

    await viewer.setZoom(nextZoom);

    setPptxZoom(nextZoom);
  };

  useEffect(() => {
    let objectUrl: string | null = null;

    let isActive = true;

    const loadPreview = async () => {
      try {
        setLoading(true);

        setError(null);

        setTextContent(null);

        setWorkbook(null);

        setActiveSheet(null);

        setSpreadsheetRows([]);

        setDocxBlob(null);

        setDocxError(false);

        setDocxScale(1);

        setPptxBuffer(null);

        setPptxError(false);

        setPptxZoom(100);

        const file = await puter.fs.read(material.path);

        if (!isActive) {
          return;
        }

        const typedFile = new Blob([file], {
          type:
            capability?.previewStrategy === "pdf"
              ? "application/pdf"
              : material.type || "application/octet-stream",
        });

        if (
          capability?.previewStrategy === "text" ||
          capability?.previewStrategy === "code" ||
          capability?.previewStrategy === "table"
        ) {
          const text = await typedFile.text();

          if (!isActive) {
            return;
          }

          setTextContent(text);
        }

        if (capability?.previewStrategy === "spreadsheet") {
          const arrayBuffer = await typedFile.arrayBuffer();

          if (!isActive) {
            return;
          }

          const XLSX = await import("xlsx");

          const parsedWorkbook = XLSX.read(arrayBuffer, {
            type: "array",
          });

          if (!isActive) {
            return;
          }

          const firstSheetName = parsedWorkbook.SheetNames[0] ?? null;

          setWorkbook(parsedWorkbook);

          setActiveSheet(firstSheetName);

          if (firstSheetName) {
            const firstSheet = parsedWorkbook.Sheets[firstSheetName];

            const rows = XLSX.utils.sheet_to_json<SpreadsheetCell[]>(
              firstSheet,

              {
                header: 1,

                defval: "",

                raw: false,
              },
            );

            setSpreadsheetRows(rows);
          }
        }

        if (capability?.previewStrategy === "docx") {
          setDocxBlob(typedFile);
        }

        if (capability?.previewStrategy === "pptx") {
          const arrayBuffer = await typedFile.arrayBuffer();

          if (!isActive) {
            return;
          }

          setPptxBuffer(arrayBuffer);
        }

        objectUrl = URL.createObjectURL(typedFile);

        setPreviewUrl(objectUrl);
      } catch (error) {
        console.error("Material preview error:", error);

        if (isActive) {
          setError("Failed to load material preview.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadPreview();

    return () => {
      isActive = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    material.path,

    material.type,

    material.name,

    material.originalFileName,

    capability?.previewStrategy,
  ]);

  useEffect(() => {
    const renderDocx = async () => {
      if (!docxBlob || !docxContainerRef.current) {
        return;
      }

      try {
        const container = docxContainerRef.current;

        container.innerHTML = "";

        const { renderAsync } = await import("docx-preview");

        await renderAsync(docxBlob, container, undefined, {
          className: "docx",

          inWrapper: true,
        });

        const wrapper = container.querySelector(
          ".docx-wrapper",
        ) as HTMLElement | null;

        if (wrapper) {
          wrapper.style.alignItems = "flex-start";

          wrapper.style.width = "fit-content";

          wrapper.style.minWidth = "100%";
        }

        const renderedPage = container.querySelector(
          "section.docx",
        ) as HTMLElement | null;

        if (!renderedPage) {
          return;
        }

        const parentWidth = container.parentElement?.clientWidth ?? 0;

        const pageWidth = renderedPage.offsetWidth;

        if (parentWidth > 0 && pageWidth > 0) {
          const scale = Math.min(1, parentWidth / pageWidth);

          setDocxScale(scale);
        }
      } catch {
        setDocxError(true);
      }
    };

    void renderDocx();
  }, [docxBlob]);

  useEffect(() => {
    if (!pptxBuffer || !pptxContainerRef.current) {
      return;
    }

    let cancelled = false;

    const renderPptx = async () => {
      try {
        setPptxError(false);

        const container = pptxContainerRef.current;

        if (!container) {
          return;
        }

        container.innerHTML = "";

        const { PptxViewer, RECOMMENDED_ZIP_LIMITS } =
          await import("@aiden0z/pptx-renderer");

        if (cancelled) {
          return;
        }

        const viewer = await PptxViewer.open(pptxBuffer, container, {
          fitMode: "contain",

          zoomPercent: 100,

          zipLimits: RECOMMENDED_ZIP_LIMITS,

          lazySlides: true,

          lazyMedia: true,

          listOptions: {
            windowed: true,

            initialSlides: 4,

            batchSize: 4,
          },
        });

        if (cancelled) {
          viewer.destroy();

          return;
        }

        pptxViewerRef.current = viewer;

        setPptxZoom(viewer.zoomPercent);
      } catch {
        if (!cancelled) {
          setPptxError(true);
        }
      }
    };

    void renderPptx();

    return () => {
      cancelled = true;

      if (pptxViewerRef.current) {
        pptxViewerRef.current.destroy();

        pptxViewerRef.current = null;
      }
    };
  }, [pptxBuffer]);

  if (loading) {
    const loadingHeight =
      capability?.previewStrategy === "pdf"
        ? "h-[520px] xl:h-[650px]"
        : "min-h-96";

    return (
      <div className={`flex items-center justify-center ${loadingHeight}`}>
        <p className="text-sm text-gray-500">Loading preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!previewUrl) {
    return null;
  }

  if (capability?.previewStrategy === "pdf") {
    return (
      <div className="h-[520px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 xl:h-[650px]">
        <iframe
          src={previewUrl}
          title={material.name}
          className="h-full w-full"
        />
      </div>
    );
  }

  if (capability?.previewStrategy === "image") {
    return (
      <div className="flex h-[520px] items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-white xl:h-[650px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={material.name}
          className="max-h-[600px] max-w-full rounded-lg object-contain"
        />
      </div>
    );
  }

  if (capability?.previewStrategy === "text" && textContent !== null) {
    return (
      <pre
        dir="auto"
        className="h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700 xl:h-[650px]"
      >
        {textContent}
      </pre>
    );
  }

  if (capability?.previewStrategy === "code" && textContent !== null) {
    const fileLabel = getMaterialFileLabel(material);

    return (
      <div className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 xl:h-[650px]">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
          <span className="text-xs font-medium text-slate-400">
            {material.name}
          </span>

          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {fileLabel}
          </span>
        </div>
        <pre
          dir="ltr"
          className="min-h-0 flex-1 overflow-auto p-4 text-left font-mono text-sm leading-6 text-slate-100"
        >
          <code>{textContent}</code>
        </pre>
      </div>
    );
  }

  if (capability?.previewStrategy === "table" && textContent !== null) {
    const rows = parseCsv(textContent);

    if (rows.length === 0) {
      return (
        <div className="flex min-h-96 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-500">
            This CSV file does not contain any readable rows.
          </p>
        </div>
      );
    }

    const headers = rows[0];

    const dataRows = rows.slice(1);

    return (
      <div className="h-[520px] overflow-auto rounded-xl border border-slate-200 bg-white xl:h-[650px]">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="whitespace-nowrap border-b border-r border-slate-200 px-4 py-3 text-left font-semibold text-slate-900 last:border-r-0"
                >
                  {header || `Column ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {dataRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition hover:bg-slate-50">
                {headers.map((_, columnIndex) => (
                  <td
                    key={columnIndex}
                    className="whitespace-nowrap border-b border-r border-slate-100 px-4 py-3 text-slate-700 last:border-r-0"
                  >
                    {row[columnIndex] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (
    capability?.previewStrategy === "spreadsheet" &&
    workbook &&
    activeSheet
  ) {
    const rows = spreadsheetRows;

    const columnCount = rows.reduce(
      (largest, row) => Math.max(largest, row.length),

      0,
    );

    return (
      <div className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white xl:h-[650px]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
          <p className="truncate text-xs font-medium text-slate-500">
            {material.name}
          </p>

          <p className="ml-4 shrink-0 text-xs text-slate-400">
            {rows.length} rows · {columnCount} columns
          </p>
        </div>
        {workbook.SheetNames.length > 1 && (
          <div className="flex overflow-x-auto border-b border-slate-200 bg-white">
            {workbook.SheetNames.map((sheetName) => {
              const isActive = sheetName === activeSheet;

              return (
                <button
                  key={sheetName}
                  type="button"
                  onClick={async () => {
                    const XLSX = await import("xlsx");

                    const sheet = workbook.Sheets[sheetName];

                    if (!sheet) {
                      return;
                    }

                    const rows = XLSX.utils.sheet_to_json<SpreadsheetCell[]>(
                      sheet,
                      {
                        header: 1,
                        defval: "",
                        raw: false,
                      },
                    );

                    setActiveSheet(sheetName);

                    setSpreadsheetRows(rows);
                  }}
                  className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {sheetName}
                </button>
              );
            })}
          </div>
        )}
        {rows.length === 0 || columnCount === 0 ? (
          <div className="flex min-h-96 items-center justify-center">
            <p className="text-sm text-slate-500">
              This spreadsheet sheet is empty.
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.from({ length: columnCount }).map(
                      (_, columnIndex) => (
                        <td
                          key={columnIndex}
                          className={`min-w-32 whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 text-slate-700 ${
                            rowIndex === 0
                              ? "sticky top-0 z-10 bg-slate-100 font-semibold text-slate-900"
                              : "bg-white"
                          }`}
                        >
                          {String(row[columnIndex] ?? "")}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (capability?.previewStrategy === "docx") {
    if (docxError) {
      return (
        <div className="flex min-h-96 items-center justify-center">
          <p className="text-sm text-red-600">Could not render DOCX preview.</p>
        </div>
      );
    }

    return (
      <div className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-gray-100 xl:h-[650px]">
        <div className="flex items-center justify-end gap-2 border-b border-gray-200 bg-white px-3 py-2">
          <button
            type="button"
            onClick={zoomOut}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            −
          </button>

          <span className="min-w-14 text-center text-sm text-gray-600">
            {Math.round(docxScale * 100)}%
          </span>

          <button
            type="button"
            onClick={zoomIn}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            +
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div
            style={{
              zoom: docxScale,
            }}
          >
            <div ref={docxContainerRef} />
          </div>
        </div>
      </div>
    );
  }

  if (capability?.previewStrategy === "pptx") {
    if (pptxError) {
      return (
        <div className="flex min-h-96 items-center justify-center">
          <p className="text-sm text-red-600">Could not render PPTX preview.</p>
        </div>
      );
    }

    return (
      <div className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-gray-100 xl:h-[650px]">
        <div className="flex items-center justify-end gap-2 border-b border-gray-200 bg-white px-3 py-2">
          <button
            type="button"
            onClick={pptxZoomOut}
            disabled={pptxZoom <= 50}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>

          <span className="min-w-14 text-center text-sm text-gray-600">
            {pptxZoom}%
          </span>

          <button
            type="button"
            onClick={pptxZoomIn}
            disabled={pptxZoom >= 200}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div ref={pptxContainerRef} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-96 items-center justify-center rounded-lg bg-gray-50 p-6 text-center">
      <div>
        <p className="font-medium text-gray-900">Preview not available</p>

        <p className="mt-2 text-sm text-gray-500">
          This file type cannot be previewed directly in StudyFlow.
        </p>
      </div>
    </div>
  );
}
