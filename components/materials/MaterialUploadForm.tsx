"use client";

import { FormEvent, useState } from "react";
import { createMaterial } from "@/lib/materials";
import type { Material } from "@/types/material";
import { FileText, LoaderCircle, Upload, X } from "lucide-react";
import { detectMaterialFileCapability } from "@/lib/material-file-capabilities";

type MaterialUploadFormProps = {
  courseId: string;
  onMaterialUploaded: (material: Material) => void;
  onClose: () => void;
};

export default function MaterialUploadForm({
  courseId,
  onMaterialUploaded,
  onClose,
}: MaterialUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [materialName, setMaterialName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (selectedFile: File | null) => {
    setError(null);
    setUploadProgress(0);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    try {
      const capability = await detectMaterialFileCapability(selectedFile);

      if (!capability) {
        setFile(null);
        setError(
          "This file type is not supported because Learnadio cannot safely read and preview it.",
        );
        return;
      }

      setFile(selectedFile);
    } catch (error) {
      console.error("File validation error:", error);

      setFile(null);
      setError(
        "Learnadio could not verify this file. Please choose another file.",
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file || isUploading) return;

    const form = event.currentTarget;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const material = await createMaterial(
        courseId,
        file,
        materialName.trim() || undefined,
        (progress) => {
          setUploadProgress(Math.min(100, Math.max(0, progress)));
        },
      );

      setUploadProgress(100);

      onMaterialUploaded(material);
      setFile(null);
      setMaterialName("");
      form.reset();
      onClose();
    } catch (error) {
      console.error("Material upload error:", error);
      setError("Failed to upload material. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const roundedUploadProgress = Math.round(uploadProgress);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Add Material</h2>

          <p className="mt-1 text-sm text-slate-500">
            Upload a study material to this course.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isUploading}
          aria-label="Close add material form"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-900">
          Upload File
        </label>

        <label
          className={`mt-2 flex min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 text-center transition ${
            isUploading
              ? "cursor-not-allowed border-blue-300 bg-blue-50/50"
              : "cursor-pointer border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40"
          }`}
        >
          <input
            type="file"
            disabled={isUploading}
            onChange={(event) => {
              void handleFileChange(event.target.files?.[0] ?? null);
            }}
            className="sr-only"
          />

          {isUploading && file ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <LoaderCircle
                  className="h-6 w-6 animate-spin"
                  strokeWidth={2}
                />
              </div>

              <p className="mt-3 max-w-full truncate text-sm font-medium text-slate-900">
                {file.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>

              <div className="mt-4 flex w-full max-w-xs items-center gap-3">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-blue-100"
                  role="progressbar"
                  aria-label="Material upload progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={roundedUploadProgress}
                >
                  <div
                    className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <span className="min-w-10 text-right text-sm font-semibold text-blue-700">
                  {roundedUploadProgress}%
                </span>
              </div>

              <p className="mt-3 text-sm font-medium text-blue-700">
                Uploading your material...
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                Upload time depends on the file size and your internet
                connection. Please keep this window open while the upload
                finishes.
              </p>
            </>
          ) : file ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FileText className="h-6 w-6" strokeWidth={2} />
              </div>

              <p className="mt-3 max-w-full truncate text-sm font-medium text-slate-900">
                {file.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>

              <p className="mt-2 text-xs font-medium text-blue-600">
                Click to choose another file
              </p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Upload className="h-6 w-6" strokeWidth={2} />
              </div>

              <p className="mt-3 text-sm font-medium text-slate-900">
                Click to choose a file
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                Documents, presentations, spreadsheets, images, code, and
                readable text files
              </p>
            </>
          )}
        </label>
      </div>

      <div className="mt-5">
        <label
          htmlFor="material-name"
          className="block text-sm font-medium text-slate-900"
        >
          Material Name{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </label>

        <input
          id="material-name"
          type="text"
          value={materialName}
          onChange={(event) => setMaterialName(event.target.value)}
          placeholder={file ? file.name : "e.g. Chapter 1 - Introduction"}
          disabled={isUploading}
          className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
        />

        <p className="mt-2 text-xs text-slate-500">
          Leave empty to use the original file name.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isUploading}
          className="h-11 rounded-lg bg-slate-100 text-sm font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!file || isUploading}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading && (
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
          )}

          {isUploading ? `Uploading ${roundedUploadProgress}%` : "Add Material"}
        </button>
      </div>
    </form>
  );
}
