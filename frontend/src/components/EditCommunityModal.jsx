// src/components/EditCommunityModal.jsx
import { useState, useRef } from "react";
import { XMarkIcon, CameraIcon, LockClosedIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import defaultProfileImg from "../assets/default_profile.jpeg";
import defaultBanner from "../assets/default_banner.jpeg";

export default function EditCommunityModal({ community, onClose, onUpdated }) {
  const [title, setTitle] = useState(community.title || "");
  const [description, setDescription] = useState(community.description || "");
  const [rulesText, setRulesText] = useState(
    (community.rules && community.rules.join("\n")) || ""
  );
  const [isPrivate, setIsPrivate] = useState(!!community.isPrivate);
  const [saving, setSaving] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  // Previews
  const [iconPreview, setIconPreview] = useState(community.icon || null);
  const [bannerPreview, setBannerPreview] = useState(community.banner || null);

  const iconInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      const rulesArr = rulesText
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      await api.patch(`/communities/${encodeURIComponent(community.name)}`, {
        title,
        description,
        isPrivate,
        rules: rulesArr,
      });

      toast.success("Community updated!");
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update community");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIconPreview(URL.createObjectURL(file));

    const form = new FormData();
    form.append("icon", file);

    try {
      setIconUploading(true);
      await api.post(`/communities/${encodeURIComponent(community.name)}/icon`, form);
      toast.success("Icon updated!");
      onUpdated();
    } catch (err) {
      toast.error("Failed to upload icon");
      setIconPreview(community.icon || null);
      console.error(err);
    } finally {
      setIconUploading(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBannerPreview(URL.createObjectURL(file));

    const form = new FormData();
    form.append("banner", file);

    try {
      setBannerUploading(true);
      await api.post(`/communities/${encodeURIComponent(community.name)}/banner`, form);
      toast.success("Banner updated!");
      onUpdated();
    } catch (err) {
      toast.error("Failed to upload banner");
      setBannerPreview(community.banner || null);
      console.error(err);
    } finally {
      setBannerUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />

      {/* Modal */}
      <div className="relative z-60 w-full max-w-xl bg-reddit-card dark:bg-reddit-dark_card rounded-2xl overflow-hidden border border-reddit-border dark:border-reddit-dark_divider shadow-2xl max-h-[90vh] flex flex-col">
        {/* Banner Section */}
        <div className="relative h-28 bg-gradient-to-r from-reddit-blue to-purple-600 flex-shrink-0">
          <img
            src={bannerPreview || defaultBanner}
            alt="Community banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          {/* Banner Upload */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              bannerInputRef.current?.click();
            }}
            disabled={bannerUploading}
            className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium hover:bg-black/70 transition-colors cursor-pointer"
          >
            <CameraIcon className="h-4 w-4" />
            {bannerUploading ? "Uploading..." : "Change Banner"}
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
          />

          {/* Close Button */}
          <button
            onClick={() => !saving && onClose()}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {/* Title in banner */}
          <div className="absolute bottom-2 left-2 text-white">
            <h2 className="text-lg font-bold drop-shadow-lg">Edit Community</h2>
            <p className="text-sm opacity-80">r/{community.name}</p>
          </div>
        </div>

        {/* Icon Section */}
        <div className="relative px-6 -mt-10 z-10 flex-shrink-0">
          <div className="relative inline-block">
            <div className="h-20 w-20 rounded-xl border-4 border-reddit-card dark:border-reddit-dark_card overflow-hidden bg-reddit-hover dark:bg-reddit-dark_hover shadow-lg">
              <img
                src={iconPreview || defaultProfileImg}
                alt="Community icon"
                className="h-full w-full object-cover"
              />
              {iconUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => iconInputRef.current?.click()}
              disabled={iconUploading}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-reddit-blue text-white shadow-lg hover:bg-reddit-blue_hover transition-colors"
            >
              <CameraIcon className="h-3.5 w-3.5" />
            </button>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              onChange={handleIconUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Form Section - Scrollable */}
        <div className="p-6 pt-4 space-y-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
              Display Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              placeholder="Community display name"
              className="w-full px-4 py-3 rounded-lg bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider text-reddit-text dark:text-reddit-dark_text placeholder:text-reddit-text_secondary focus:outline-none focus:ring-2 focus:ring-reddit-blue focus:border-transparent transition-all"
            />
            <div className="text-right text-xs text-reddit-text_secondary mt-1">
              {title.length}/50
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What is this community about?"
              className="w-full px-4 py-3 rounded-lg bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider text-reddit-text dark:text-reddit-dark_text placeholder:text-reddit-text_secondary focus:outline-none focus:ring-2 focus:ring-reddit-blue focus:border-transparent resize-none transition-all"
            />
            <div className="text-right text-xs text-reddit-text_secondary mt-1">
              {description.length}/500
            </div>
          </div>

          {/* Rules */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
              <DocumentTextIcon className="h-4 w-4" />
              Rules (one per line)
            </label>
            <textarea
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              rows={4}
              placeholder="1. Be respectful&#10;2. No spam&#10;3. Stay on topic"
              className="w-full px-4 py-3 rounded-lg bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider text-reddit-text dark:text-reddit-dark_text placeholder:text-reddit-text_secondary focus:outline-none focus:ring-2 focus:ring-reddit-blue focus:border-transparent resize-none transition-all font-mono text-sm"
            />
          </div>

          {/* Private Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-reddit-card dark:bg-reddit-dark_card">
                <LockClosedIcon className="h-5 w-5 text-reddit-text_secondary" />
              </div>
              <div>
                <div className="font-semibold text-sm text-reddit-text dark:text-reddit-dark_text">
                  Private Community
                </div>
                <div className="text-xs text-reddit-text_secondary">
                  Only approved members can view and post
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isPrivate ? "bg-reddit-blue" : "bg-reddit-border dark:bg-reddit-dark_divider"
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                  isPrivate ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => !saving && onClose()}
              disabled={saving}
              className="px-5 py-2.5 rounded-full text-sm font-semibold border border-reddit-border dark:border-reddit-dark_divider hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-full text-sm font-semibold bg-reddit-blue hover:bg-reddit-blue_hover text-white disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
