import { useMemo, useState } from "react";
import PostsFeed from "../components/PostsFeed";
import SortMenu from "../components/SortMenu";
import { useLocation, useNavigate } from "react-router-dom";

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialSort = params.get("sort") || "best";
  const initialTime = params.get("time") || "all";

  const [sort, setSort] = useState(initialSort);
  const [time, setTime] = useState(initialTime);

  const handleSortChange = ({ sort: nextSort, time: nextTime = "all" }) => {
    setSort(nextSort);
    setTime(nextSort === "top" ? nextTime : "all");
    const newParams = new URLSearchParams(location.search);
    newParams.set("sort", nextSort);
    if (nextSort === "top") {
      newParams.set("time", nextTime);
    } else {
      newParams.delete("time");
    }
    newParams.set("page", "1");
    navigate({ search: newParams.toString() }, { replace: true });
  };

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
        <SortMenu value={sort} time={time} onChange={handleSortChange} />
      </div>

      {/* Posts feed */}
      <div className="w-full max-w-[740px] px-4">
        <PostsFeed sort={sort} time={time} />
      </div>
    </div>
  );
}
