"use client";

import { useEffect, useRef, useState } from "react";
import { puter } from "@heyputer/puter.js";
import { renderAsync } from "docx-preview";

import type { Material } from "@/types/material";
import type { PptxViewer as PptxViewerType } from "@aiden0z/pptx-renderer";

type MaterialPreviewProps = {
  material: Material;
};

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const PPTX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export default function MaterialPreview({ material }: MaterialPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [textContent, setTextContent] = useState<string | null>(null);

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
          type: material.type || "application/octet-stream",
        });

        if (material.type === "text/plain") {
          const text = await typedFile.text();

          if (!isActive) {
            return;
          }

          setTextContent(text);
        }

        if (material.type === DOCX_MIME_TYPE) {
          setDocxBlob(typedFile);
        }

        if (material.type === PPTX_MIME_TYPE) {
          const arrayBuffer = await typedFile.arrayBuffer();

          if (!isActive) {
            return;
          }

          setPptxBuffer(arrayBuffer);
        }

        objectUrl = URL.createObjectURL(typedFile);

        setPreviewUrl(objectUrl);
      } catch {
        if (isActive) {
          setError("Failed to load material preview.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      isActive = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [material.path, material.type]);

  useEffect(() => {
    const renderDocx = async () => {
      if (!docxBlob || !docxContainerRef.current) {
        return;
      }

      try {
        const container = docxContainerRef.current;

        container.innerHTML = "";

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

    renderDocx();
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

    renderPptx();

    return () => {
      cancelled = true;

      if (pptxViewerRef.current) {
        pptxViewerRef.current.destroy();
        pptxViewerRef.current = null;
      }
    };
  }, [pptxBuffer]);

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
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

  if (material.type === "application/pdf") {
    return (
      <iframe
        src={previewUrl}
        title={material.name}
        className="h-[600px] w-full rounded-lg border border-gray-200"
      />
    );
  }

  if (material.type.startsWith("image/")) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={material.name}
          className="max-h-[600px] max-w-full rounded-lg object-contain"
        />
      </div>
    );
  }

  if (material.type === "text/plain" && textContent !== null) {
    return (
      <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
        {textContent}
      </pre>
    );
  }

  if (material.type === DOCX_MIME_TYPE) {
    if (docxError) {
      return (
        <div className="flex min-h-96 items-center justify-center">
          <p className="text-sm text-red-600">Could not render DOCX preview.</p>
        </div>
      );
    }

    return (
      <div className="rounded-lg bg-gray-100">
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

        <div className="max-h-[600px] overflow-auto p-4">
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

  if (material.type === PPTX_MIME_TYPE) {
    if (pptxError) {
      return (
        <div className="flex min-h-96 items-center justify-center">
          <p className="text-sm text-red-600">Could not render PPTX preview.</p>
        </div>
      );
    }

    return (
      <div className="rounded-lg bg-gray-100">
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

        <div className="max-h-[600px] overflow-auto p-4">
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
          This file type cannot be previewed directly in the browser.
        </p>
      </div>
    </div>
  );
}
