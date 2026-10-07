import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  EllipsisVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import type { Course } from "@/types/course";

import { useState } from "react";

type CourseCardProps = {
  course: Course;
  materialCount: number | null;
  index: number;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
};

const formatUpdatedAt = (updatedAt: number) => {
  const difference = Date.now() - updatedAt;
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    return "Updated today";
  }

  if (days === 1) {
    return "Updated 1 day ago";
  }

  if (days < 30) {
    return `Updated ${days} days ago`;
  }

  return `Updated ${new Date(updatedAt).toLocaleDateString()}`;
};

export default function CourseCard({
  course,
  materialCount,
  index,
  onEdit,
  onDelete,
}: CourseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const courseStyles = [
    "bg-blue-50 text-blue-600",
    "bg-emerald-50 text-emerald-700",
    "bg-violet-50 text-violet-600",
    "bg-amber-50 text-amber-600",
    "bg-rose-50 text-rose-600",
  ];

  const courseStyle = courseStyles[index % courseStyles.length];
  return (
    <article className="flex min-h-64 flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold ${courseStyle}`}
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={`Course options for ${course.title}`}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <EllipsisVertical className="h-5 w-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(course);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Edit Course
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(course);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h2 className="mt-5 text-xl font-semibold text-slate-950">
        {course.title}
      </h2>

      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
        <BookOpen className="h-4 w-4" strokeWidth={2} />
        <span>
          {materialCount === null
            ? "Materials unavailable"
            : `${materialCount} ${materialCount === 1 ? "material" : "materials"}`}{" "}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
        <Clock className="h-4 w-4" strokeWidth={2} />
        <span>{formatUpdatedAt(course.updatedAt)}</span>
      </div>

      <Link
        href={`/courses/${course.id}`}
        className="mt-auto flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-900 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        Open Course
        <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </Link>
    </article>
  );
}
