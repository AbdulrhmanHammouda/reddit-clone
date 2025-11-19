import { useParams } from "react-router-dom";
import PostCardFull from "../components/PostCardFull";
import CommentsList from "../components/CommentsList";

export default function PostPage() {
  const { id } = useParams();

  return (
    <div className="w-full flex justify-center bg-reddit-page dark:bg-reddit-page min-h-screen pt-6">
      <div className="w-full max-w-[740px] flex flex-col gap-4">
        <PostCardFull postId={id} />
        <CommentsList postId={id} />
      </div>
    </div>
  );
}
