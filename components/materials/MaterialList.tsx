"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, MoreVertical } from "lucide-react";
import {
  getMaterialFileLabel,
  getMaterialFileStyle,
} from "@/components/materials/MaterialFileIcon";
import type { Material } from "@/types/material";
import { deleteMaterial, renameMaterial } from "@/lib/materials";

type MaterialListProps = {
  materials: Material[];
  onMaterialDeleted: (materialId: string) => void;
  onMaterialRenamed: (material: Material) => void;
};

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

export default function MaterialList({
  materials,
  onMaterialDeleted,
  onMaterialRenamed,
}: MaterialListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renamingMaterial, setRenamingMaterial] = useState<Material | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const openRename = (material: Material) => {
    setRenamingMaterial(material);
    setRenameValue(material.name);
    setOpenMenuId(null);
    setError(null);
  };

  const handleRename = async () => {
    if (!renamingMaterial || !renameValue.trim() || isRenaming) {
      return;
    }

    if (renameValue.trim() === renamingMaterial.name) {
      setRenamingMaterial(null);
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      const updatedMaterial = await renameMaterial(
        renamingMaterial,
        renameValue,
      );

      onMaterialRenamed(updatedMaterial);
      setRenamingMaterial(null);
      setRenameValue("");
    } catch {
      setError("Failed to rename material. Please try again.");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async (material: Material) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${material.name}"?`,
    );

    if (!confirmed) return;

    setDeletingId(material.id);
    setOpenMenuId(null);
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
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <FileText className="mx-auto h-8 w-8 text-slate-400" />

        <p className="mt-3 text-sm font-medium text-slate-900">
          No materials found
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Upload a material or try a different search.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {materials.map((material) => {
          const fileStyle = getMaterialFileStyle(material);
          const FileIcon = fileStyle.icon;

          return (
            <article
              key={material.id}
              className="relative flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${fileStyle.className}`}
                >
                  <FileIcon className="h-5 w-5" strokeWidth={2} />
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId((currentId) =>
                        currentId === material.id ? null : material.id,
                      )
                    }
                    aria-label={`Options for ${material.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {openMenuId === material.id && (
                    <div className="absolute right-0 top-10 z-10 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => openRename(material)}
                        className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        Rename
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(material)}
                        disabled={deletingId === material.id}
                        className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === material.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 min-w-0">
                <h2
                  title={material.name}
                  className="truncate text-base font-semibold text-slate-950"
                >
                  {material.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {getMaterialFileLabel(material)}{" "}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span>{formatFileSize(material.size)}</span>
                <span aria-hidden="true">•</span>
                <span>Added {formatDate(material.createdAt)}</span>
              </div>

              <div className="mt-auto pt-5">
                <Link
                  href={`/courses/${material.courseId}/materials/${material.id}`}
                  className="flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  Open Material
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {renamingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-950">
              Rename Material
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose a new display name for this material.
            </p>

            <div className="mt-6">
              <label
                htmlFor="rename-material"
                className="block text-sm font-medium text-slate-900"
              >
                Material Name
              </label>

              <input
                id="rename-material"
                type="text"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                disabled={isRenaming}
                autoFocus
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRenamingMaterial(null);
                  setRenameValue("");
                }}
                disabled={isRenaming}
                className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRename}
                disabled={
                  isRenaming ||
                  !renameValue.trim() ||
                  renameValue.trim() === renamingMaterial.name
                }
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRenaming ? "Renaming..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
