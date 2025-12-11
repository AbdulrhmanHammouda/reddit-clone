// src/pages/CommunityPage.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CommunityHeader from "../components/CommunityHeader";
import CommunityFeed from "../components/CommunityFeed";
import CommunitySidebar from "../components/CommunitySidebar";
import CommunityPageSkeleton from "../components/CommunityPageSkeleton";
import EditCommunityModal from "../components/EditCommunityModal";
import SortMenu from "../components/SortMenu";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

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

      const { community: c, posts: p } = res.data.data;

      const normalized = (p || []).map((post) => ({
        ...post,
        saved: !!post.saved, // ensure boolean
        yourVote: post.yourVote ?? 0, // ensure number
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
        setCommunity((c) => ({
          ...c,
          membersCount: res.data.membersCount,
          isMember: true,
          memberRole: c.memberRole || "member",
        }));
      }
    } catch (err) {
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

  if (!community) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-reddit-text dark:text-reddit-dark_text">
        Community not found
      </div>
    );
  }

  return (
    <div className="bg-reddit-page dark:bg-reddit-dark_bg text-reddit-text dark:text-reddit-dark_text min-h-screen">
      <div className="mx-auto w-full max-w-[1200px] px-4 lg:px-6">
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

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
