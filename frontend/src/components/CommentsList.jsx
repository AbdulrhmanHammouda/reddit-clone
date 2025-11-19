import Comment from "./Comment";

export default function CommentsList({ postId }) {
  // mocked comment tree
  const comments = [
    {
      id: 1,
      author: "alice",
      time: "1h",
      text: "This is a top-level comment.",
      score: 12,
      replies: [
        {
          id: 11,
          author: "bob",
          time: "45m",
          text: "This is a reply.",
          score: 3,
          replies: [],
        },
      ],
    },
    {
      id: 2,
      author: "charlie",
      time: "2h",
      text: "Another comment with no replies.",
      score: 5,
      replies: [],
    },
  ];

  return (
    <section className="mt-2">
      <div className="text-sm text-reddit-text_secondary font-semibold mb-3">{comments.length} Comments</div>

      <div className="flex flex-col gap-3">
        {comments.map((c) => (
          <Comment key={c.id} comment={c} />
        ))}
      </div>
    </section>
  );
}
