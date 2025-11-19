import React from "react";
import SidebarItem from "./SidebarItem";
import {
  HomeIcon,
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  Squares2X2Icon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar({ sidebarOpen = true, onClose }) {
  // sidebarOpen controls width on desktop and visibility on mobile overlay
  const widthClass = sidebarOpen ? "w-[250px]" : "w-[68px]";

  return (
    <>
      {/* Desktop collapsible sidebar (visible on lg+) */}
      <aside className={`hidden lg:block ${widthClass} shrink-0 px-2 transition-all duration-300 overflow-hidden`}>
        <div className="sticky top-16">
          <div className="flex flex-col gap-1">
            <SidebarItem Icon={HomeIcon} label="Home" sidebarOpen={sidebarOpen} />
            <SidebarItem Icon={ArrowTopRightOnSquareIcon} label="Popular" sidebarOpen={sidebarOpen} />
            <SidebarItem Icon={Squares2X2Icon} label="All" sidebarOpen={sidebarOpen} />
            <SidebarItem Icon={GlobeAltIcon} label="Explore" sidebarOpen={sidebarOpen} />
            <SidebarItem Icon={PlusIcon} label="Start a community" sidebarOpen={sidebarOpen} />
          </div>

          <div className={`my-4 border-t border-reddit-divider ${sidebarOpen ? '' : 'opacity-0 h-0'}`}></div>
        </div>
      </aside>

      {/* Mobile overlay sidebar (visible on < lg) */}
      {/* Backdrop - starts below navbar (top-14) so navbar remains above overlay */}
      <div
        className={`${sidebarOpen ? 'block' : 'hidden'} lg:hidden fixed left-0 right-0 top-14 bottom-0 z-30 bg-black/40 transition-opacity`}
        onClick={onClose}
        aria-hidden={!sidebarOpen}
      />

      <div className={`lg:hidden fixed left-0 top-14 bottom-0 z-40 w-[250px] transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 bg-reddit-card border-r border-reddit-border overflow-auto`}>
        <div className="p-3 pt-6">
          <div className="flex flex-col gap-1">
            <SidebarItem Icon={HomeIcon} label="Home" sidebarOpen={true} />
            <SidebarItem Icon={ArrowTopRightOnSquareIcon} label="Popular" sidebarOpen={true} />
            <SidebarItem Icon={Squares2X2Icon} label="All" sidebarOpen={true} />
            <SidebarItem Icon={GlobeAltIcon} label="Explore" sidebarOpen={true} />
            <SidebarItem Icon={PlusIcon} label="Start a community" sidebarOpen={true} />
          </div>

          <div className="my-4 border-t border-reddit-divider"></div>
        </div>
      </div>
    </>
  );
}
