import PostsFeed from "../components/PostsFeed";

export default function Home() {
  return (
    <div className="
      w-full flex justify-center
      min-h-screen
      pt-6
      bg-reddit-page dark:bg-reddit-dark_bg
      transition-colors duration-200
    ">
      <PostsFeed />
    </div>
  );
}
