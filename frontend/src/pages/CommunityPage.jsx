// src/pages/CommunityPage.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CommunityHeader from "../components/CommunityHeader";
import CommunityFeed from "../components/CommunityFeed";
import CommunitySidebar from "../components/CommunitySidebar";
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

  // editing states
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editRulesText, setEditRulesText] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

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
        { headers }
      );

      if (!res?.data?.success) {
        setError(res?.data?.error || "Failed to load community");
        setCommunity(null);
        setPosts([]);
        return;
      }

      const { community: c, posts: p } = res.data.data;
      setCommunity(c);
      setPosts(p || []);
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
  }, [name, token, load]);

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
    setEditTitle(community.title || "");
    setEditDescription(community.description || "");
    setEditIsPrivate(!!community.isPrivate);
    setEditRulesText((community.rules && community.rules.join("\n")) || "");
    setIconFile(null);
    setBannerFile(null);
    setEditError("");
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
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-reddit-text dark:text-reddit-dark_text">
        Loading community...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-reddit-text dark:text-reddit-dark_text">
        <div className="text-red-500">Error: {error}</div>
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
            navigate(`/createpost?community=${encodeURIComponent(community.name)}`)
          }
          onEditCommunity={openEditModal}
        />

        {/* owner quick controls under header */}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex justify-center">
            <div className="w-full max-w-[740px]">
              <CommunityFeed posts={posts} createPost={createPost} />
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
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !savingEdit && setEditing(false)}
          />

          {/* Modal card */}
          <form
            onSubmit={saveEdits}
            className="relative z-60 w-full max-w-lg bg-reddit-card dark:bg-reddit-dark_card rounded-2xl p-6 border border-reddit-border dark:border-reddit-dark_divider shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-reddit-text dark:text-reddit-dark_text">
                Edit Community
              </h2>
              <button
                type="button"
                onClick={() => !savingEdit && setEditing(false)}
                className="text-xl px-2 hover:text-reddit-blue"
              >
                ✕
              </button>
            </div>

            {/* Form fields */}
            <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                  Display Title
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider focus:outline-none focus:ring-2 focus:ring-reddit-blue"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider focus:outline-none focus:ring-2 focus:ring-reddit-blue"
                />
              </div>

              {/* Rules */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                  Rules (one per line)
                </label>
                <textarea
                  value={editRulesText}
                  onChange={(e) => setEditRulesText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-md bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider focus:outline-none focus:ring-2 focus:ring-reddit-blue"
                />
              </div>

              {/* Private */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsPrivate}
                  onChange={(e) => setEditIsPrivate(e.target.checked)}
                  className="accent-reddit-blue"
                />
                Private community
              </label>

              {/* Uploads */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                    Icon (Logo)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIconFile(e.target.files?.[0] ?? null)}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                    Banner Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
                    className="text-sm"
                  />
                </div>
              </div>

              {editError && (
                <div className="text-sm text-red-500 font-medium">{editError}</div>
              )}
            </div>

            {/* Buttons */}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !savingEdit && setEditing(false)}
                className="px-4 py-2 rounded-full text-sm border border-reddit-border dark:border-reddit-dark_divider hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingEdit}
                className="px-5 py-2 rounded-full text-sm font-semibold bg-reddit-blue hover:bg-reddit-blue_hover text-white disabled:opacity-50"
              >
                {savingEdit ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
