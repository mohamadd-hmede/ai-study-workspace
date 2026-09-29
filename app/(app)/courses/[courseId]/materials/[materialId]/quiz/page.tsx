"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { getMaterialById } from "@/lib/materials";

import type { Material } from "@/types/material";

import MaterialQuiz from "@/components/materials/MaterialQuiz";
import {
  getMaterialFileLabel,
  getMaterialFileStyle,
} from "@/components/materials/MaterialFileIcon";

export default function MaterialQuizPage() {
  const params = useParams<{
    courseId: string;
    materialId: string;
  }>();

  const searchParams = useSearchParams();
  const shouldGenerate = searchParams.get("generate") === "true";

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadMaterial = async () => {
      try {
        setLoading(true);
        setError(null);

        const foundMaterial = await getMaterialById(
          params.courseId,
          params.materialId,
        );

        if (!isActive) {
          return;
        }

        if (!foundMaterial) {
          setError("Material not found.");
          return;
        }

        setMaterial(foundMaterial);
      } catch (error) {
        console.error("Failed to load material:", error);

        if (isActive) {
          setError("Failed to load material.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadMaterial();

    return () => {
      isActive = false;
    };
  }, [params.courseId, params.materialId]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(timestamp));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <p className="text-sm text-slate-500">Loading quiz...</p>
      </main>
    );
  }

  if (error || !material) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <p className="text-sm text-red-600">{error ?? "Material not found."}</p>
      </main>
    );
  }

  const fileStyle = getMaterialFileStyle(material);
  const FileIcon = fileStyle.icon;
  const fileLabel = getMaterialFileLabel(material);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <Link
          href={`/courses/${params.courseId}/materials/${params.materialId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {material.name}
        </Link>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${fileStyle.className}`}
            >
              <FileIcon className="h-7 w-7" strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {material.name}
              </h1>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
                <span>{fileLabel}</span>

                <span aria-hidden="true">•</span>

                <span>{formatFileSize(material.size)}</span>

                <span aria-hidden="true">•</span>

                <span>Added {formatDate(material.createdAt)}</span>
              </div>
            </div>
          </div>

          <Link
            href={`/courses/${params.courseId}/materials/${params.materialId}`}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:self-auto"
          >
            <ExternalLink className="h-4 w-4" />
            View Material
          </Link>
        </div>

        <div className="mt-6">
          <MaterialQuiz
            key={`${material.id}-${shouldGenerate}`}
            material={material}
            initialGeneration={shouldGenerate}
          />
        </div>
      </div>
    </main>
  );
}
