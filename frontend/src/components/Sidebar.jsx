import React from "react";
import SidebarItem from "./SidebarItem";
import {
  HomeIcon,
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  Squares2X2Icon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ sidebarOpen = true, onClose = () => {} }) {
  const navigate = useNavigate();
  const widthClass = sidebarOpen ? "w-[250px]" : "w-[68px]";

  return (
    <>
      {/* DESKTOP SIDEBAR - FIXED */}
      <aside
         className={`
    hidden lg:block
    fixed
    top-16
    left-0
    ${widthClass}
    h-[calc(100vh-64px)]
    px-2
    bg-reddit-card dark:bg-reddit-dark_card
    border-r border-reddit-border dark:border-reddit-dark_border
    transition-all duration-300
    overflow-y-auto
    pointer-events-auto
    z-1001
  `}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex flex-col gap-1 py-3">
          <SidebarItem
            Icon={HomeIcon}
            label="Home"
            sidebarOpen={sidebarOpen}
            onClick={() => navigate("/")}
          />

          <SidebarItem
            Icon={ArrowTopRightOnSquareIcon}
            label="Popular"
            sidebarOpen={sidebarOpen}
            onClick={() => navigate("/popular")}
          />

          <SidebarItem
            Icon={Squares2X2Icon}
            label="All"
            sidebarOpen={sidebarOpen}
            onClick={() => navigate("/all")}
          />

          <SidebarItem
            Icon={GlobeAltIcon}
            label="Explore"
            sidebarOpen={sidebarOpen}
            onClick={() => navigate("/explore")}
          />

          <SidebarItem
            Icon={PlusIcon}
            label="Start a community"
            sidebarOpen={sidebarOpen}
            onClick={() => navigate("/create-community")}
          />
        </div>

        {/* divider */}
        <div className={`my-4 border-t border-reddit-divider ${sidebarOpen ? "" : "opacity-0 h-0"}`} />
      </aside>

      {/* MOBILE OVERLAY BACKDROP */}
      <div
        className={`
          fixed inset-0 top-14 z-30 bg-black/40 lg:hidden
          ${sidebarOpen ? "block" : "hidden"}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* MOBILE SIDEBAR (slides in) */}
      <div
        className={`
          lg:hidden
          fixed left-0 top-14 bottom-0
          z-40
          w-[250px]
          bg-reddit-card dark:bg-reddit-dark_card
          border-r border-reddit-border dark:border-reddit-dark_border
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          overflow-y-auto
        `}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="p-3 pt-6 flex flex-col gap-1">
          <SidebarItem Icon={HomeIcon} label="Home" onClick={() => { navigate("/"); onClose(); }} />
          <SidebarItem Icon={ArrowTopRightOnSquareIcon} label="Popular" onClick={() => { navigate("/popular"); onClose(); }} />
          <SidebarItem Icon={Squares2X2Icon} label="All" onClick={() => { navigate("/all"); onClose(); }} />
          <SidebarItem Icon={GlobeAltIcon} label="Explore" onClick={() => { navigate("/explore"); onClose(); }} />
          <SidebarItem Icon={PlusIcon} label="Start a community" onClick={() => { navigate("/create-community"); onClose(); }} />
        </div>
      </div>
    </>
  );
}
