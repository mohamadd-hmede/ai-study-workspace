"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import EditCourseForm from "@/components/courses/EditCourseForm";
import { deleteCourse, getCourseById } from "@/lib/courses";
import type { Course } from "@/types/course";

export default function CourseDetailsPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      const redirect = encodeURIComponent(`/courses/${params.courseId}`);
      router.replace(`/sign-in?redirect=${redirect}`);
      return;
    }

    const loadCourse = async () => {
      const currentCourse = await getCourseById(params.courseId);

      if (!currentCourse) {
        router.replace("/courses");
        return;
      }

      setCourse(currentCourse);
      setCourseLoading(false);
    };

    loadCourse();
  }, [user, authLoading, params.courseId, router]);

  const handleCourseUpdated = (updatedCourse: Course) => {
    setCourse(updatedCourse);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!course || isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const deleted = await deleteCourse(course.id);

      if (deleted) {
        router.push("/courses");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || courseLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/courses"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to My Courses
        </Link>

        <div className="mt-8">
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>

          {course.description && (
            <p className="mt-3 text-gray-600">{course.description}</p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setIsEditing(true)}
              disabled={isDeleting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Edit Course
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Course"}
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="mt-8 max-w-2xl">
            <EditCourseForm
              course={course}
              onCourseUpdated={handleCourseUpdated}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        )}
      </div>
    </main>
  );
}
