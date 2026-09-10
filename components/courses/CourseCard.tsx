import type { Course } from "@/types/course";
import Link from "next/link";

type CourseCardProps = {
  course: Course;
};

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">{course.title}</h2>

      {course.description && (
        <p className="mt-2 text-sm text-gray-600">{course.description}</p>
      )}

      <p className="mt-4 text-xs text-gray-500">
        Updated {new Date(course.updatedAt).toLocaleDateString()}
      </p>

      <Link
        href={`/courses/${course.id}`}
        className="mt-5 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
      >
        Open Course
      </Link>
    </article>
  );
}
