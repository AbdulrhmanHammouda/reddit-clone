import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

// uses bg-reddit-card, border-reddit-border, bg-reddit-hover, text-reddit-icon, text-reddit-text
export default function MenuButton({ onClick, open = false }) {
  return (
    <div className="relative">
      {/* circular menu button */}
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        aria-label={open ? "Collapse Navigation" : "Expand Navigation"}
        className="group relative z-10 -ml-3 flex items-center justify-center h-10 w-10 rounded-full bg-reddit-card border border-reddit-border shadow-sm hover:bg-reddit-hover transition focus:outline-none focus:ring-2 focus:ring-reddit-blue"
      >
        {open ? (
          <XMarkIcon className="h-5 w-5 text-reddit-icon group-hover:text-reddit-text" />
        ) : (
          <Bars3Icon className="h-5 w-5 text-reddit-icon group-hover:text-reddit-text" />
        )}
      </button>

      {/* tooltip placed to the right of the button, using theme tokens */}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="px-3 py-1 bg-reddit-text text-reddit-card text-xs rounded-md">{open ? 'Collapse Navigation' : 'Expand Navigation'}</div>
      </div>
    </div>
  );
}
