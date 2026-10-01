"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import EditCourseForm from "@/components/courses/EditCourseForm";
import { deleteCourse, getCourseById } from "@/lib/courses";
import type { Course } from "@/types/course";
import MaterialUploadForm from "@/components/materials/MaterialUploadForm";
import MaterialList from "@/components/materials/MaterialList";
import { getMaterialsByCourse } from "@/lib/materials";
import type { Material } from "@/types/material";

export default function CourseDetailsPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"materials" | "details">(
    "materials",
  );
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialSort, setMaterialSort] = useState<
    "newest" | "oldest" | "name"
  >("newest");

  const filteredMaterials = materials
    .filter((material) =>
      material.name.toLowerCase().includes(materialSearch.toLowerCase()),
    )
    .sort((a, b) => {
      if (materialSort === "oldest") {
        return a.createdAt - b.createdAt;
      }

      if (materialSort === "name") {
        return a.name.localeCompare(b.name);
      }

      return b.createdAt - a.createdAt;
    });

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
      try {
        const currentCourse = await getCourseById(params.courseId);

        if (!currentCourse) {
          router.replace("/courses");
          return;
        }

        setCourse(currentCourse);

        const currentMaterials = await getMaterialsByCourse(params.courseId);

        setMaterials(currentMaterials);
      } catch {
        setCourseError("Failed to load course. Please try again.");
      } finally {
        setCourseLoading(false);
      }
    };

    loadCourse();
  }, [user, authLoading, params.courseId, router]);

  const handleCourseUpdated = (updatedCourse: Course) => {
    setCourse(updatedCourse);
    setIsEditing(false);
  };

  const retryLoadCourse = async () => {
    setCourseLoading(true);
    setCourseError(null);

    try {
      const currentCourse = await getCourseById(params.courseId);

      if (!currentCourse) {
        router.replace("/courses");
        return;
      }

      setCourse(currentCourse);

      const currentMaterials = await getMaterialsByCourse(params.courseId);
      setMaterials(currentMaterials);
    } catch {
      setCourseError("Failed to load course. Please try again.");
    } finally {
      setCourseLoading(false);
    }
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
    setDeleteError(null);

    try {
      const deleted = await deleteCourse(course.id);

      if (!deleted) {
        setDeleteError("Course could not be deleted. Please try again.");
        return;
      }

      router.push("/courses");
    } catch {
      setDeleteError("Failed to delete course. Please try again.");
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

  if (courseError && !course) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center">
          <p className="text-sm text-red-700">{courseError}</p>

          <button
            onClick={retryLoadCourse}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
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

        {courseError && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{courseError}</p>

            <button
              onClick={retryLoadCourse}
              className="mt-3 text-sm font-medium text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="mt-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-950">
                {course.title}
              </h1>

              {course.description && (
                <p className="mt-2 max-w-2xl text-base leading-7 text-slate-500">
                  {course.description}
                </p>
              )}
            </div>

            {activeTab === "materials" && (
              <button
                type="button"
                onClick={() => setAddMaterialOpen(true)}
                className="flex h-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                + Add Material
              </button>
            )}
          </div>

          <div className="mt-7 flex gap-8 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("materials")}
              className={`border-b-2 pb-3 text-sm font-medium transition ${
                activeTab === "materials"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Materials
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`border-b-2 pb-3 text-sm font-medium transition ${
                activeTab === "details"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Course Details
            </button>
          </div>
        </div>

        {activeTab === "details" && isEditing && (
          <div className="mt-8 max-w-2xl">
            <EditCourseForm
              course={course}
              onCourseUpdated={handleCourseUpdated}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        )}

        {activeTab === "materials" && (
          <div className="mt-7">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:max-w-md">
                <input
                  type="search"
                  value={materialSearch}
                  onChange={(event) => setMaterialSearch(event.target.value)}
                  placeholder="Search materials..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>

              <select
                aria-label="Sort materials"
                value={materialSort}
                onChange={(event) =>
                  setMaterialSort(
                    event.target.value as "newest" | "oldest" | "name",
                  )
                }
                className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            <MaterialList
              materials={filteredMaterials}
              onMaterialDeleted={(materialId) =>
                setMaterials((currentMaterials) =>
                  currentMaterials.filter(
                    (material) => material.id !== materialId,
                  ),
                )
              }
              onMaterialRenamed={(updatedMaterial) =>
                setMaterials((currentMaterials) =>
                  currentMaterials.map((material) =>
                    material.id === updatedMaterial.id
                      ? updatedMaterial
                      : material,
                  ),
                )
              }
            />
          </div>
        )}

        {activeTab === "details" && (
          <div className="mt-7 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-950">
              Course Details
            </h2>

            <div className="mt-6">
              <p className="text-sm font-medium text-slate-500">Course Name</p>
              <p className="mt-1 text-base font-medium text-slate-900">
                {course.title}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">Description</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {course.description || "No description added."}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-500">Materials</p>
              <p className="mt-1 text-base font-medium text-slate-900">
                {materials.length}
              </p>
            </div>

            {deleteError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{deleteError}</p>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Edit Course
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Course"}
              </button>
            </div>
          </div>
        )}

        {addMaterialOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
            <div className="w-full max-w-xl">
              <MaterialUploadForm
                courseId={course.id}
                onMaterialUploaded={(material) =>
                  setMaterials((currentMaterials) => [
                    ...currentMaterials,
                    material,
                  ])
                }
                onClose={() => setAddMaterialOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
