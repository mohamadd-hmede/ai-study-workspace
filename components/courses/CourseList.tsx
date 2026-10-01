import CourseCard from "@/components/courses/CourseCard";
import type { Course } from "@/types/course";

type CourseWithMaterialCount = Course & {
  materialCount: number;
};

type CourseListProps = {
  courses: CourseWithMaterialCount[];
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
};

export default function CourseList({
  courses,
  onEdit,
  onDelete,
}: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-900">No courses yet</h2>

        <p className="mt-2 text-sm text-slate-500">
          Create your first course to start organizing your study materials.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course, index) => (
        <CourseCard
          key={course.id}
          course={course}
          materialCount={course.materialCount}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
