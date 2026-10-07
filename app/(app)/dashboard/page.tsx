"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CircleHelp, FileText } from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { getCourses } from "@/lib/courses";
import { getMaterialsByCourse } from "@/lib/materials";
import { getQuizAttemptsByMaterial } from "@/lib/quiz-history";

import type { Course } from "@/types/course";

type CourseWithMaterialCount = Course & {
  materialCount: number;
};

type DashboardData = {
  courses: CourseWithMaterialCount[];
  totalMaterials: number;
  totalQuizzes: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, displayName, loading: authLoading } = useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    courses: [],
    totalMaterials: 0,
    totalQuizzes: 0,
  });

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      if (!user) {
        return;
      }

      try {
        const courses = await getCourses();

        const coursesWithMaterials = await Promise.all(
          courses.map(async (course) => {
            const materials = await getMaterialsByCourse(course.id);

            return {
              course,
              materials,
            };
          }),
        );

        const allMaterials = coursesWithMaterials.flatMap(
          ({ materials }) => materials,
        );

        const quizAttempts = await Promise.all(
          allMaterials.map((material) =>
            getQuizAttemptsByMaterial(material.id),
          ),
        );

        const coursesWithMaterialCount: CourseWithMaterialCount[] =
          coursesWithMaterials.map(({ course, materials }) => ({
            ...course,
            materialCount: materials.length,
          }));

        if (isActive) {
          setDashboardData({
            courses: coursesWithMaterialCount,
            totalMaterials: allMaterials.length,
            totalQuizzes: quizAttempts.reduce(
              (total, attempts) => total + attempts.length,
              0,
            ),
          });

          setError(null);
          setDashboardLoading(false);
        }
      } catch (loadError) {
        console.error("Failed to load dashboard:", loadError);

        if (isActive) {
          setError("Failed to load your dashboard. Please try again.");
          setDashboardLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, [user]);

  if (authLoading || dashboardLoading) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center">
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const recentCourses = [...dashboardData.courses]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  const stats = [
    {
      label: "Courses",
      value: dashboardData.courses.length,
      description: "Total courses",
      icon: BookOpen,
      iconStyle: "bg-blue-50 text-blue-600",
    },
    {
      label: "Materials",
      value: dashboardData.totalMaterials,
      description: "Total materials",
      icon: FileText,
      iconStyle: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Quizzes",
      value: dashboardData.totalQuizzes,
      description: "Total quizzes",
      icon: CircleHelp,
      iconStyle: "bg-violet-50 text-violet-600",
    },
  ];

  const courseIconStyles = [
    "bg-blue-50 text-blue-600",
    "bg-emerald-50 text-emerald-600",
    "bg-violet-50 text-violet-600",
  ];

  return (
    <div className="px-10 py-8">
      <div className="mx-auto max-w-7xl">
        <section>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            Dashboard
          </h1>
          <h2 className="mt-2 text-2xl font-medium text-slate-900">
            Welcome back, {displayName || "Learnadio User"}!
          </h2>

          <p className="mt-1 text-base text-slate-500">
            Here&apos;s an overview of your courses, materials, and quizzes.
          </p>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-6 grid gap-5 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="flex min-h-36 items-center gap-6 rounded-xl border border-slate-200 bg-white px-7 py-6"
              >
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${stat.iconStyle}`}
                >
                  <Icon className="h-8 w-8" strokeWidth={2} />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">{stat.label}</p>

                  <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {stat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-7 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="whitespace-nowrap text-xl font-semibold text-slate-950">
              Recent Courses
            </h2>
            <Link
              href="/courses"
              className="shrink-0 whitespace-nowrap text-sm font-medium text-blue-600 transition hover:text-blue-700"
            >
              View All
            </Link>
          </div>

          {recentCourses.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
              <BookOpen className="mx-auto h-9 w-9 text-slate-400" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No courses yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create your first course to start organizing your materials.
              </p>

              <Link
                href="/courses"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Create Course
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {recentCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="flex min-h-56 flex-col rounded-xl border border-slate-200 p-5"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                      courseIconStyles[index % courseIconStyles.length]
                    }`}
                  >
                    <BookOpen className="h-7 w-7" strokeWidth={2} />
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-slate-950">
                    {course.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {course.materialCount}{" "}
                    {course.materialCount === 1 ? "material" : "materials"}
                  </p>

                  <Link
                    href={`/courses/${course.id}`}
                    className="mt-auto flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
