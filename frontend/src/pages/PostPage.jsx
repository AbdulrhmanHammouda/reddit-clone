import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PostCardFull from "../components/PostCardFull";
import CommentsList from "../components/CommentsList";
import CommentReplyBox from "../components/CommentReplyBox";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

export default function PostPage() {
  const { id: postId } = useParams();
  const { token } = useAuth();

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);

  async function fetchComments() {
    try {
      const res = await api.get(`/comments/post/${postId}`);
      // 🔥 new API returns: { success, data: roots }
      setComments(res.data.data || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoadingComments(false);
    }
  }

  useEffect(() => {
    fetchComments();
  }, [postId]);

  async function addTopLevelComment(text, images = []) {
    if (!token) return;

    const formData = new FormData();
    formData.append("postId", postId);
    formData.append("body", text);

    images.forEach((file) => formData.append("images", file));

    try {
      await api.post("/comments", formData);
      // 🔥 Instead of pushing locally → refetch from backend
      fetchComments();
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  }

  return (
    <div className="px-4 lg:px-0 max-w-[740px] mx-auto mt-6 pb-20">
      <PostCardFull />

      {/* Top-level comment */}
      <div className="mt-6 bg-reddit-card dark:bg-reddit-dark_card p-4 rounded-lg border border-reddit-border dark:border-reddit-dark_divider">
        <CommentReplyBox
          onReply={addTopLevelComment}
          onCancel={() => {}}
          topLevel
        />
      </div>

      {loadingComments ? (
        <div className="text-sm text-reddit-text_secondary mt-4">
          Loading comments...
        </div>
      ) : comments.length > 0 ? (
        <CommentsList comments={comments} postId={postId} />
      ) : (
        <div className="mt-4 text-sm text-reddit-text_secondary">
          No comments yet.
        </div>
      )}
    </div>
  );
}
