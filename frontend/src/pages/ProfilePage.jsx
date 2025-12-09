// src/pages/ProfilePage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import PostCard from "../components/PostCard";
import CommentsList from "../components/CommentsList";
import CommentReplyBox from "../components/CommentReplyBox";
import SortMenu from "../components/SortMenu";
import EditProfileModal from "../components/EditProfileModal";

function ProfileCard({
  profile,
  onFollowToggle,
  isFollowing,
  followLoading,
  loggedInUser,
  moderatedCommunities,
  onEdit,
}) {
  if (!profile) return null;
  const isOwnProfile = loggedInUser?._id === profile._id;
  const [hover, setHover] = useState(false);

  return (
    <div className="bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-reddit-text dark:text-reddit-dark_text truncate">
            {profile.displayName || profile.username}
          </h2>
          <p className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary truncate">
            u/{profile.username}
          </p>
        </div>
        <button className="text-lg text-reddit-icon dark:text-reddit-dark_icon leading-none">
          •••
        </button>
      </div>

      {isOwnProfile ? (
        <button
          className="w-full mb-4 py-1.5 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover text-[13px] font-semibold focus:outline-none focus:ring-0"
          onClick={onEdit}
        >
          Edit Profile
        </button>
      ) : (
        <button
          onClick={onFollowToggle}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          disabled={followLoading}
          aria-pressed={isFollowing}
          className={`w-full mb-4 py-1.5 rounded-full transition text-[13px] font-semibold focus:outline-none focus:ring-0 ${
            followLoading
              ? "opacity-60 cursor-not-allowed"
              : isFollowing
              ? "bg-transparent border border-reddit-border text-reddit-text dark:text-white hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
              : "bg-reddit-blue text-white"
          }`}
        >
          {isFollowing ? (hover ? "Unfollow" : "Following") : "Follow"}
        </button>
      )}

      <div className="flex justify-between text-xs text-reddit-text_light dark:text-reddit-dark_text_light">
        <div>
          <div className="font-semibold text-reddit-text dark:text-reddit-dark_text">
            {profile.followersCount ?? 0}
          </div>
          <div className="text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
            Followers
          </div>
        </div>
        <div>
          <div className="font-semibold text-reddit-text dark:text-reddit-dark_text">
            {(profile.karma ?? 0).toLocaleString()}
          </div>
          <div className="text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
            Karma
          </div>
        </div>
        <div>
          <div className="font-semibold text-reddit-text dark:text-reddit-dark_text">
            {profile.contributions ?? 0}
          </div>
          <div className="text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
            Contributions
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
        <div className="mb-2">
          <span className="font-medium text-reddit-text dark:text-reddit-dark_text">
            {profile.redditAgeYears ?? 0} y
          </span>{" "}
          <span>Reddit Age</span>
        </div>
      </div>

      <div className="h-px bg-reddit-divider dark:bg-reddit-dark_divider my-4" />

      <div className="mb-4">
        <h3 className="text-[11px] font-semibold text-reddit-text_light dark:text-reddit-dark_text_light mb-2">
          MODERATOR OF THESE COMMUNITIES
        </h3>

        {moderatedCommunities?.length > 0 ? (
          <div className="space-y-2">
            {moderatedCommunities.map((c) => (
              <div
                key={c._id || c.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={c.icon || "/default-community.png"}
                    className="h-7 w-7 rounded-full object-cover"
                    alt="community"
                  />
                  <div className="flex flex-col">
                    <span className="text-reddit-text dark:text-reddit-dark_text">
                      r/{c.name}
                    </span>
                    <span className="text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                      {c.membersCount ?? 0} members
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => (window.location.href = `/r/${c.name}`)}
                  className="px-3 py-1 rounded-full bg-reddit-blue text-[11px] font-semibold text-white"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
            No moderated communities
          </p>
        )}
      </div>
    </div>
  );
}

function getPostScore(post) {
  if (!post) return 0;
  return Number(post.score ?? post.votes ?? post.upvotes ?? 0);
}

export default function ProfilePage() {
  const { username } = useParams();
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [moderatedCommunities, setModeratedCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [sort, setSort] = useState("best");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // state for saved posts
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState(null);

  const mountedRef = useRef(true);
  const isOwn = authUser?.username === username;

  // If this is YOUR profile (username === authUser?.username), get your moderated communities via /users/me/communities
  useEffect(() => {
    mountedRef.current = true;
    if (!authLoading && authUser && authUser.username && username === authUser.username) {
      (async () => {
        try {
          const res = await api.get("/users/me/communities");
          const all = res.data?.data || [];
          const mods = all.filter((c) => c.role === "owner" || c.role === "moderator");
          if (mountedRef.current) setModeratedCommunities(mods);
        } catch (err) {
          console.debug("ProfilePage: me/communities failed", err);
        }
      })();
    }
    return () => (mountedRef.current = false);
  }, [authLoading, authUser, username]);

  // lazy load saved when tab is opened
  useEffect(() => {
    let mounted = true;
    async function fetchSaved() {
      if (!isOwn) return;               // don't fetch others' saved
      setSavedLoading(true);
      setSavedError(null);
      try {
        const res = await api.get(`/users/me/saved`); // prefer /users/me/saved for privacy
        if (!mounted) return;
        setSavedPosts(res.data?.data || []);
      } catch (err) {
        if (!mounted) return;
        setSavedError(err.response?.data?.error || err.message || 'Failed to load saved');
      } finally {
        if (mounted) setSavedLoading(false);
      }
    }
    if (activeTab === 'saved' && savedPosts.length === 0 && isOwn) fetchSaved();
    return () => { mounted = false; };
  }, [activeTab, isOwn, savedPosts.length]); // Added savedPosts.length to dependency array

  // lazy load comments when tab opened (if you prefer separate endpoint)
  useEffect(() => {
    let mounted = true;
    async function fetchUserComments() {
      // Only fetch if comments array is empty and tab is active
      if (comments.length > 0) return;

      try {
        const res = await api.get(`/users/${encodeURIComponent(username)}/comments`);
        if (!mounted) return;
        setComments(res.data?.data || []);
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to fetch comments', err);
      }
    }
    if (activeTab === 'comments' && comments.length === 0) fetchUserComments();
    return () => { mounted = false; };
  }, [activeTab, username, comments.length]); // Added comments.length to dependency array

  // load public profile (/users/:username)
  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await api.get(`/users/${encodeURIComponent(username)}`);
        const data = res.data?.data;
        if (!mountedRef.current) return;

        // derive fields
        const createdAt = data?.createdAt ? new Date(data.createdAt) : null;
        const redditAgeYears = createdAt
          ? Math.floor((Date.now() - createdAt) / (365 * 24 * 60 * 60 * 1000))
          : 0;
        const followersCount = data?.followersCount ?? data?.followers ?? 0;
        const karma = data?.karma ?? 0;
        const commentCount = data?.commentCount ?? data?.commentsCount ?? 0;
        const postCount =
          data?.posts && Array.isArray(data.posts) ? data.posts.length : data?.postCount ?? 0;
        const contributions = commentCount + postCount;

        setProfile({
          ...data,
          redditAgeYears,
          followersCount,
          karma,
          contributions,
          moderatedCommunities: data?.moderatedCommunities ?? [],
        });

        // if profile response included moderatedCommunities (for other users), use it
        if (Array.isArray(data?.moderatedCommunities) && data.moderatedCommunities.length) {
          setModeratedCommunities(data.moderatedCommunities);
        }

        setPosts(Array.isArray(data?.posts) ? data.posts : []);
        setComments(Array.isArray(data?.comments) ? data.comments : []);
        setIsFollowing(data?.isFollowing ?? false);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err.response?.data?.error || err.message);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    return () => (mountedRef.current = false);
  }, [username]);

  const handleFollowToggle = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    const currentlyFollowing = isFollowing;
    setIsFollowing(!currentlyFollowing);
    setProfile((p) => ({ ...p, followersCount: (p.followersCount || 0) + (currentlyFollowing ? -1 : 1) }));

    try {
      if (currentlyFollowing) {
        await api.delete(`/users/${profile.username}/follow`);
      } else {
        await api.post(`/users/${profile.username}/follow`);
      }
      // refresh authoritative profile counts
      const res = await api.get(`/users/${encodeURIComponent(profile.username)}`);
      const fresh = res.data?.data;
      if (fresh && mountedRef.current) {
        setProfile((prev) => ({ ...prev, followersCount: fresh.followersCount ?? prev.followersCount }));
        setIsFollowing(fresh.isFollowing ?? false);
      }
    } catch (err) {
      // rollback
      setIsFollowing(currentlyFollowing);
      setProfile((p) => ({ ...p, followersCount: Math.max(0, (p.followersCount||0) + (currentlyFollowing ? 1 : -1)) }));
    } finally {
      if (mountedRef.current) setFollowLoading(false);
    }
  };

  const handlePostCardToggleSave = (postId, isSaved) => {
    if (!isSaved) {
      setSavedPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
    }
  };

  if (loading) return <div className="pt-10 text-center text-reddit-text_secondary dark:text-reddit-dark_text_secondary">Loading profile...</div>;
  if (error) return <div className="pt-10 text-center text-red-500">Error: {error}</div>;

  const sortedPosts = Array.isArray(posts) ? [...posts].sort((a, b) => (sort === "top" || sort === "best" ? getPostScore(b) - getPostScore(a) : 0)) : [];

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-6xl px-4 md:px-6 pt-6 pb-10 flex flex-col lg:flex-row gap-6">
        <section className="flex-1 lg:flex-[2]">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-reddit-hover dark:bg-reddit-dark_hover flex-shrink-0">
              <img src={profile.avatar || "/default-avatar.png"} alt={profile.username} className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-reddit-text dark:text-reddit-dark_text">{profile.displayName || profile.username}</h1>
              <span className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">u/{profile.username}</span>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {(isOwn ? ["overview", "posts", "comments", "saved"] : ["overview", "posts", "comments"]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-full text-sm font-medium ${activeTab === tab ? "bg-reddit-hover dark:bg-reddit-dark_hover text-reddit-text dark:text-reddit-dark_text" : "text-reddit-text_secondary dark:text-reddit-dark_text_secondary hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"}`}>
                {tab === "overview" ? "Overview" : tab === "posts" ? "Posts" : tab === "comments" ? "Comments" : "Saved"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <SortMenu value={sort} onChange={setSort} />
          </div>

          {activeTab === "posts" && (
            <div className="space-y-4">
              {sortedPosts.length === 0 ? <div className="text-sm text-reddit-text_secondary">No posts yet.</div> : sortedPosts.map((post) => <PostCard key={post._id} post={post} />)}
            </div>
          )}

          {activeTab === "overview" && (
            <div>
              <p className="text-sm text-reddit-text_secondary mb-4">Overview</p>
              {comments.length ? (
                <>
                  <CommentReplyBox topLevel onReply={() => {}} onCancel={() => {}} />
                  <CommentsList comments={comments} />
                </>
              ) : (
                <p className="text-sm text-reddit-text_secondary">No recent comments to show.</p>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div>
              {comments.length ? (
                <>
                  <CommentReplyBox topLevel onReply={() => {}} onCancel={() => {}} />
                  <CommentsList comments={comments} />
                </>
              ) : (
                <p className="text-sm text-reddit-text_secondary">No comments yet.</p>
              )}
            </div>
          )}

          {activeTab === "saved" && (
            <div>
              {isOwn ? (
                savedLoading ? (
                  <div className="text-sm text-reddit-text_secondary">Loading saved posts...</div>
                ) : savedError ? (
                  <div className="text-sm text-red-500">Error loading saved posts: {savedError}</div>
                ) : savedPosts.length === 0 ? (
                  <div className="text-sm text-reddit-text_secondary">No saved posts yet.</div>
                ) : (
                  <div className="space-y-4">
                    {savedPosts.map((post) => (
                      <PostCard key={post._id} post={post} onToggleSave={handlePostCardToggleSave} />
                    ))}
                  </div>
                )
              ) : (
                <div className="text-sm text-reddit-text_secondary">
                  This user's saved posts are private.
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="w-full lg:w-80">
          <ProfileCard
            profile={profile}
            onFollowToggle={handleFollowToggle}
            isFollowing={isFollowing}
            followLoading={followLoading}
            loggedInUser={authUser}
            moderatedCommunities={moderatedCommunities}
            onEdit={() => setEditOpen(true)}
          />
        </aside>
      </div>

      {editOpen && <EditProfileModal profile={profile} onClose={() => setEditOpen(false)} onUpdated={() => window.location.reload()} />}
    </div>
  );
}
