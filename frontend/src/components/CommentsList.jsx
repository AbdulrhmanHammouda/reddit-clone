import Comment from "./Comment";

export default function CommentsList({ comments, postId }) {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-sm text-reddit-text_secondary mt-4">
        No comments yet.
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {comments.map((c) => (
        <Comment key={c.id} comment={c} postId={postId} />
      ))}
    </div>
  );
}
