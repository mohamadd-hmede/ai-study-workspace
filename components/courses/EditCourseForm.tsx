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
  const [description, setDescription] = useState(course.description || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || isUpdating) {
      return;
    }

    setIsUpdating(true);

    try {
      const updatedCourse = await updateCourse(
        course.id,
        title.trim(),
        description.trim() || undefined,
      );

      if (updatedCourse) {
        onCourseUpdated(updatedCourse);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-gray-900">Edit course</h2>

      <div className="mt-5">
        <label
          htmlFor="edit-course-title"
          className="text-sm font-medium text-gray-700"
        >
          Course name
        </label>

        <input
          id="edit-course-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="edit-course-description"
          className="text-sm font-medium text-gray-700"
        >
          Description
        </label>

        <textarea
          id="edit-course-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
        />
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={!title.trim() || isUpdating}
          className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isUpdating}
          className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
