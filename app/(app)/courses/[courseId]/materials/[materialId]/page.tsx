"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, ListChecks } from "lucide-react";

import { getMaterialById } from "@/lib/materials";

import type { Material } from "@/types/material";

import MaterialPreview from "@/components/materials/MaterialPreview";
import MaterialChat from "@/components/materials/MaterialChat";
import {
  getMaterialFileLabel,
  getMaterialFileStyle,
} from "@/components/materials/MaterialFileIcon";

export default function MaterialPage() {
  const params = useParams<{
    courseId: string;
    materialId: string;
  }>();

  const router = useRouter();

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(timestamp));
  };

  useEffect(() => {
    let isActive = true;

    const loadMaterial = async () => {
      try {
        const currentMaterial = await getMaterialById(
          params.courseId,
          params.materialId,
        );

        if (!isActive) {
          return;
        }

        if (!currentMaterial) {
          router.replace(`/courses/${params.courseId}`);
          return;
        }

        setMaterial(currentMaterial);
      } catch {
        if (isActive) {
          setError("Failed to load material. Please try again.");
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
  }, [params.courseId, params.materialId, router]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading material...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }

  if (!material) {
    return null;
  }

  const fileStyle = getMaterialFileStyle(material);
  const FileIcon = fileStyle.icon;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <Link
          href={`/courses/${params.courseId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course
        </Link>

        <div className="mt-5 flex items-center justify-between gap-4">
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
                <span>{getMaterialFileLabel(material)}</span>

                <span aria-hidden="true">•</span>

                <span>{formatFileSize(material.size)}</span>

                <span aria-hidden="true">•</span>

                <span>Added {formatDate(material.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="min-w-0">
            <MaterialPreview material={material} />
          </div>

          <div className="min-w-0">
            <MaterialChat material={material} />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <Link
              href={`/courses/${material.courseId}/materials/${material.id}/summary`}
              className="flex min-h-[120px] w-full items-center justify-center gap-4 rounded-xl border border-blue-100 bg-blue-50/70 px-6 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm"
            >
              <FileText
                className="h-8 w-8 shrink-0 text-blue-600"
                strokeWidth={2.2}
              />

              <div>
                <h2 className="font-semibold text-slate-900">
                  Generate Summary
                </h2>

                <p className="mt-0.5 text-sm text-slate-600">
                  Get a concise summary of this material
                </p>
              </div>
            </Link>
          </div>

          <div className="min-w-0 rounded-xl border border-emerald-100 bg-emerald-50/70 px-6 py-4">
            <div className="flex items-center gap-4">
              <ListChecks
                className="h-8 w-8 shrink-0 text-emerald-600"
                strokeWidth={2.2}
              />

              <div>
                <h2 className="font-semibold text-slate-900">Quiz</h2>

                <p className="mt-0.5 text-sm text-slate-600">
                  Test your knowledge of this material
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/courses/${material.courseId}/materials/${material.id}/quiz?generate=true`}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Generate Quiz
              </Link>

              <Link
                href={`/courses/${material.courseId}/materials/${material.id}/quiz`}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Quiz History
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
