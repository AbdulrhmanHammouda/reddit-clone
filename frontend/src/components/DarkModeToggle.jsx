// PostCardFull.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import CommentsList from "./CommentsList";  // Component to list all comments for the post

export default function PostCardFull({ postId }) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const res = await api.get(`/posts/${postId}`);
        setPost(res.data.data);
        
        const commentRes = await api.get(`/comments/post/${postId}`);
        setComments(commentRes.data.data.comments);
      } catch (err) {
        console.error("Error fetching post data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostData();
  }, [postId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
      <div>
        <strong>Comments:</strong>
        <CommentsList comments={comments} />
      </div>
    </div>
  );
}
