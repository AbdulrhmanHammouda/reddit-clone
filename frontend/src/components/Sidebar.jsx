import React from "react";
import SidebarItem from "./SidebarItem";
import {
  HomeIcon,
  ArrowTopRightOnSquareIcon,
  QuestionMarkCircleIcon,
  GlobeAltIcon,
  Squares2X2Icon,
  PlusIcon,
  ChevronDownIcon,
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
            <SidebarItem Icon={QuestionMarkCircleIcon} label="Answers" badge={<span className="text-xs text-reddit-blue font-semibold">BETA</span>} sidebarOpen={sidebarOpen} />
            <SidebarItem Icon={GlobeAltIcon} label="Explore" sidebarOpen={sidebarOpen} />
            <SidebarItem Icon={Squares2X2Icon} label="All" sidebarOpen={sidebarOpen} />
            <SidebarItem Icon={PlusIcon} label="Start a community" sidebarOpen={sidebarOpen} />
          </div>

          <div className={`my-4 border-t border-reddit-divider ${sidebarOpen ? '' : 'opacity-0 h-0'}`}></div>

          {/* Games on reddit box — hidden when collapsed */}
          {sidebarOpen && (
            <div className="bg-reddit-card border border-reddit-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-reddit-text">GAMES ON REDDIT</div>
                <ChevronDownIcon className="h-5 w-5 text-reddit-icon" />
              </div>

              <div className="mt-3 flex flex-col gap-3">
                {/* featured game */}
                <div className="flex items-center gap-3 bg-reddit-hover rounded-lg px-3 py-3">
                  <div className="h-10 w-10 rounded-md flex items-center justify-center bg-reddit-blue text-reddit-card font-bold">HC</div>
                  <div>
                    <div className="text-sm font-semibold text-reddit-text">Hot and Cold</div>
                    <div className="text-xs text-reddit-text_secondary">Guess the secret word</div>
                    <div className="text-xs text-reddit-text_secondary mt-1">4.2M monthly players</div>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-reddit-upvote text-reddit-card font-semibold">NEW</span>
                  </div>
                </div>

                {/* other games */}
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-reddit-hover flex items-center justify-center text-reddit-text">PG</div>
                  <div className="text-sm text-reddit-text">Pocket Grids</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-reddit-hover flex items-center justify-center text-reddit-text">FM</div>
                  <div className="text-sm text-reddit-text">Farm Merge Valley</div>
                </div>

                <button className="mt-2 text-sm text-reddit-blue font-semibold text-left">Discover More Games</button>
              </div>
            </div>
          )}

          {/* Custom feeds — hidden when collapsed */}
          {sidebarOpen && (
            <>
              <div className="mt-6 text-sm text-reddit-text_secondary font-semibold">CUSTOM FEEDS</div>
              <div className="mt-2">
                <SidebarItem Icon={PlusIcon} label="Create Custom Feed" sidebarOpen={sidebarOpen} />
              </div>
            </>
          )}
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
            <SidebarItem Icon={QuestionMarkCircleIcon} label="Answers" badge={<span className="text-xs text-reddit-blue font-semibold">BETA</span>} sidebarOpen={true} />
            <SidebarItem Icon={GlobeAltIcon} label="Explore" sidebarOpen={true} />
            <SidebarItem Icon={Squares2X2Icon} label="All" sidebarOpen={true} />
            <SidebarItem Icon={PlusIcon} label="Start a community" sidebarOpen={true} />
          </div>

          <div className="my-4 border-t border-reddit-divider"></div>

          <div className="bg-reddit-card rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-reddit-text">GAMES ON REDDIT</div>
              <ChevronDownIcon className="h-5 w-5 text-reddit-icon" />
            </div>

            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-reddit-hover rounded-lg px-3 py-3">
                <div className="h-10 w-10 rounded-md flex items-center justify-center bg-reddit-blue text-reddit-card font-bold">HC</div>
                <div>
                  <div className="text-sm font-semibold text-reddit-text">Hot and Cold</div>
                  <div className="text-xs text-reddit-text_secondary">Guess the secret word</div>
                </div>
                <div className="ml-auto">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-reddit-upvote text-reddit-card font-semibold">NEW</span>
                </div>
              </div>

              <button className="mt-2 text-sm text-reddit-blue font-semibold text-left">Discover More Games</button>
            </div>
          </div>

          <div className="mt-6 text-sm text-reddit-text_secondary font-semibold">CUSTOM FEEDS</div>
          <div className="mt-2">
            <SidebarItem Icon={PlusIcon} label="Create Custom Feed" sidebarOpen={true} />
          </div>
        </div>
      </div>
    </>
  );
}
