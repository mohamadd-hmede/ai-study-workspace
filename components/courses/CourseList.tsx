import CourseCard from "@/components/courses/CourseCard";
import type { Course } from "@/types/course";

type CourseListProps = {
  courses: Course[];
};

export default function CourseList({ courses }: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
        <h2 className="text-lg font-semibold text-gray-900">No courses yet</h2>

        <p className="mt-2 text-sm text-gray-500">
          Create your first course to start organizing your study materials.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
