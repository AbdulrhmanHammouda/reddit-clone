import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import MenuButton from "../components/MenuButton";

export default function MainLayout({ children, noRightSidebar = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const desktopShiftClass = sidebarOpen ? "lg:ml-[250px]" : "lg:ml-[68px]";

  return (
    <div className="min-h-screen bg-reddit-page dark:bg-reddit-dark_bg transition-colors duration-200">
      {/* Navbar */}
      <Navbar onToggleSidebar={() => setSidebarOpen((s) => !s)} />

      {/* Sidebar (fixed) */}
      <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main scrolling area - make sure it has lower stacking context */}
      <div className={`${desktopShiftClass} transition-all duration-300 z-0 relative`}>
        <div className="flex gap-6 px-4 lg:px-8 pt-6">

          {/* Floating Sidebar Toggle Button (on top) */}
          <div
            className={`
              hidden lg:flex
              items-center justify-center
              h-8 w-7 rounded-full
              bg-reddit-card dark:bg-reddit-dark_card
              border border-reddit-border dark:border-reddit-dark_border
              shadow
              fixed
              top-24
              ${sidebarOpen ? "left-[240px]" : "left-[58px]"}
              transition-all duration-300
              z-70
            `}
            onClick={() => setSidebarOpen((s) => !s)}
          >
            <MenuButton open={sidebarOpen} />
          </div>

          {/* Page content */}
          <main className="flex-1 flex justify-center">
            <div className={`w-full ${noRightSidebar ? "max-w-[1100px]" : "max-w-[740px]"}`}>
              {children}
            </div>
          </main>

          {/* Right sidebar */}
          {!noRightSidebar && <aside className="hidden xl:block w-[320px]">{/* Right widgets */}</aside>}
        </div>
      </div>
    </div>
  );
}
