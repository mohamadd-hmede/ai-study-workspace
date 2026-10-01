"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { getMaterialById } from "@/lib/materials";
import { getCourseById } from "@/lib/courses";

import type { Material } from "@/types/material";
import type { Course } from "@/types/course";

import MaterialSummary from "@/components/materials/MaterialSummary";
import {
  getMaterialFileLabel,
  getMaterialFileStyle,
} from "@/components/materials/MaterialFileIcon";

export default function MaterialSummaryPage() {
  const params = useParams<{
    courseId: string;
    materialId: string;
  }>();

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "details">("summary");
  const [course, setCourse] = useState<Course | null>(null);

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

        const foundCourse = await getCourseById(params.courseId);

        if (isActive) {
          setCourse(foundCourse);
        }
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

  const formatGeneratedAt = (timestamp: number) => {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestamp));
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
        <p className="text-sm text-slate-500">Loading summary...</p>
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
              <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
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
            Open Material
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-b border-slate-200 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`px-1 pb-3 text-sm font-semibold ${
                activeTab === "summary"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-500"
              }`}
            >
              Summary
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`px-1 pb-3 text-sm font-semibold ${
                activeTab === "details"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-500"
              }`}
            >
              Details
            </button>
          </div>

          {generatedAt && (
            <div className="flex flex-wrap items-center gap-3 pb-3">
              <span className="text-xs text-slate-500">
                Generated on {formatGeneratedAt(generatedAt)}
              </span>

              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                AI Generated
              </span>
            </div>
          )}
        </div>

        <div className="mt-5">
          <div className={activeTab === "summary" ? "block" : "hidden"}>
            <MaterialSummary
              key={material.id}
              material={material}
              initialGeneration
              onGenerated={setGeneratedAt}
            />
          </div>

          <div className={activeTab === "details" ? "block" : "hidden"}>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Material Details
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Material name
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {material.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Course
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {course?.title ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    File type
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {fileLabel}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    File size
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {formatFileSize(material.size)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Added
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {formatDate(material.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Original file
                </p>

                <p className="mt-1 break-all text-sm font-medium text-slate-700">
                  {material.originalFileName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
