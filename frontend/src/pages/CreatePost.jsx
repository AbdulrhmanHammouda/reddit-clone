// src/pages/CreatePost.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import RichTextEditor from "../components/RichTextEditor";

const TABS = ["text", "image", "link"];

export default function CreatePost() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const communityFromQuery = searchParams.get("community");

  // communities + selection
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [communitiesError, setCommunitiesError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [communitySearch, setCommunitySearch] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  // post data
  const [activeTab, setActiveTab] = useState("text");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(""); // HTML string from RichTextEditor
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ---------- load communities ----------
  useEffect(() => {
    (async () => {
      setCommunitiesLoading(true);
      setCommunitiesError("");
      try {
        const res = await api.get("/communities");
        if (res.data?.success) {
          setCommunities(res.data.data || []);
        } else {
          setCommunitiesError(
            res.data?.error || "Failed to load communities"
          );
        }
      } catch (err) {
        setCommunitiesError(
          err.response?.data?.error ||
            err.message ||
            "Failed to load communities"
        );
      } finally {
        setCommunitiesLoading(false);
      }
    })();
  }, []);

  // pre-select from ?community= query
  useEffect(() => {
    if (!communityFromQuery || communities.length === 0) return;
    if (selectedCommunity) return;
    const found = communities.find((c) => c.name === communityFromQuery);
    if (found) setSelectedCommunity(found);
  }, [communityFromQuery, communities, selectedCommunity]);

  const filteredCommunities = useMemo(() => {
    const q = communitySearch.toLowerCase();
    if (!q) return communities;
    return communities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.title && c.title.toLowerCase().includes(q))
    );
  }, [communities, communitySearch]);

  // ---------- submit ----------
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!selectedCommunity) {
      setError("Please select a community.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === "image" && imageFile) {
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("communityName", selectedCommunity.name);
        fd.append("image", imageFile);
        if (body && body.trim()) fd.append("body", body.trim()); // optional caption HTML

        const res = await api.post("/posts/image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (!res.data?.success) {
          throw new Error(res.data?.error || "Failed to create image post");
        }
        navigate(`/r/${selectedCommunity.name}`);
      } else {
        // text or link post
        const payload = {
          title: title.trim(),
          // for text tab we send rich HTML; for link tab body is empty
          body: activeTab === "text" ? body : "",
          communityName: selectedCommunity.name,
          url: activeTab === "link" ? linkUrl.trim() || null : null,
        };

        const res = await api.post("/posts", payload);
        if (!res.data?.success) {
          throw new Error(res.data?.error || "Failed to create post");
        }
        navigate(`/r/${selectedCommunity.name}`);
      }
    } catch (err) {
      console.error("create post error", err);
      setError(
        err.response?.data?.error || err.message || "Failed to create post"
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- UI ----------

  const titleChars = title.length;
  const titleLimit = 300;

  return (
    <div className="bg-reddit-page dark:bg-reddit-dark_bg min-h-screen text-reddit-text dark:text-reddit-dark_text">
      <div className="mx-auto max-w-[920px] px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Create post</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Community picker */}
          <div>
            <label className="block text-xs font-semibold uppercase mb-2">
              Community
            </label>
            <div className="relative inline-block w-full max-w-md">
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-full bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-reddit-hover dark:bg-reddit-dark_hover h-7 w-7 flex items-center justify-center text-xs font-semibold">
                    r/
                  </span>
                  {selectedCommunity
                    ? `r/${selectedCommunity.name}`
                    : "Select a community"}
                </span>
                <span className="text-xs opacity-70">▼</span>
              </button>

              {dropdownOpen && (
                <div className="absolute z-40 mt-2 w-full max-h-72 overflow-y-auto rounded-lg bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider shadow-lg">
                  <div className="p-2 border-b border-reddit-border dark:border-reddit-dark_divider">
                    <input
                      type="text"
                      value={communitySearch}
                      onChange={(e) => setCommunitySearch(e.target.value)}
                      placeholder="Search communities"
                      className="w-full px-2 py-1 rounded-md bg-reddit-hover dark:bg-reddit-dark_hover text-sm outline-none"
                    />
                  </div>

                  {communitiesLoading ? (
                    <div className="p-3 text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                      Loading communities…
                    </div>
                  ) : communitiesError ? (
                    <div className="p-3 text-sm text-red-500">
                      {communitiesError}
                    </div>
                  ) : filteredCommunities.length === 0 ? (
                    <div className="p-3 text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                      No communities found.
                    </div>
                  ) : (
                    filteredCommunities.map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => {
                          setSelectedCommunity(c);
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
                      >
                        <span className="h-7 w-7 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover flex items-center justify-center text-xs font-semibold">
                          r/
                        </span>
                        <div>
                          <div className="font-semibold">r/{c.name}</div>
                          {c.description && (
                            <div className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary line-clamp-1">
                              {c.description}
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-reddit-border dark:border-reddit-dark_divider mb-2 flex gap-4 text-sm">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-2 -mb-px border-b-2 ${
                  activeTab === tab
                    ? "border-reddit-blue text-reddit-blue font-semibold"
                    : "border-transparent text-reddit-text_secondary dark:text-reddit-dark_text_secondary"
                }`}
              >
                {tab === "text"
                  ? "Text"
                  : tab === "image"
                  ? "Images & Video"
                  : "Link"}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">
              Title<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                value={title}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.length <= titleLimit) setTitle(v);
                }}
                className="w-full px-3 py-2 rounded-md bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider outline-none"
                placeholder="Title"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                {titleChars}/{titleLimit}
              </span>
            </div>
          </div>

          {/* Body / link / image based on tab */}
          {activeTab === "text" && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Body (optional)
              </label>

              <RichTextEditor value={body} onChange={setBody} />
            </div>
          )}

          {activeTab === "link" && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Link URL
              </label>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 rounded-md bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider outline-none"
              />
            </div>
          )}

          {activeTab === "image" && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Image / video
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {imageFile && (
                <div className="mt-1 text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                  Selected: {imageFile.name}
                </div>
              )}

              <label className="block text-xs font-semibold uppercase mt-4 mb-1">
                Caption (optional)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-md bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider outline-none resize-vertical"
              />
            </div>
          )}

          {error && <div className="text-sm text-red-500">{error}</div>}

          {/* actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-full border border-reddit-border dark:border-reddit-dark_divider bg-reddit-card dark:bg-reddit-dark_card text-sm hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-full bg-reddit-blue text-white font-semibold text-sm disabled:opacity-60"
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
