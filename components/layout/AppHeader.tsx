"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  Search,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { getCourses } from "@/lib/courses";
import { getMaterialsByCourse } from "@/lib/materials";
import { signOut } from "@/lib/puter";

import type { Course } from "@/types/course";
import type { Material } from "@/types/material";

type AppHeaderProps = {
  onMenuClick: () => void;
};

type SearchMaterial = Material & {
  courseTitle: string;
};

type SearchData = {
  courses: Course[];
  materials: SearchMaterial[];
};

const getInitials = (username: string) => {
  const parts = username
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return username.slice(0, 2).toUpperCase();
};

export default function AppHeader({ onMenuClick }: AppHeaderProps) {
  const router = useRouter();
  const { displayName, loading } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchData, setSearchData] = useState<SearchData>({
    courses: [],
    materials: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const visibleName = displayName ?? "";
  const initials = visibleName ? getInitials(visibleName) : "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadSearchData = async () => {
    if (searchData.courses.length > 0 || searchData.materials.length > 0) {
      return;
    }

    setSearchLoading(true);

    try {
      const courses = await getCourses();

      const materialsByCourse = await Promise.all(
        courses.map(async (course) => {
          const materials = await getMaterialsByCourse(course.id);

          return materials.map((material) => ({
            ...material,
            courseTitle: course.title,
          }));
        }),
      );

      setSearchData({
        courses,
        materials: materialsByCourse.flat(),
      });
    } catch (error) {
      console.error("Failed to load search data:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchFocus = async () => {
    setSearchOpen(true);
    await loadSearchData();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSearchOpen(true);
  };

  const handleSearchNavigation = (path: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(path);
  };

  const handleNavigation = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.replace("/sign-in");
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredCourses =
    normalizedQuery.length > 0
      ? searchData.courses
          .filter((course) => {
            const titleMatches = course.title
              .toLowerCase()
              .includes(normalizedQuery);

            const descriptionMatches = course.description
              ?.toLowerCase()
              .includes(normalizedQuery);

            return titleMatches || descriptionMatches;
          })
          .slice(0, 5)
      : [];

  const filteredMaterials =
    normalizedQuery.length > 0
      ? searchData.materials
          .filter(
            (material) =>
              material.name.toLowerCase().includes(normalizedQuery) ||
              material.courseTitle.toLowerCase().includes(normalizedQuery),
          )
          .slice(0, 5)
      : [];

  const hasResults = filteredCourses.length > 0 || filteredMaterials.length > 0;

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-6 w-6" strokeWidth={2} />
      </button>

      <div ref={searchRef} className="relative min-w-0 flex-1 sm:max-w-md">
        <Search
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          strokeWidth={2}
        />

        <input
          type="search"
          value={searchQuery}
          onChange={(event) => handleSearchChange(event.target.value)}
          onFocus={handleSearchFocus}
          placeholder="Search materials, courses..."
          className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500"
        />

        {searchOpen && normalizedQuery.length > 0 && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-96 w-full min-w-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
            {searchLoading ? (
              <p className="px-4 py-3 text-sm text-slate-500">Searching...</p>
            ) : hasResults ? (
              <>
                {filteredCourses.length > 0 && (
                  <div>
                    <p className="px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Courses
                    </p>

                    {filteredCourses.map((course) => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() =>
                          handleSearchNavigation(`/courses/${course.id}`)
                        }
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <BookOpen className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {course.title}
                          </p>

                          <p className="text-xs text-slate-500">Course</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredMaterials.length > 0 && (
                  <div
                    className={
                      filteredCourses.length > 0
                        ? "mt-2 border-t border-slate-100 pt-2"
                        : ""
                    }
                  >
                    <p className="px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Materials
                    </p>

                    {filteredMaterials.map((material) => (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() =>
                          handleSearchNavigation(
                            `/courses/${material.courseId}/materials/${material.id}`,
                          )
                        }
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <FileText className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {material.name}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {material.courseTitle}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="px-4 py-6 text-center">
                <Search className="mx-auto h-6 w-6 text-slate-300" />

                <p className="mt-2 text-sm font-medium text-slate-700">
                  No results found
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Try searching for another course or material.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={menuRef} className="relative ml-auto shrink-0">
        {!loading && displayName && (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((previous) => !previous)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-slate-50 sm:gap-3 sm:px-2"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {initials}
              </div>

              <span className="hidden max-w-48 truncate font-medium text-slate-900 sm:block">
                {visibleName}
              </span>

              <ChevronDown
                className={`hidden h-4 w-4 text-slate-500 transition-transform sm:block ${
                  menuOpen ? "rotate-180" : ""
                }`}
                strokeWidth={2}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigation("/profile")}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <UserRound className="h-5 w-5" strokeWidth={2} />
                  Profile
                </button>

                <div className="my-2 border-t border-slate-100" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" strokeWidth={2} />
                  Sign Out
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
