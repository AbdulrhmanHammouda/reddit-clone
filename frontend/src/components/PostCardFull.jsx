import {
  EllipsisHorizontalIcon,
  ShareIcon,
  BookmarkIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import VoteButtons from "./VoteButtons";

export default function PostCardFull({ postId }) {
  const post = {
    id: postId,
    subreddit: "r/example",
    author: "user123",
    time: "2 hours ago",
    title: `Example full post title (#${postId})`,
    body:
      "This is the full post body. It supports multi-line text and will render as regular content in the full-post view.",
    upvotes: 128,
  };

  return (
    <article className="
      w-full 
      bg-reddit-card 
      dark:bg-reddit-dark_card 
      rounded-xl 
      p-4 
      border border-reddit-border 
      dark:border-reddit-dark_divider 
      shadow-sm
    ">
      
      {/* HEADER */}
      <header className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover flex items-center justify-center text-reddit-text dark:text-reddit-dark_text font-bold">
          {post.subreddit.replace(/[^A-Z]/gi, '').slice(0,2) || 'R'}
        </div>

        <div className="flex-1">
          <div className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
            {post.subreddit} • Posted by 
            <span className="font-semibold text-reddit-text dark:text-reddit-dark_text"> {post.author}</span> • {post.time}
          </div>

          <h1 className="mt-2 text-2xl font-bold text-reddit-text dark:text-reddit-dark_text leading-7">
            {post.title}
          </h1>
        </div>

        <div className="ml-2">
          <button className="p-2 rounded-full hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover text-reddit-icon dark:text-reddit-dark_icon">
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="mt-4 text-reddit-text_light dark:text-reddit-dark_text_light leading-relaxed">
        {post.body}
      </div>

      {/* ACTION BAR */}
      <div className="mt-4 flex items-center gap-4">

        <VoteButtons initial={post.upvotes} />

        {/* Comments */}
        <div className="
          flex items-center gap-2 
          px-3 py-2 
          rounded-full 
          bg-reddit-hover dark:bg-reddit-dark_hover 
          text-reddit-text_secondary dark:text-reddit-dark_text_secondary
          cursor-pointer 
          hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover
        ">
          <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-reddit-icon dark:text-reddit-dark_icon" />
          <span className="text-sm">Comments</span>
        </div>

        {/* Share */}
        <div className="
          flex items-center gap-2 
          px-3 py-2 
          rounded-full 
          bg-reddit-hover dark:bg-reddit-dark_hover 
          text-reddit-text_secondary dark:text-reddit-dark_text_secondary
          cursor-pointer 
          hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover
        ">
          <ShareIcon className="h-4 w-4 text-reddit-icon dark:text-reddit-dark_icon" />
          <span className="text-sm">Share</span>
        </div>

        {/* Save */}
        <div className="
          flex items-center gap-2 
          px-3 py-2 
          rounded-full 
          bg-reddit-hover dark:bg-reddit-dark_hover 
          text-reddit-text_secondary dark:text-reddit-dark_text_secondary
          cursor-pointer 
          hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover
        ">
          <BookmarkIcon className="h-4 w-4 text-reddit-icon dark:text-reddit-dark_icon" />
          <span className="text-sm">Save</span>
        </div>
      </div>

    </article>
  );
}
