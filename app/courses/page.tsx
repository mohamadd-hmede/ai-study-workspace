"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CourseList from "@/components/courses/CourseList";
import CreateCourseForm from "@/components/courses/CreateCourseForm";
import { useAuth } from "@/components/AuthProvider";
import { getCourses } from "@/lib/courses";
import type { Course } from "@/types/course";

export default function CoursesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

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
        setCourses(currentCourses);
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
      setCourses(currentCourses);
    } catch {
      setCoursesError("Failed to load courses. Please try again.");
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleCourseCreated = (course: Course) => {
    setCourses((currentCourses) => [...currentCourses, course]);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>

          <p className="mt-2 text-gray-600">
            Organize your courses and study materials.
          </p>
        </div>

        <div className="mb-8">
          <CreateCourseForm onCourseCreated={handleCourseCreated} />
        </div>

        {coursesError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{coursesError}</p>

            <button
              onClick={retryLoadCourses}
              className="mt-3 text-sm font-medium text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {coursesLoading ? (
          <p>Loading courses...</p>
        ) : (
          <CourseList courses={courses} />
        )}
      </div>
    </main>
  );
}
