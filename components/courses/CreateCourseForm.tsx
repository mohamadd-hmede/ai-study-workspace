"use client";

import { FormEvent, useState } from "react";
import { createCourse } from "@/lib/courses";
import type { Course } from "@/types/course";

type CreateCourseFormProps = {
  onCourseCreated: (course: Course) => void;
};

export default function CreateCourseForm({
  onCourseCreated,
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
    } catch {
      setError("Failed to create course. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900">Create New Course</h2>

      <div className="mt-5">
        <label
          htmlFor="course-title"
          className="block text-sm font-medium text-gray-700"
        >
          Course Title
        </label>

        <input
          id="course-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Database Systems"
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-gray-500"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="course-description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>

        <textarea
          id="course-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional course description"
          rows={3}
          className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-gray-500"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!title.trim() || isCreating}
        className="mt-5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCreating ? "Creating..." : "Create Course"}
      </button>
    </form>
  );
}
