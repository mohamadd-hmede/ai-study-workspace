"use client";

import Link from "next/link";
import { useState } from "react";
import type { Material } from "@/types/material";
import { deleteMaterial } from "@/lib/materials";

type MaterialListProps = {
  materials: Material[];
  onMaterialDeleted: (materialId: string) => void;
};

const getFileType = (fileName: string) => {
  const extension = fileName.split(".").pop();

  return extension ? extension.toUpperCase() : "FILE";
};

export default function MaterialList({
  materials,
  onMaterialDeleted,
}: MaterialListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (material: Material) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${material.name}"?`,
    );

    if (!confirmed) return;

    setDeletingId(material.id);
    setError(null);

    try {
      const deleted = await deleteMaterial(material);

      if (!deleted) {
        setError("Material could not be deleted. Please try again.");
        return;
      }

      onMaterialDeleted(material.id);
    } catch {
      setError("Failed to delete material. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (materials.length === 0) {
    return <p className="text-sm text-gray-500">No materials uploaded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {materials.map((material) => (
        <div
          key={material.id}
          className="rounded-lg border border-gray-200 p-4"
        >
          <p className="font-medium text-gray-900">{material.name}</p>

          <p className="mt-1 text-sm text-gray-500">
            {getFileType(material.name)}
          </p>

          <div className="mt-3 flex gap-3">
            <Link
              href={`/courses/${material.courseId}/materials/${material.id}`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Open
            </Link>

            <button
              onClick={() => handleDelete(material)}
              disabled={deletingId === material.id}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deletingId === material.id ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
