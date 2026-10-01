"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import { createCourse } from "@/lib/courses";
import type { Course } from "@/types/course";

type CreateCourseFormProps = {
  onCourseCreated: (course: Course) => void;
  onClose: () => void;
};

export default function CreateCourseForm({
  onCourseCreated,
  onClose,
}: CreateCourseFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || isCreating) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const course = await createCourse(
        title.trim(),
        description.trim() || undefined,
      );

      onCourseCreated(course);

      setTitle("");
      setDescription("");
      onClose();
    } catch {
      setError("Failed to create course. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-950">
          Create New Course
        </h2>

        <button
          type="button"
          onClick={onClose}
          disabled={isCreating}
          aria-label="Close create course form"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-6">
        <label
          htmlFor="course-title"
          className="block text-sm font-medium text-slate-900"
        >
          Course Name
        </label>

        <input
          id="course-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter course name..."
          className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="course-description"
          className="block text-sm font-medium text-slate-900"
        >
          Description (optional)
        </label>

        <textarea
          id="course-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add a short description..."
          rows={4}
          className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500"
        />
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
          disabled={isCreating}
          className="h-11 rounded-lg bg-slate-100 text-sm font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!title.trim() || isCreating}
          className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Create Course"}
        </button>
      </div>
    </form>
  );
}
