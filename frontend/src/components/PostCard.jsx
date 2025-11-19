import {
  ChatBubbleBottomCenterTextIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import VoteButtons from "./VoteButtons";
import { useNavigate } from "react-router-dom";

export default function PostCard({
  id,
  subreddit,
  author,
  time,
  location,
  title,
  body,
  upvotes,
  comments,
  icon,
}) {
  const navigate = useNavigate();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/post/${id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/post/${id}`); }}
      className="
        w-full 
        max-w-[740px] 
        bg-reddit-card 
        dark:bg-reddit-card 
        rounded-xl 
        p-4 
        border border-reddit-border 
        dark:border-reddit-divider 
        shadow-sm
        cursor-pointer
      "
    >
      
      {/* HEADER */}
      <div className="flex items-center justify-between text-[13px]">
        {/* Left */}
        <div className="flex items-center gap-2 text-reddit-text_secondary dark:text-reddit-text_secondary">

          {/* Subreddit Icon */}
          <img
            src={icon}
            className="h-6 w-6 rounded-full"
          />

          <span className="font-semibold text-reddit-text dark:text-reddit-text">
            r/{subreddit}
          </span>

          <span>•</span>
          <span>{time}</span>

          <span>•</span>
          <span>{location}</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button onClick={(e) => e.stopPropagation()} className="bg-reddit-blue hover:bg-reddit-blue_hover text-reddit-card text-sm font-semibold px-4 py-1 rounded-full">
            Join
          </button>
          <button onClick={(e) => e.stopPropagation()} className="p-1 rounded-full">
            <EllipsisHorizontalIcon className="h-6 w-6 text-reddit-icon dark:text-reddit-icon cursor-pointer" />
          </button>
        </div>
      </div>

      {/* TITLE */}
      <h2 className="mt-2 text-[20px] font-semibold text-reddit-text dark:text-reddit-text leading-6">
        <span className="block">{title}</span>
      </h2>

      {/* BODY */}
      <p className="mt-1 text-[15px] text-reddit-text_light dark:text-reddit-text_light">{body}</p>

      {/* ACTION BAR */}
      <div className="flex items-center gap-4 mt-3">
        <div onClick={(e) => e.stopPropagation()}>
          <VoteButtons initial={upvotes} />
        </div>

        {/* Comments */}
        <div className="
            flex items-center gap-1 
            bg-reddit-hover dark:bg-reddit-hover_dark 
            px-3 py-[6px] 
            rounded-full 
            text-sm 
            text-reddit-text_secondary dark:text-reddit-text_secondary 
            cursor-pointer 
            hover:bg-reddit-hover dark:hover:bg-reddit-hover_dark
          ">
          <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-reddit-icon" />
          <span>{comments}</span>
        </div>

        {/* Share */}
        <div className="
          flex items-center gap-1 
          bg-reddit-hover dark:bg-reddit-hover_dark 
          px-3 py-[6px] 
          rounded-full 
          text-sm 
          text-reddit-text_secondary dark:text-reddit-text_secondary 
          cursor-pointer 
          hover:bg-reddit-hover dark:hover:bg-reddit-hover_dark
        ">
          <ShareIcon className="h-4 w-4 text-reddit-icon" />
          <span>Share</span>
        </div>
      </div>
    </div>
  );
}
