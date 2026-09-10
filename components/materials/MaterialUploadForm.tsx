"use client";

import { FormEvent, useState } from "react";
import { createMaterial } from "@/lib/materials";
import type { Material } from "@/types/material";

type MaterialUploadFormProps = {
  courseId: string;
  onMaterialUploaded: (material: Material) => void;
};

export default function MaterialUploadForm({
  courseId,
  onMaterialUploaded,
}: MaterialUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file || isUploading) return;

    const form = event.currentTarget;

    setIsUploading(true);
    setError(null);

    try {
      const material = await createMaterial(courseId, file);

      onMaterialUploaded(material);
      setFile(null);
      form.reset();
    } catch (error) {
      console.error("Material upload error:", error);
      setError("Failed to upload material. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Upload material
        </label>

        <input
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-700"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!file || isUploading}
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? "Uploading..." : "Upload Material"}
      </button>
    </form>
  );
}
