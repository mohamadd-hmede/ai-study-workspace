"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CourseList from "@/components/courses/CourseList";
import { useAuth } from "@/components/AuthProvider";
import { deleteCourse, getCourses } from "@/lib/courses";
import type { Course } from "@/types/course";
import { getMaterialsByCourse } from "@/lib/materials";
import { Plus, Search } from "lucide-react";
import CreateCourseForm from "@/components/courses/CreateCourseForm";
import EditCourseForm from "@/components/courses/EditCourseForm";

type CourseWithMaterialCount = Course & { materialCount: number };

export default function CoursesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [courses, setCourses] = useState<CourseWithMaterialCount[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/sign-in?redirect=/courses");
      return;
    }

    const loadCourses = async () => {
      try {
        const currentCourses = await getCourses();

        const coursesWithMaterialCount = await Promise.all(
          currentCourses.map(async (course) => {
            const materials = await getMaterialsByCourse(course.id);

            return {
              ...course,
              materialCount: materials.length,
            };
          }),
        );

        setCourses(coursesWithMaterialCount);
      } catch {
        setCoursesError("Failed to load courses. Please try again.");
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, [user, authLoading, router]);

  const retryLoadCourses = async () => {
    setCoursesLoading(true);
    setCoursesError(null);

    try {
      const currentCourses = await getCourses();

      const coursesWithMaterialCount = await Promise.all(
        currentCourses.map(async (course) => {
          const materials = await getMaterialsByCourse(course.id);

          return {
            ...course,
            materialCount: materials.length,
          };
        }),
      );

      setCourses(coursesWithMaterialCount);
    } catch {
      setCoursesError("Failed to load courses. Please try again.");
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleCourseCreated = (course: Course) => {
    setCourses((currentCourses) => [
      ...currentCourses,
      {
        ...course,
        materialCount: 0,
      },
    ]);
  };

  const handleCourseUpdated = (updatedCourse: Course) => {
    setCourses((currentCourses) =>
      currentCourses.map((course) =>
        course.id === updatedCourse.id
          ? {
              ...updatedCourse,
              materialCount: course.materialCount,
            }
          : course,
      ),
    );

    setEditingCourse(null);
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const deleted = await deleteCourse(deletingCourse.id);

      if (!deleted) {
        setDeleteError("Course could not be deleted. Please try again.");
        return;
      }

      setCourses((currentCourses) =>
        currentCourses.filter((course) => course.id !== deletingCourse.id),
      );

      setDeletingCourse(null);
    } catch {
      setDeleteError("Failed to delete course. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredCourses = courses.filter((course) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      course.title.toLowerCase().includes(normalizedSearch) ||
      course.description?.toLowerCase().includes(normalizedSearch)
    );
  });

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            My Courses
          </h1>

          <p className="mt-2 text-base text-slate-500">
            Manage your courses and study materials.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              strokeWidth={2}
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search courses..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setCreateCourseOpen(true)}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
            Create Course
          </button>
        </div>

        <div
          className={`grid items-start gap-5 ${
            createCourseOpen ? "lg:grid-cols-[minmax(0,1fr)_370px]" : ""
          }`}
        >
          <div className="order-2 min-w-0 lg:order-1">
            {coursesError && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{coursesError}</p>

                <button
                  type="button"
                  onClick={retryLoadCourses}
                  className="mt-3 text-sm font-medium text-red-700 underline"
                >
                  Try Again
                </button>
              </div>
            )}
            {coursesLoading ? (
              <p className="text-sm text-slate-500">Loading courses...</p>
            ) : (
              <CourseList
                courses={filteredCourses}
                onEdit={(course) => setEditingCourse(course)}
                onDelete={(course) => {
                  setDeleteError(null);
                  setDeletingCourse(course);
                }}
              />
            )}
          </div>

          {createCourseOpen && (
            <div className="order-1 w-full lg:order-2 lg:sticky lg:top-24">
              <CreateCourseForm
                onCourseCreated={handleCourseCreated}
                onClose={() => setCreateCourseOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-lg">
            <EditCourseForm
              course={editingCourse}
              onCourseUpdated={handleCourseUpdated}
              onCancel={() => setEditingCourse(null)}
            />
          </div>
        </div>
      )}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-950">
              Delete Course?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-medium text-slate-900">
                {deletingCourse.title}
              </span>
              ? This will also delete all materials inside this course.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{deleteError}</p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeletingCourse(null);
                }}
                disabled={isDeleting}
                className="h-11 rounded-lg bg-slate-100 text-sm font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={isDeleting}
                className="h-11 rounded-lg bg-red-600 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
