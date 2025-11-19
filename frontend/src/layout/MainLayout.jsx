import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import MenuButton from "../components/MenuButton";

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-reddit-page dark:bg-reddit-dark_bg">
      <Navbar onToggleSidebar={() => setSidebarOpen((s) => !s)} />

      <div className="relative flex gap-6 px-4 lg:px-8 pt-6">
        {/* Left sidebar column */}
        <div className={`${sidebarOpen ? "block" : "hidden"} lg:block`}>
          <Sidebar sidebarOpen={sidebarOpen} />
        </div>

        {/* Divider + menu button column */}
        <div className="relative flex flex-col items-center">
          {/* full-height vertical divider */}
          <div className="min-h-screen w-px bg-reddit-divider"></div>

          {/* place button floating near top (adjust top spacing if needed) */}
          <div className="absolute -left-3 top-6 lg:-left-2 ">
            <MenuButton open={sidebarOpen} onClick={() => setSidebarOpen((s) => !s)} />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 flex justify-center">
          <div className="w-full max-w-[740px]">{children}</div>
        </main>

        {/* Right column */}
        <aside className="hidden xl:block w-[320px]">
          {/* Right widgets */}
        </aside>
      </div>
    </div>
  );
}
