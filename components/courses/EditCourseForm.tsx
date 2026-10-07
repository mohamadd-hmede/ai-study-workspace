"use client";

import { classifyPuterError } from "@/lib/puter-errors";
import { FormEvent, useState } from "react";
import { updateCourse } from "@/lib/courses";
import type { Course } from "@/types/course";

type EditCourseFormProps = {
  course: Course;
  onCourseUpdated: (course: Course) => void;
  onCancel: () => void;
};

export default function EditCourseForm({
  course,
  onCourseUpdated,
  onCancel,
}: EditCourseFormProps) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasChanges =
    title.trim() !== course.title ||
    description.trim() !== (course.description ?? "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || isUpdating) {
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const updatedCourse = await updateCourse(
        course.id,
        title.trim(),
        description.trim() || undefined,
      );

      if (!updatedCourse) {
        setError("Course could not be updated. Please try again.");
        return;
      }

      onCourseUpdated(updatedCourse);
    } catch (updateError) {
      console.error("Course update error:", updateError);

      const classifiedError = classifyPuterError(updateError);

      if (classifiedError.category === "insufficient_balance") {
        setError(
          "Your Puter account has no usage remaining. The course could not be updated.",
        );
        return;
      }

      if (
        classifiedError.category === "network" ||
        classifiedError.category === "service_unavailable" ||
        classifiedError.category === "rate_limited"
      ) {
        setError(
          "The course could not be updated right now. Please try again in a moment.",
        );
        return;
      }

      if (classifiedError.category === "auth_required") {
        setError(
          "Your Puter session is no longer available. Please sign in again.",
        );
        return;
      }

      setError("Failed to update course. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
    >
      <h2 className="text-xl font-semibold text-slate-950">Edit Course</h2>

      <p className="mt-1 text-sm text-slate-500">
        Update your course information.
      </p>

      <div className="mt-6">
        <label
          htmlFor="edit-course-title"
          className="block text-sm font-medium text-slate-900"
        >
          Course Name
        </label>

        <input
          id="edit-course-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter course name..."
          className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="edit-course-description"
          className="block text-sm font-medium text-slate-900"
        >
          Description (optional)
        </label>

        <textarea
          id="edit-course-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add a short description..."
          rows={4}
          className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
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
          onClick={onCancel}
          disabled={isUpdating}
          className="h-11 rounded-lg bg-slate-100 text-sm font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!title.trim() || !hasChanges || isUpdating}
          className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
