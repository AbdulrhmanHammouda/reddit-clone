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
  const { user, token } = useAuth();

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

  // compute owner flag (defensive: community.createdBy might be id or populated object)
  const isOwner = useMemo(() => {
    if (!community || !user) return false;
    if (community.memberRole === "owner") return true;
    if (!community.createdBy) return false;
    const createdById =
      typeof community.createdBy === "string"
        ? community.createdBy
        : community.createdBy?._id ?? community.createdBy;
    const userId = user?.id ?? user?._id ?? user?.uid ?? null;
    if (!userId) return false;
    return createdById?.toString() === userId?.toString();
  }, [community, user]);

  // load community + posts
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // backend expects community name (typically lowercase) — we pass route name
      const res = await api.get(
        `/communities/${encodeURIComponent(name)}/posts`
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
  }, [name]);

  useEffect(() => {
    if (!name) return;
    load();
  }, [name, load]);

  // ---------- join / leave ----------
  async function joinCommunity() {
    if (!community) return;
    if (isOwner) return; // owner doesn't join/leave
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
      // optionally show notification
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

  // when starting editing, prefill the form
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

  // generic upload helper: posts multipart to /communities/:name/icon or /banner
  async function uploadFile(fieldName, file) {
    if (!community || !file) return null;
    const fd = new FormData();
    fd.append(fieldName, file);
    try {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await api.post(
        `/communities/${encodeURIComponent(community.name)}/${fieldName}`,
        fd,
        { headers }
      );
      // handle different possible response shapes
      if (!res?.data) throw new Error("Upload failed (no response)");
      // prefer res.data.data[fieldName]
      if (
        res.data.data &&
        (res.data.data[fieldName] || res.data.data.icon || res.data.data.banner)
      ) {
        return (
          res.data.data[fieldName] || res.data.data.icon || res.data.data.banner
        );
      }
      // maybe returns { icon: url } or { banner: url }
      if (res.data.icon || res.data.banner)
        return res.data.icon || res.data.banner;
      // fallback: return res.data.data or url string
      return res.data.data ?? null;
    } catch (err) {
      console.error("uploadFile error", err);
      throw err;
    }
  }

  // submit edits
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

      // update local community state with returned value (and preserve member flags if any)
      const updated = patchRes.data.data;
      setCommunity((prev) => ({
        ...prev,
        ...updated,
        isOwner: true, // owner stays owner
        isMember: true, // owner is always member
        memberRole: "owner", // keep role
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

  // headerOnJoin: if owner, undefined (header component should hide join). Otherwise choose based on membership.
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
          onCreatePost={() => {
            const title = prompt("Post title");
            if (!title) return;
            createPost({ title, body: "" });
          }}
          joinLoading={joinLoading}
        />

        {/* owner quick controls */}
        {isOwner && (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => openEditModal()}
              className="bg-transparent border border-reddit-border dark:border-reddit-dark_divider rounded-full px-4 py-2 text-sm hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition"
            >
              Edit Community
            </button>
            <button
              onClick={() => navigate(`/r/${community.name}/moderation`)}
              className="h-10 rounded-full bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider px-3 py-2 text-sm hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition"
            >
              Mod Tools
            </button>
          </div>
        )}

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
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-start justify-center pt-10 px-4"
        >
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !savingEdit && setEditing(false)}
          />
          <form
            onSubmit={saveEdits}
            className="relative z-70 w-full max-w-2xl bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-lg p-6 shadow-lg"
          >
            <h2 className="text-lg font-semibold mb-3">Edit Community</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">
                  Display Title
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-transparent border border-reddit-border dark:border-reddit-dark_divider"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 rounded-md bg-transparent border border-reddit-border dark:border-reddit-dark_divider"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Rules (one per line)
                </label>
                <textarea
                  value={editRulesText}
                  onChange={(e) => setEditRulesText(e.target.value)}
                  rows={4}
                  className="w-full mt-1 px-3 py-2 rounded-md bg-transparent border border-reddit-border dark:border-reddit-dark_divider"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editIsPrivate}
                    onChange={(e) => setEditIsPrivate(e.target.checked)}
                  />
                  <span className="text-sm">Private community</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium">Icon (logo)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIconFile(e.target.files?.[0] ?? null)}
                />
                {iconFile && (
                  <div className="text-sm mt-1">{iconFile.name}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Banner</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
                />
                {bannerFile && (
                  <div className="text-sm mt-1">{bannerFile.name}</div>
                )}
              </div>

              {editError && (
                <div className="text-sm text-red-500">{editError}</div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={savingEdit}
                className="px-4 py-2 rounded-md bg-reddit-blue text-white font-semibold disabled:opacity-60"
              >
                {savingEdit ? "Saving…" : "Save changes"}
              </button>

              <button
                type="button"
                onClick={() => !savingEdit && setEditing(false)}
                className="px-4 py-2 rounded-md bg-reddit-card dark:bg-reddit-dark_card border text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
