// src/pages/CommunityPage.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import CommunityHeader from "../components/CommunityHeader";
import CommunityFeed from "../components/CommunityFeed";
import CommunitySidebar from "../components/CommunitySidebar";
import CommunityPageSkeleton from "../components/CommunityPageSkeleton";
import EditCommunityModal from "../components/EditCommunityModal";
import SortMenu from "../components/SortMenu";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import { LockClosedIcon, UserGroupIcon, ClockIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import defaultBanner from "../assets/default_banner.jpeg";
import defaultProfileImg from "../assets/default_profile.jpeg";

export default function CommunityPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("best");
  const [time, setTime] = useState("all");
  const [isPrivateRestricted, setIsPrivateRestricted] = useState(false);

  // editing state
  const [editing, setEditing] = useState(false);

  // trust backend flag
  const isOwner = !!community?.isOwner;

  // load community + posts
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // include token in headers so backend returns yourVote & score
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await api.get(
        `/communities/${encodeURIComponent(name)}/posts`,
        {
          headers,
          params: {
            sort,
            time: sort === "top" ? time : undefined,
          },
        }
      );

      if (!res?.data?.success) {
        setError(res?.data?.error || "Failed to load community");
        setCommunity(null);
        setPosts([]);
        return;
      }

      const { community: c, posts: p, isPrivateRestricted: restricted } = res.data.data;

      // Check if this is a private restricted response
      if (restricted) {
        setCommunity(c);
        setPosts([]);
        setIsPrivateRestricted(true);
        return;
      }

      setIsPrivateRestricted(false);
      const normalized = (p || []).map((post) => ({
        ...post,
        saved: !!post.saved,
        yourVote: post.yourVote ?? 0,
      }));

      setCommunity(c);
      setPosts(normalized);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load");
      setCommunity(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [name, token]);

  useEffect(() => {
    if (!name) return;
    load();
  }, [name, token, load, sort, time]);

  const sortedPosts = useMemo(() => {
    const arr = [...posts];
    if (sort === "new") {
      return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (sort === "top" || sort === "best") {
      return arr.sort(
        (a, b) => Number(b.score ?? b.votes ?? 0) - Number(a.score ?? a.votes ?? 0)
      );
    }
    return arr;
  }, [posts, sort]);

  // ---------- join / leave ----------
  async function joinCommunity() {
    if (!community) return;
    if (isOwner) return;
    setJoinLoading(true);
    try {
      const res = await api.post(
        `/communities/${encodeURIComponent(community.name)}/join`
      );
      if (res?.data?.success) {
        // Check if this was a join request for private community
        if (res.data.requestPending) {
          toast.success(res.data.message || "Join request submitted!");
          setCommunity((c) => ({
            ...c,
            requestPending: true,
          }));
        } else {
          toast.success("Joined community!");
          setCommunity((c) => ({
            ...c,
            membersCount: res.data.membersCount,
            isMember: true,
            memberRole: c.memberRole || "member",
          }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to join");
      console.error("Join error", err);
    } finally {
      setJoinLoading(false);
    }
  }

  async function leaveCommunity() {
    if (!community) return;
    if (isOwner) return;
    setJoinLoading(true);
    try {
      const res = await api.post(
        `/communities/${encodeURIComponent(community.name)}/leave`
      );
      if (res?.data?.success) {
        setCommunity((c) => ({
          ...c,
          membersCount: res.data.membersCount,
          isMember: false,
          memberRole: null,
        }));
      }
    } catch (err) {
      console.error("Leave error", err);
    } finally {
      setJoinLoading(false);
    }
  }

  // ---------- create post ----------
  async function createPost(payload) {
    if (!community) return null;
    try {
      const body = {
        title: payload?.title || "Untitled post",
        body: payload?.body || "",
        communityName: community.name,
        url: payload?.url || null,
      };
      const res = await api.post("/posts", body);
      if (res?.data?.success) {
        setPosts((prev) => [res.data.data, ...prev]);
        return res.data.data;
      }
      return null;
    } catch (err) {
      console.error("Create post error", err);
      return null;
    }
  }

  // ---------- EDIT / UPLOAD ----------

  function openEditModal() {
    if (!community) return;
    setEditing(true);
  }

  // upload to /communities/:name/icon or /banner
  async function uploadFile(fieldName, file) {
    if (!community || !file) return null;
    const fd = new FormData();
    fd.append(fieldName, file);
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await api.post(
      `/communities/${encodeURIComponent(community.name)}/${fieldName}`,
      fd,
      { headers }
    );

    if (!res?.data) throw new Error("Upload failed (no response)");

    if (
      res.data.data &&
      (res.data.data[fieldName] || res.data.data.icon || res.data.data.banner)
    ) {
      return (
        res.data.data[fieldName] || res.data.data.icon || res.data.data.banner
      );
    }

    if (res.data.icon || res.data.banner) {
      return res.data.icon || res.data.banner;
    }

    return res.data.data ?? null;
  }

  async function saveEdits(e) {
    e?.preventDefault?.();
    if (!community || !isOwner) return;
    setSavingEdit(true);
    setEditError("");

    try {
      let iconUrl = null;
      let bannerUrl = null;

      if (iconFile) {
        iconUrl = await uploadFile("icon", iconFile);
      }
      if (bannerFile) {
        bannerUrl = await uploadFile("banner", bannerFile);
      }

      const rulesArr = editRulesText
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      const body = {
        title: editTitle,
        description: editDescription,
        isPrivate: !!editIsPrivate,
        rules: rulesArr,
      };
      if (iconUrl) body.icon = iconUrl;
      if (bannerUrl) body.banner = bannerUrl;

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const patchRes = await api.patch(
        `/communities/${encodeURIComponent(community.name)}`,
        body,
        { headers }
      );
      if (!patchRes?.data?.success) {
        throw new Error(patchRes?.data?.error || "Failed to save community");
      }

      const updated = patchRes.data.data;
      setCommunity((prev) => ({
        ...prev,
        ...updated,
        isOwner: true,
        isMember: true,
        memberRole: "owner",
      }));

      setEditing(false);
    } catch (err) {
      console.error("Save edit error", err);
      setEditError(
        err.response?.data?.error || err.message || "Failed to save"
      );
    } finally {
      setSavingEdit(false);
    }
  }

  // headerOnJoin: undefined when owner → header hides join
  const headerOnJoin = useMemo(() => {
    if (!community) return undefined;
    if (isOwner) return undefined;
    return community.isMember ? leaveCommunity : joinCommunity;
  }, [community, isOwner]);

  // ---------- Render ----------

  if (loading) {
    return <CommunityPageSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-reddit-text dark:text-reddit-dark_text">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-full bg-reddit-blue text-white font-medium hover:bg-reddit-blue_hover transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // 🔒 Private Community Restricted View
  if (isPrivateRestricted && community) {
    return (
      <div className="bg-reddit-page dark:bg-reddit-dark_bg min-h-screen">
        <div className="mx-auto w-full max-w-[800px] px-3 sm:px-4 lg:px-6">
          {/* Banner */}
          <div className="w-full h-28 sm:h-40 rounded-b-xl overflow-hidden bg-gradient-to-r from-reddit-blue to-purple-600 relative">
            <img
              src={community.banner || defaultBanner}
              alt="Community banner"
              className="w-full h-full object-cover opacity-50"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Content Card */}
          <div className="relative -mt-12 sm:-mt-16 mx-2 sm:mx-4">
            <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-2xl p-5 sm:p-8 border border-reddit-border dark:border-reddit-dark_divider shadow-xl text-center">
              {/* Icon with lock badge */}
              <div className="relative inline-block mb-3 sm:mb-4">
                <img
                  src={community.icon && community.icon !== "/default-community.png" ? community.icon : defaultProfileImg}
                  alt={community.name}
                  className="h-18 w-18 sm:h-24 sm:w-24 rounded-xl object-cover border-4 border-reddit-card dark:border-reddit-dark_card shadow-lg mx-auto"
                />
                <div className="absolute -bottom-2 -right-2 p-1.5 sm:p-2 rounded-full bg-reddit-text dark:bg-reddit-dark_text text-white dark:text-reddit-dark_bg shadow-lg">
                  <LockClosedIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>

              {/* Community Info */}
              <h1 className="text-xl sm:text-2xl font-bold text-reddit-text dark:text-reddit-dark_text mb-1">
                r/{community.name}
              </h1>
              <h2 className="text-base sm:text-lg text-reddit-text_secondary dark:text-reddit-dark_text_secondary mb-3 sm:mb-4">
                {community.title || community.name}
              </h2>

              {/* Private Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover text-reddit-text_secondary mb-6">
                <LockClosedIcon className="h-4 w-4" />
                <span className="font-medium">Private Community</span>
              </div>

              {/* Description */}
              <p className="text-reddit-text_secondary dark:text-reddit-dark_text_secondary mb-6 max-w-md mx-auto">
                This is a private community. Only approved members can view posts and participate.
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-8 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5 text-reddit-text_secondary" />
                  <span className="font-semibold text-reddit-text dark:text-reddit-dark_text">
                    {community.membersCount ?? 0}
                  </span>
                  <span className="text-reddit-text_secondary">members</span>
                </div>
              </div>

              {/* Request Access Button */}
              {token ? (
                community.requestPending ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-semibold">
                      <ClockIcon className="h-5 w-5" />
                      Request Pending
                    </div>
                    <p className="text-sm text-reddit-text_secondary">
                      A moderator will review your request
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={joinCommunity}
                    disabled={joinLoading}
                    className="px-8 py-3 rounded-full bg-reddit-blue hover:bg-reddit-blue_hover text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    {joinLoading ? "Requesting..." : "Request to Join"}
                  </button>
                )
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="px-8 py-3 rounded-full bg-reddit-blue hover:bg-reddit-blue_hover text-white font-semibold transition-colors"
                >
                  Log in to Request Access
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-reddit-text dark:text-reddit-dark_text">
        Community not found
      </div>
    );
  }

  return (
    <div className="bg-reddit-page dark:bg-reddit-dark_bg text-reddit-text dark:text-reddit-dark_text min-h-screen">
      <div className="mx-auto w-full max-w-[1200px] px-2 sm:px-4 lg:px-6">
        <CommunityHeader
          community={community}
          onJoin={headerOnJoin}
          joinLoading={joinLoading}
          onCreatePost={() =>
            navigate(
              `/createpost?community=${encodeURIComponent(community.name)}`
            )
          }
          onEditCommunity={openEditModal}
        />

        {/* owner quick controls under header */}

        <div className="mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 flex justify-center">
            <div className="w-full max-w-[740px]">
              <div className="mb-4 flex items-center justify-between">
                <SortMenu
                  value={sort}
                  time={time}
                  onChange={({ sort: nextSort, time: nextTime = "all" }) => {
                    setSort(nextSort);
                    setTime(nextSort === "top" ? nextTime : "all");
                  }}
                />
              </div>
              <CommunityFeed
                posts={sortedPosts}
                createPost={createPost}
                onToggleSave={(postId, saved) => {
                  setPosts((prev) =>
                    prev.map((p) => (p._id === postId ? { ...p, saved } : p))
                  );
                }}
                onDelete={(postId) => {
                  setPosts((prev) => prev.filter((p) => p._id !== postId));
                }}
              />
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="w-[320px] space-y-4">
              <CommunitySidebar community={community} />
            </div>
          </aside>
        </div>
      </div>

      {/* Edit modal */}
      {editing && community && (
        <EditCommunityModal
          community={community}
          onClose={() => setEditing(false)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
