import { useState } from "react";
import PostsFeed from "../components/PostsFeed";
import SortMenu from "../components/SortMenu";

export default function Home() {
  const [sort, setSort] = useState("best");

  return (
    <div
      className="
        w-full flex flex-col items-center
        min-h-screen pt-6
        bg-reddit-page dark:bg-reddit-dark_bg
        transition-colors duration-200
      "
    >
      {/* Sort menu */}
      <div className="w-full max-w-[740px] mb-4 px-4">
        <SortMenu value={sort} onChange={setSort} />
      </div>

      {/* Posts feed */}
      <div className="w-full max-w-[740px] px-4">
        <PostsFeed sort={sort} />
      </div>
    </div>
  );
}
