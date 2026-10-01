"use client";

import { useState } from "react";

import AppHeader from "@/components/layout/AppHeader";
import AppSidebar from "@/components/layout/AppSidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <AppSidebar />
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-slate-950/40"
          />

          <div className="relative h-full w-60">
            <AppSidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
