"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, House, LogOut, UserRound, X } from "lucide-react";

import { signOut } from "@/lib/puter";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: House,
  },
  {
    label: "My Courses",
    href: "/courses",
    icon: BookOpen,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
];

type AppSidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
};

export default function AppSidebar({
  mobile = false,
  onClose,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    onClose?.();
    await signOut();
    router.replace("/sign-in");
  };

  const handleNavigation = () => {
    onClose?.();
  };

  const isActive = (href: string) => {
    if (href === "/courses") {
      return pathname.startsWith("/courses");
    }

    return pathname === href;
  };

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-slate-200 bg-white ${
        mobile ? "w-72" : "w-60"
      }`}
    >
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 px-7">
        <Link
          href="/dashboard"
          onClick={handleNavigation}
          className="flex items-center gap-3"
        >
          <Image
            src="/learnadio-logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />

          <span className="text-2xl font-bold tracking-tight text-slate-950">
            Learnadio
          </span>
        </Link>

        {mobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-2 py-8">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavigation}
              className={`relative flex h-14 items-center gap-5 px-8 text-[17px] transition-colors ${
                active
                  ? "bg-blue-50 font-medium text-blue-600"
                  : "text-slate-900 hover:bg-slate-50"
              }`}
            >
              {active && (
                <span className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-blue-600" />
              )}

              <Icon className="h-6 w-6" strokeWidth={2} />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-8 pb-9">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-5 text-[17px] text-slate-900 transition-colors hover:text-blue-600"
        >
          <LogOut className="h-6 w-6" strokeWidth={2} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
