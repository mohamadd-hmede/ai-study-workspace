"use client";

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
    } catch {
      setError("Failed to update course. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900">Edit Course</h2>

      <div className="mt-5">
        <label
          htmlFor="edit-course-title"
          className="block text-sm font-medium text-gray-700"
        >
          Course Title
        </label>

        <input
          id="edit-course-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-gray-500"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="edit-course-description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>

        <textarea
          id="edit-course-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-gray-500"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={!title.trim() || isUpdating}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isUpdating}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
