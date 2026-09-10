"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMaterialById } from "@/lib/materials";
import type { Material } from "@/types/material";

export default function MaterialPage() {
  const params = useParams<{
    courseId: string;
    materialId: string;
  }>();

  const router = useRouter();

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getFileType = (fileName: string) => {
    const extension = fileName.split(".").pop();

    return extension ? extension.toUpperCase() : "FILE";
  };

  useEffect(() => {
    const loadMaterial = async () => {
      try {
        const currentMaterial = await getMaterialById(
          params.courseId,
          params.materialId,
        );

        if (!currentMaterial) {
          router.replace(`/courses/${params.courseId}`);
          return;
        }

        setMaterial(currentMaterial);
      } catch {
        setError("Failed to load material. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadMaterial();
  }, [params.courseId, params.materialId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading material...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!material) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/courses/${params.courseId}`}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Course
        </Link>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h1 className="text-3xl font-bold text-gray-900">{material.name}</h1>

          <p className="mt-3 text-gray-600">{getFileType(material.name)}</p>
        </div>
      </div>
    </main>
  );
}
