import { useParams } from "react-router-dom";
import PostCardFull from "../components/PostCardFull";
import CommentsList from "../components/CommentsList";

export default function PostPage() {
  const { id } = useParams();

  return (
    <div className="
      w-full 
      min-h-screen 
      flex 
      flex-col 
      items-center 
      bg-reddit-page 
      dark:bg-reddit-dark_bg 
      transition-colors duration-200
    ">
      <div className="w-full max-w-[740px] mt-6 flex flex-col gap-6">
        <PostCardFull postId={id} />
        <CommentsList postId={id} />
      </div>
    </div>
  );
}
