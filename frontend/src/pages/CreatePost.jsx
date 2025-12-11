// src/pages/CreatePost.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import RichTextEditor from "../components/RichTextEditor";
import {
  DocumentTextIcon,
  PhotoIcon,
  LinkIcon,
  ChevronDownIcon,
  XMarkIcon,
  PlusIcon,
  VideoCameraIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import defaultProfileImg from "../assets/default_profile.jpeg";

const TABS = [
  { id: "text", label: "Text", icon: DocumentTextIcon },
  { id: "image", label: "Media", icon: PhotoIcon },
  { id: "link", label: "Link", icon: LinkIcon },
];

export default function CreatePost() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const communityFromQuery = searchParams.get("community");
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

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
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);

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
          setCommunitiesError(res.data?.error || "Failed to load communities");
        }
      } catch (err) {
        setCommunitiesError(err.response?.data?.error || err.message || "Failed to load communities");
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
      (c) => c.name.toLowerCase().includes(q) || (c.title && c.title.toLowerCase().includes(q))
    );
  }, [communities, communitySearch]);

  // Image previews
  useEffect(() => {
    const previews = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [imageFiles]);

  const removeImage = (index) => {
    setImageFiles((files) => files.filter((_, i) => i !== index));
  };

  // ---------- submit ----------
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!selectedCommunity) {
      toast.error("Please select a community");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === "image" && (imageFiles.length > 0 || videoFile)) {
        if (videoFile) {
          const createRes = await api.post("/posts", {
            title: title.trim(),
            body: body?.trim() || "",
            communityName: selectedCommunity.name,
            isVideo: true,
          });
          if (!createRes.data?.success) {
            throw new Error(createRes.data?.error || "Failed to create video post");
          }
          const newId = createRes.data.data?._id;
          if (!newId) throw new Error("Missing post id after create");

          const fd = new FormData();
          fd.append("video", videoFile);
          api.post(`/posts/${newId}/videoUpload`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          }).catch((err) => {
            const msg = err.response?.data?.error || err.message || "Video upload failed";
            sessionStorage.setItem(`videoUploadError:${newId}`, msg);
          });

          toast.success("Video post created! Processing...");
          navigate(-1);
        } else {
          const fd = new FormData();
          fd.append("title", title.trim());
          fd.append("communityName", selectedCommunity.name);
          if (body?.trim()) fd.append("body", body.trim());
          imageFiles.forEach((file) => fd.append("images", file));

          const res = await api.post("/posts/image", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          if (!res.data?.success) {
            throw new Error(res.data?.error || "Failed to create image post");
          }
          toast.success("Post created!");
          navigate(-1);
        }
      } else {
        const payload = {
          title: title.trim(),
          body: activeTab === "text" ? body : "",
          communityName: selectedCommunity.name,
          url: activeTab === "link" ? linkUrl.trim() || null : null,
        };

        const res = await api.post("/posts", payload);
        if (!res.data?.success) {
          throw new Error(res.data?.error || "Failed to create post");
        }
        toast.success("Post created!");
        navigate(-1);
      }
    } catch (err) {
      console.error("create post error", err);
      toast.error(err.response?.data?.error || err.message || "Failed to create post");
      setError(err.response?.data?.error || err.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  }

  const titleChars = title.length;
  const titleLimit = 300;

  return (
    <div className="min-h-screen bg-gradient-to-b from-reddit-page to-reddit-hover dark:from-reddit-dark_bg dark:to-reddit-dark_hover">
      <div className="mx-auto max-w-3xl px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-reddit-text dark:text-reddit-dark_text flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 sm:h-7 sm:w-7 text-reddit-blue" />
            Create a post
          </h1>
          <p className="text-xs sm:text-sm text-reddit-text_secondary mt-1">
            Share something with your community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Community Selector */}
          <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-2xl p-3 sm:p-4 border border-reddit-border dark:border-reddit-dark_divider shadow-sm">
            <label className="block text-xs font-semibold uppercase mb-2 text-reddit-text_secondary">
              Choose a community
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider transition-all hover:border-reddit-blue"
              >
                <span className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-reddit-blue to-purple-600 flex items-center justify-center text-white font-bold">
                    {selectedCommunity ? (
                      selectedCommunity.icon ? (
                        <img src={selectedCommunity.icon} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        selectedCommunity.name[0].toUpperCase()
                      )
                    ) : (
                      "r/"
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-reddit-text dark:text-reddit-dark_text">
                      {selectedCommunity ? `r/${selectedCommunity.name}` : "Select community"}
                    </div>
                    {selectedCommunity && (
                      <div className="text-xs text-reddit-text_secondary">
                        {selectedCommunity.membersCount?.toLocaleString() || 0} members
                      </div>
                    )}
                  </div>
                </span>
                <ChevronDownIcon className={`h-5 w-5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-50 mt-2 w-full max-h-80 overflow-y-auto rounded-xl bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider shadow-xl">
                  <div className="sticky top-0 p-3 border-b border-reddit-border dark:border-reddit-dark_divider bg-reddit-card dark:bg-reddit-dark_card">
                    <input
                      type="text"
                      value={communitySearch}
                      onChange={(e) => setCommunitySearch(e.target.value)}
                      placeholder="Search communities..."
                      className="w-full px-3 py-2 rounded-lg bg-reddit-hover dark:bg-reddit-dark_hover text-sm outline-none focus:ring-2 focus:ring-reddit-blue"
                    />
                  </div>

                  {communitiesLoading ? (
                    <div className="p-4 text-center text-reddit-text_secondary">Loading...</div>
                  ) : communitiesError ? (
                    <div className="p-4 text-center text-red-500">{communitiesError}</div>
                  ) : filteredCommunities.length === 0 ? (
                    <div className="p-4 text-center text-reddit-text_secondary">No communities found</div>
                  ) : (
                    <div className="p-2">
                      {filteredCommunities.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => {
                            setSelectedCommunity(c);
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
                        >
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-reddit-blue to-purple-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                            {c.icon ? (
                              <img src={c.icon} alt="" className="h-9 w-9 object-cover" />
                            ) : (
                              c.name[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">r/{c.name}</div>
                            <div className="text-xs text-reddit-text_secondary">
                              {c.membersCount?.toLocaleString() || 0} members
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Post Type Tabs */}
          <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-2xl border border-reddit-border dark:border-reddit-dark_divider shadow-sm overflow-hidden">
            <div className="flex border-b border-reddit-border dark:border-reddit-dark_divider">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-semibold text-sm transition-all ${
                    activeTab === tab.id
                      ? "text-reddit-blue border-b-2 border-reddit-blue bg-reddit-blue/5"
                      : "text-reddit-text_secondary hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <div className="relative">
                  <input
                    value={title}
                    onChange={(e) => {
                      if (e.target.value.length <= titleLimit) setTitle(e.target.value);
                    }}
                    placeholder="An interesting title"
                    className="w-full px-4 py-3 text-lg rounded-xl bg-reddit-hover dark:bg-reddit-dark_hover border-2 border-transparent focus:border-reddit-blue outline-none transition-all"
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${titleChars > titleLimit * 0.9 ? "text-orange-500" : "text-reddit-text_secondary"}`}>
                    {titleChars}/{titleLimit}
                  </span>
                </div>
              </div>

              {/* Text Tab */}
              {activeTab === "text" && (
                <div>
                  <RichTextEditor value={body} onChange={setBody} />
                </div>
              )}

              {/* Link Tab */}
              {activeTab === "link" && (
                <div>
                  <div className="relative">
                    <input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 pl-10 rounded-xl bg-reddit-hover dark:bg-reddit-dark_hover border-2 border-transparent focus:border-reddit-blue outline-none transition-all"
                    />
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-reddit-text_secondary" />
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === "image" && (
                <div className="space-y-4">
                  {/* Image/Video Upload Area */}
                  {imageFiles.length === 0 && !videoFile ? (
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className="border-2 border-dashed border-reddit-border dark:border-reddit-dark_divider rounded-xl p-8 text-center cursor-pointer hover:border-reddit-blue hover:bg-reddit-blue/5 transition-all"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-reddit-hover dark:bg-reddit-dark_hover">
                          <PhotoIcon className="h-10 w-10 text-reddit-text_secondary" />
                        </div>
                        <div>
                          <p className="font-semibold text-reddit-text dark:text-reddit-dark_text">
                            Drag and drop or click to upload
                          </p>
                          <p className="text-sm text-reddit-text_secondary mt-1">
                            Images or videos up to 20MB
                          </p>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              imageInputRef.current?.click();
                            }}
                            className="px-4 py-2 rounded-full bg-reddit-blue text-white text-sm font-medium"
                          >
                            Upload Images
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              videoInputRef.current?.click();
                            }}
                            className="px-4 py-2 rounded-full border border-reddit-border text-sm font-medium hover:bg-reddit-hover"
                          >
                            Upload Video
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Image Previews Grid */}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative rounded-xl overflow-hidden aspect-video bg-reddit-hover dark:bg-reddit-dark_hover">
                              <img src={preview} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          
                          {/* Add More Button */}
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="aspect-video rounded-xl border-2 border-dashed border-reddit-border dark:border-reddit-dark_divider flex flex-col items-center justify-center gap-2 hover:border-reddit-blue hover:bg-reddit-blue/5 transition-all"
                          >
                            <PlusIcon className="h-8 w-8 text-reddit-text_secondary" />
                            <span className="text-sm text-reddit-text_secondary">Add more</span>
                          </button>
                        </div>
                      )}

                      {/* Video Preview */}
                      {videoFile && (
                        <div className="relative rounded-xl overflow-hidden bg-black">
                          <video
                            src={URL.createObjectURL(videoFile)}
                            controls
                            className="w-full max-h-96 object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setVideoFile(null)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hidden Inputs */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setImageFiles((prev) => [...prev, ...Array.from(e.target.files)])}
                    className="hidden"
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setVideoFile(file);
                        setImageFiles([]);
                      }
                    }}
                    className="hidden"
                  />

                  {/* Caption */}
                  <div>
                    <label className="block text-xs font-semibold uppercase mb-2 text-reddit-text_secondary">
                      Caption (optional)
                    </label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={3}
                      placeholder="Add a caption..."
                      className="w-full px-4 py-3 rounded-xl bg-reddit-hover dark:bg-reddit-dark_hover border-2 border-transparent focus:border-reddit-blue outline-none resize-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-reddit-border dark:border-reddit-dark_divider font-semibold text-sm sm:text-base hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedCommunity || !title.trim()}
              className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-full bg-reddit-blue hover:bg-reddit-blue_hover text-white font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Posting...
                </span>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
