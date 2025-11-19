import PostsFeed from "../components/PostsFeed";

export default function Home() {
  return (
    <div className="w-full flex justify-center bg-reddit-page dark:bg-reddit-page min-h-screen pt-6">
      <PostsFeed />
    </div>
  );
}
