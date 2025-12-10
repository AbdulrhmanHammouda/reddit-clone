import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import PostCardFull from "../components/PostCardFull";
import CommentsList from "../components/CommentsList";
import CommentReplyBox from "../components/CommentReplyBox";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import Toast from "../components/Toast";

export default function PostPage() {
  const { id: postId } = useParams();
  const { token } = useAuth();

  const [post, setPost] = useState(null);
  const [postLoading, setPostLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [toastConfig, setToastConfig] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const pollRef = useRef(null);
  const prevProcessingRef = useRef(null);
  const mountedRef = useRef(true);

  const handleToastHide = useCallback(() => {
    setShowToast(false);
    setToastConfig(null);
  }, []);

  const showToastMessage = useCallback((message, variant = "success") => {
    setToastConfig({ message, variant });
    setShowToast(true);
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const fetchPost = useCallback(
    async ({ withLoader = false } = {}) => {
      if (!postId) return null;
      if (withLoader) setPostLoading(true);
      try {
        const res = await api.get(`/posts/${postId}`);
        if (!mountedRef.current) return null;
        const nextPost = res.data.data;
        const isProcessing = Boolean(nextPost?.processing);
        const wasProcessing = prevProcessingRef.current;

        console.log("Checking processing...", nextPost?.processing);

        setPost(nextPost);
        setPostLoading(false);

        if (wasProcessing && !isProcessing) {
          showToastMessage("🎥 Your video is ready!", "success");
        }

        prevProcessingRef.current = isProcessing;
        return nextPost;
      } catch (err) {
        console.error("Failed to load post:", err);
        if (mountedRef.current) setPostLoading(false);
        return null;
      }
    },
    [postId, showToastMessage]
  );

  useEffect(() => {
    prevProcessingRef.current = null;
    fetchPost({ withLoader: true });
  }, [fetchPost]);

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

  const handleCommentDelete = (commentId) => {
    setComments((prevComments) => prevComments.filter((comment) => comment._id !== commentId));
  };

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

  useEffect(() => {
    // consume any queued upload errors stored from CreatePost async upload
    if (!post) return;
    const errKey = `videoUploadError:${post._id}`;
    const errMsg = sessionStorage.getItem(errKey);
    if (errMsg) {
      showToastMessage(errMsg, "error");
      sessionStorage.removeItem(errKey);
    }
  }, [post, showToastMessage]);

  useEffect(() => {
    if (!post?.processing) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(() => {
      fetchPost();
    }, 3000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [post?.processing, fetchPost]);

  if (postLoading) return <div className="mt-6">Loading post…</div>;
  if (!post) return <div className="mt-6 text-red-500">Post not found</div>;

  return (
    <div className="px-4 lg:px-0 max-w-[740px] mx-auto mt-6 pb-20 relative">
      {toastConfig && (
        <Toast
          message={toastConfig.message}
          variant={toastConfig.variant}
          visible={showToast}
          onHide={handleToastHide}
          duration={3000}
        />
      )}

      <PostCardFull post={post} />

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
        <CommentsList comments={comments} postId={postId} onDeleteComment={handleCommentDelete} />
      ) : (
        <div className="mt-4 text-sm text-reddit-text_secondary">
          No comments yet.
        </div>
      )}
    </div>
  );
}
