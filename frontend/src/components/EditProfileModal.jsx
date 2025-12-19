// src/components/EditProfileModal.jsx
import { useState, useRef } from "react";
import { XMarkIcon, CameraIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import defaultProfileImg from "../assets/default_profile.jpeg";
import defaultBanner from "../assets/default_banner.jpeg";

export default function EditProfileModal({ profile, onClose, onUpdated }) {
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  
  // Preview states
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || null);
  const [bannerPreview, setBannerPreview] = useState(profile.banner || null);
  
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch("/users/me", { displayName, bio });
      toast.success("Profile updated!");
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update profile");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview immediately
    setAvatarPreview(URL.createObjectURL(file));

    const form = new FormData();
    form.append("image", file);

    try {
      setAvatarUploading(true);
      await api.post("/users/upload-avatar", form);
      toast.success("Avatar updated!");
      onUpdated();
    } catch (err) {
      toast.error("Failed to upload avatar");
      setAvatarPreview(profile.avatar || null);
      console.error(err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview immediately
    setBannerPreview(URL.createObjectURL(file));

    const form = new FormData();
    form.append("image", file);

    try {
      setBannerUploading(true);
      await api.post("/users/upload-banner", form);
      toast.success("Banner updated!");
      onUpdated();
    } catch (err) {
      toast.error("Failed to upload banner");
      setBannerPreview(profile.banner || null);
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
      <div className="relative z-[60] w-full max-w-lg bg-reddit-card dark:bg-reddit-dark_card rounded-2xl overflow-hidden border border-reddit-border dark:border-reddit-dark_divider shadow-2xl">
        {/* Banner Section */}
        <div className="relative h-28 bg-gradient-to-r from-reddit-blue to-purple-600">
          <img
            src={bannerPreview || defaultBanner}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          
          {/* Banner Upload Button */}
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
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="relative px-6 -mt-12">
          <div className="relative inline-block">
            <div className="h-24 w-24 rounded-full border-4 border-reddit-card dark:border-reddit-dark_card overflow-hidden bg-reddit-hover dark:bg-reddit-dark_hover">
              <img
                src={avatarPreview || defaultProfileImg}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                </div>
              )}
            </div>
            
            {/* Avatar Upload Button */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-reddit-blue text-white shadow-lg hover:bg-reddit-blue_hover transition-colors"
            >
              <CameraIcon className="h-4 w-4" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Form Section */}
        <div className="p-6 pt-4 space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              placeholder="Your display name"
              className="w-full px-4 py-3 rounded-lg bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider text-reddit-text dark:text-reddit-dark_text placeholder:text-reddit-text_secondary focus:outline-none focus:ring-2 focus:ring-reddit-blue focus:border-transparent transition-all"
            />
            <div className="text-right text-xs text-reddit-text_secondary mt-1">
              {displayName.length}/30
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
              About (Bio)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={4}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-3 rounded-lg bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider text-reddit-text dark:text-reddit-dark_text placeholder:text-reddit-text_secondary focus:outline-none focus:ring-2 focus:ring-reddit-blue focus:border-transparent resize-none transition-all"
            />
            <div className="text-right text-xs text-reddit-text_secondary mt-1">
              {bio.length}/200
            </div>
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
