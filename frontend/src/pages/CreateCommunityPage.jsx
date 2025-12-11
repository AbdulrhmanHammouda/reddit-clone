// src/pages/CreateCommunityPage.jsx
import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import {
  CameraIcon,
  GlobeAltIcon,
  LockClosedIcon,
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import defaultProfileImg from "../assets/default_profile.jpeg";
import defaultBanner from "../assets/default_banner.jpeg";

function validateName(name) {
  if (!name || name.trim().length === 0) return "Name is required.";
  if (!/^[\p{L}\p{N}_]+$/u.test(name)) return "Only letters, numbers, and underscores allowed.";
  if (name.length < 3) return "Name must be at least 3 characters.";
  if (name.length > 21) return "Name must be 21 characters or fewer.";
  return "";
}

export default function CreateCommunityPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [topics, setTopics] = useState([]);
  const [icon, setIcon] = useState(null);
  const [banner, setBanner] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const iconInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const vanity = useMemo(() => name ? name.trim().toLowerCase() : "your_community", [name]);

  const availableTopics = [
    { name: "Gaming", emoji: "🎮" },
    { name: "Tech", emoji: "💻" },
    { name: "Music", emoji: "🎵" },
    { name: "Art", emoji: "🎨" },
    { name: "Anime & Manga", emoji: "🎌" },
    { name: "Film", emoji: "🎬" },
    { name: "Photography", emoji: "📷" },
    { name: "Design", emoji: "✨" },
    { name: "Lifestyle", emoji: "🌿" },
    { name: "Sports", emoji: "⚽" },
    { name: "Science", emoji: "🔬" },
    { name: "News", emoji: "📰" },
    { name: "Memes", emoji: "😂" },
    { name: "Food", emoji: "🍕" },
  ];

  const handleTopicToggle = (topic) => {
    if (topics.includes(topic)) {
      setTopics(topics.filter((t) => t !== topic));
    } else if (topics.length < 3) {
      setTopics([...topics, topic]);
    }
  };

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIcon(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBanner(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const nameErr = validateName(name);
    const descErr = description.length > 500 ? "Description too long" : "";

    const newErrors = {};
    if (nameErr) newErrors.name = nameErr;
    if (descErr) newErrors.description = descErr;
    if (topics.length < 1) newErrors.topics = "Select at least one topic.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const effectiveToken = token || localStorage.getItem("token");
    if (!effectiveToken) return navigate("/login");

    setLoading(true);
    setErrors({});

    try {
      const body = {
        name: name.trim().toLowerCase(),
        title: name.trim(),
        description: description.trim(),
        isPrivate,
        interests: topics,
      };

      const res = await api.post("/communities", body, {
        headers: { Authorization: `Bearer ${effectiveToken}` },
      });

      const communityName = res.data.data.name;

      if (icon) {
        const formIcon = new FormData();
        formIcon.append("icon", icon);
        await api.post(`/communities/${encodeURIComponent(communityName)}/icon`, formIcon, {
          headers: { Authorization: `Bearer ${effectiveToken}` },
        });
      }

      if (banner) {
        const formBanner = new FormData();
        formBanner.append("banner", banner);
        await api.post(`/communities/${encodeURIComponent(communityName)}/banner`, formBanner, {
          headers: { Authorization: `Bearer ${effectiveToken}` },
        });
      }

      toast.success("Community created!");
      navigate(`/r/${communityName}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create community");
      setErrors({ name: err.response?.data?.error || "Failed to create community" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-reddit-text dark:text-reddit-dark_text">
          Create a Community
        </h1>
        <p className="mt-2 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
          Build a home for your community on Reddit
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Community Name */}
          <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-5 border border-reddit-border dark:border-reddit-dark_divider">
            <label className="block text-sm font-semibold uppercase tracking-wider mb-3 text-reddit-text_secondary">
              Community Name
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-reddit-text_secondary font-medium">
                r/
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={21}
                placeholder="community_name"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider text-reddit-text dark:text-reddit-dark_text placeholder:text-reddit-text_secondary focus:outline-none focus:ring-2 focus:ring-reddit-blue focus:border-transparent"
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-reddit-text_secondary">
              <span>{name.length}/21 characters</span>
              {name && !errors.name && <span className="text-green-500">✓ Looks good!</span>}
            </div>
            {errors.name && <p className="mt-2 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-5 border border-reddit-border dark:border-reddit-dark_divider">
            <label className="block text-sm font-semibold uppercase tracking-wider mb-3 text-reddit-text_secondary">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="What is your community about?"
              className="w-full px-4 py-3 rounded-lg bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider text-reddit-text dark:text-reddit-dark_text placeholder:text-reddit-text_secondary focus:outline-none focus:ring-2 focus:ring-reddit-blue focus:border-transparent resize-none"
            />
            <div className="text-right mt-2 text-xs text-reddit-text_secondary">
              {description.length}/500
            </div>
            {errors.description && <p className="mt-2 text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Topics */}
          <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-5 border border-reddit-border dark:border-reddit-dark_divider">
            <label className="block text-sm font-semibold uppercase tracking-wider mb-1 text-reddit-text_secondary">
              Topics
            </label>
            <p className="text-xs text-reddit-text_secondary mb-4">
              Select up to 3 topics that describe your community
            </p>
            <div className="flex flex-wrap gap-2">
              {availableTopics.map((topic) => (
                <button
                  key={topic.name}
                  type="button"
                  onClick={() => handleTopicToggle(topic.name)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    topics.includes(topic.name)
                      ? "bg-reddit-blue text-white"
                      : "bg-reddit-hover dark:bg-reddit-dark_hover text-reddit-text dark:text-reddit-dark_text hover:bg-reddit-border dark:hover:bg-reddit-dark_divider"
                  }`}
                >
                  {topic.emoji} {topic.name}
                </button>
              ))}
            </div>
            {errors.topics && <p className="mt-3 text-sm text-red-500">{errors.topics}</p>}
          </div>

          {/* Community Type */}
          <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-5 border border-reddit-border dark:border-reddit-dark_divider">
            <label className="block text-sm font-semibold uppercase tracking-wider mb-4 text-reddit-text_secondary">
              Community Type
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  !isPrivate
                    ? "border-reddit-blue bg-reddit-blue/10"
                    : "border-reddit-border dark:border-reddit-dark_divider hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
                }`}
              >
                <div className={`p-2 rounded-lg ${!isPrivate ? "bg-reddit-blue text-white" : "bg-reddit-hover dark:bg-reddit-dark_hover"}`}>
                  <GlobeAltIcon className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-reddit-text dark:text-reddit-dark_text">Public</div>
                  <div className="text-sm text-reddit-text_secondary">Anyone can view, post, and comment</div>
                </div>
                {!isPrivate && <CheckIcon className="h-5 w-5 text-reddit-blue ml-auto" />}
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  isPrivate
                    ? "border-reddit-blue bg-reddit-blue/10"
                    : "border-reddit-border dark:border-reddit-dark_divider hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
                }`}
              >
                <div className={`p-2 rounded-lg ${isPrivate ? "bg-reddit-blue text-white" : "bg-reddit-hover dark:bg-reddit-dark_hover"}`}>
                  <LockClosedIcon className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-reddit-text dark:text-reddit-dark_text">Private</div>
                  <div className="text-sm text-reddit-text_secondary">Only approved members can view and post</div>
                </div>
                {isPrivate && <CheckIcon className="h-5 w-5 text-reddit-blue ml-auto" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-reddit-blue hover:bg-reddit-blue_hover text-white font-semibold text-lg disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </span>
            ) : (
              "Create Community"
            )}
          </button>
        </form>

        {/* Preview Section */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-xl border border-reddit-border dark:border-reddit-dark_divider overflow-hidden">
            {/* Banner Preview */}
            <div className="relative h-28 bg-gradient-to-r from-reddit-blue to-purple-600">
              <img
                src={bannerPreview || defaultBanner}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium hover:bg-black/70 transition-colors"
              >
                <CameraIcon className="h-4 w-4" />
                Add Banner
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </div>

            {/* Icon Preview */}
            <div className="relative px-4 -mt-10">
              <div className="relative inline-block">
                <div className="h-20 w-20 rounded-xl border-4 border-reddit-card dark:border-reddit-dark_card overflow-hidden bg-reddit-hover dark:bg-reddit-dark_hover shadow-lg">
                  <img
                    src={iconPreview || defaultProfileImg}
                    alt="Icon preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => iconInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-reddit-blue text-white shadow-lg hover:bg-reddit-blue_hover transition-colors"
                >
                  <CameraIcon className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={iconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Community Info */}
            <div className="p-4 pt-2">
              <h2 className="text-xl font-bold text-reddit-text dark:text-reddit-dark_text">
                r/{vanity}
              </h2>
              <p className="text-sm text-reddit-text_secondary mt-1">
                {description || "Your community description will appear here..."}
              </p>

              {/* Topics Preview */}
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-1 text-xs rounded-full bg-reddit-hover dark:bg-reddit-dark_hover text-reddit-text_secondary"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Type Badge */}
              <div className="flex items-center gap-2 mt-4 text-sm text-reddit-text_secondary">
                {isPrivate ? (
                  <>
                    <LockClosedIcon className="h-4 w-4" />
                    <span>Private community</span>
                  </>
                ) : (
                  <>
                    <GlobeAltIcon className="h-4 w-4" />
                    <span>Public community</span>
                  </>
                )}
              </div>

              {/* Stats Preview */}
              <div className="flex gap-6 mt-4 pt-4 border-t border-reddit-border dark:border-reddit-dark_divider text-sm">
                <div>
                  <div className="font-semibold text-reddit-text dark:text-reddit-dark_text">1</div>
                  <div className="text-reddit-text_secondary">Member</div>
                </div>
                <div>
                  <div className="font-semibold text-reddit-text dark:text-reddit-dark_text">0</div>
                  <div className="text-reddit-text_secondary">Online</div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-reddit-text_secondary mt-4">
            <SparklesIcon className="h-4 w-4 inline mr-1" />
            Live preview of your community
          </p>
        </div>
      </div>
    </div>
  );
}
