// src/pages/SettingsPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronRightIcon, XMarkIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import defaultProfileImg from "../assets/default_profile.jpeg";
import { toast } from "react-hot-toast";

const TABS = [
  { key: "account", label: "Account" },
  { key: "profile", label: "Profile" },
  { key: "privacy", label: "Privacy" },
  { key: "preferences", label: "Preferences" },
  { key: "notifications", label: "Notifications" },
];

// Toggle Switch Component
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-reddit-blue" : "bg-reddit-border dark:bg-reddit-dark_border"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// Settings Row Component
function SettingsRow({ label, description, children, onClick }) {
  return (
    <div 
      className={`flex items-center justify-between py-4 ${onClick ? "cursor-pointer hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover -mx-4 px-4" : ""}`}
      onClick={onClick}
    >
      <div className="flex-1 pr-4">
        <div className="text-sm text-reddit-text dark:text-reddit-dark_text">{label}</div>
        {description && (
          <div className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary mt-0.5">
            {description}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onClick && <ChevronRightIcon className="h-4 w-4 text-reddit-icon dark:text-reddit-dark_icon" />}
      </div>
    </div>
  );
}

// Section Header Component
function SectionHeader({ title }) {
  return (
    <h3 className="text-sm font-semibold text-reddit-text dark:text-reddit-dark_text mb-2 mt-6 first:mt-0">
      {title}
    </h3>
  );
}

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-2xl w-full max-w-md relative shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-reddit-border dark:border-reddit-dark_divider">
          <h2 className="text-lg font-semibold text-reddit-text dark:text-reddit-dark_text">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
          >
            <XMarkIcon className="h-5 w-5 text-reddit-icon dark:text-reddit-dark_icon" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// Password Input with Show/Hide
function PasswordInput({ value, onChange, placeholder, className }) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-reddit-icon hover:text-reddit-text"
      >
        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState(tab || "account");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile edit state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  
  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (tab && TABS.find((t) => t.key === tab)) {
      setActiveTab(tab);
    }
  }, [tab]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/users/me/settings");
      if (res.data?.success) {
        setSettings(res.data.data);
        setDisplayName(res.data.data.displayName || "");
        setBio(res.data.data.bio || "");
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    setSaving(true);
    try {
      const res = await api.patch("/users/me/settings", { [key]: value });
      if (res.data?.success) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        toast.success("Setting updated");
      }
    } catch (err) {
      console.error("Failed to update setting:", err);
      toast.error("Failed to update setting");
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.patch("/users/me/settings", { displayName, bio });
      if (res.data?.success) {
        setSettings((prev) => ({ ...prev, displayName, bio }));
        updateUser({ displayName, bio });
        toast.success("Profile updated");
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleTabClick = (key) => {
    setActiveTab(key);
    navigate(`/settings/${key}`, { replace: true });
  };

  // Password change handler
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setSaving(true);
    try {
      const res = await api.post("/users/me/change-password", {
        currentPassword,
        newPassword
      });
      if (res.data?.success) {
        toast.success("Password changed successfully");
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  // Email change handler
  const handleEmailChange = async () => {
    if (!newEmail || !emailPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setSaving(true);
    try {
      const res = await api.patch("/users/me/email", {
        newEmail,
        password: emailPassword
      });
      if (res.data?.success) {
        toast.success("Email updated successfully");
        setSettings((prev) => ({ ...prev, email: newEmail }));
        setShowEmailModal(false);
        setNewEmail("");
        setEmailPassword("");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update email");
    } finally {
      setSaving(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    
    setSaving(true);
    try {
      const res = await api.delete("/users/me/account", {
        data: { password: deletePassword, confirmText: deleteConfirmText }
      });
      if (res.data?.success) {
        toast.success("Account deleted");
        logout();
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete account");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-reddit-hover dark:bg-reddit-dark_hover border border-reddit-border dark:border-reddit-dark_divider rounded-lg text-sm text-reddit-text dark:text-reddit-dark_text focus:outline-none focus:ring-2 focus:ring-reddit-blue";

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-reddit-text_secondary">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Page Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-reddit-text dark:text-reddit-dark_text mb-4 sm:mb-6">
        Settings
      </h1>

      {/* Tabs Navigation */}
      <div className="flex gap-1 border-b border-reddit-border dark:border-reddit-dark_divider mb-4 sm:mb-6 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabClick(t.key)}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition ${
              activeTab === t.key
                ? "text-reddit-text dark:text-reddit-dark_text border-b-2 border-reddit-blue"
                : "text-reddit-text_secondary dark:text-reddit-dark_text_secondary hover:text-reddit-text dark:hover:text-reddit-dark_text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-xl border border-reddit-border dark:border-reddit-dark_divider p-3 sm:p-4">
        {/* Account Tab */}
        {activeTab === "account" && settings && (
          <div>
            <SectionHeader title="General" />
            <SettingsRow 
              label="Email address"
              onClick={() => setShowEmailModal(true)}
            >
              <span className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                {settings.email}
              </span>
            </SettingsRow>

            <div className="border-t border-reddit-border dark:border-reddit-dark_divider" />
            
            <SectionHeader title="Account Security" />
            <SettingsRow 
              label="Change password"
              description="Update your password to keep your account secure"
              onClick={() => setShowPasswordModal(true)}
            />

            <div className="border-t border-reddit-border dark:border-reddit-dark_divider" />
            
            <SectionHeader title="Advanced" />
            <SettingsRow 
              label="Delete account"
              description="Permanently delete your account and all data"
              onClick={() => setShowDeleteModal(true)}
            />
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && settings && (
          <div>
            <SectionHeader title="Profile Information" />
            
            <div className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4">
              <img
                src={settings.avatar || defaultProfileImg}
                alt="Avatar"
                className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover"
              />
              <div>
                <div className="text-sm font-medium text-reddit-text dark:text-reddit-dark_text">
                  Profile picture
                </div>
                <div className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                  Update from your profile page
                </div>
              </div>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm text-reddit-text dark:text-reddit-dark_text mb-2">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-reddit-text dark:text-reddit-dark_text mb-2">
                  About (Bio)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write something about yourself..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-6 py-2 bg-reddit-blue hover:bg-reddit-blue_hover text-white text-sm font-semibold rounded-full transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === "privacy" && settings && (
          <div>
            <SectionHeader title="Social Interactions" />
            <SettingsRow
              label="Allow people to follow you"
              description="Let people follow you to see your profile posts in their home feed"
            >
              <Toggle
                checked={settings.allowFollowers}
                onChange={(v) => updateSetting("allowFollowers", v)}
                disabled={saving}
              />
            </SettingsRow>
            <SettingsRow
              label="Allow direct messages"
              description="Let other users send you private messages"
            >
              <Toggle
                checked={settings.allowDirectMessages}
                onChange={(v) => updateSetting("allowDirectMessages", v)}
                disabled={saving}
              />
            </SettingsRow>

            <div className="border-t border-reddit-border dark:border-reddit-dark_divider" />
            
            <SectionHeader title="Discoverability" />
            <SettingsRow
              label="Show up in search results"
              description="Allow search engines to link to your profile"
            >
              <Toggle
                checked={settings.showInSearchResults}
                onChange={(v) => updateSetting("showInSearchResults", v)}
                disabled={saving}
              />
            </SettingsRow>
            <SettingsRow
              label="Show online status"
              description="Let others see when you're active on Reddit"
            >
              <Toggle
                checked={settings.showOnlineStatus}
                onChange={(v) => updateSetting("showOnlineStatus", v)}
                disabled={saving}
              />
            </SettingsRow>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && settings && (
          <div>
            <SectionHeader title="Content" />
            <SettingsRow
              label="Show mature content (I'm over 18)"
              description="See NSFW content in your feeds and search results"
            >
              <Toggle
                checked={settings.showNSFW}
                onChange={(v) => updateSetting("showNSFW", v)}
                disabled={saving}
              />
            </SettingsRow>
            <SettingsRow
              label="Blur mature (18+) images and media"
              description="Blur NSFW images until you click on them"
            >
              <Toggle
                checked={settings.blurNSFW}
                onChange={(v) => updateSetting("blurNSFW", v)}
                disabled={saving}
              />
            </SettingsRow>
            <SettingsRow
              label="Show recommendations in home feed"
              description="Get personalized content recommendations"
            >
              <Toggle
                checked={settings.showRecommendations}
                onChange={(v) => updateSetting("showRecommendations", v)}
                disabled={saving}
              />
            </SettingsRow>

            <div className="border-t border-reddit-border dark:border-reddit-dark_divider" />
            
            <SectionHeader title="Accessibility" />
            <SettingsRow
              label="Autoplay media"
              description="Automatically play videos and GIFs"
            >
              <Toggle
                checked={settings.autoplayMedia}
                onChange={(v) => updateSetting("autoplayMedia", v)}
                disabled={saving}
              />
            </SettingsRow>
            <SettingsRow
              label="Reduce motion"
              description="Reduce animations and motion effects"
            >
              <Toggle
                checked={settings.reduceMotion}
                onChange={(v) => updateSetting("reduceMotion", v)}
                disabled={saving}
              />
            </SettingsRow>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && settings && (
          <div>
            <SectionHeader title="Messages" />
            <SettingsRow
              label="Chat message notifications"
              description="Get notified when you receive chat messages"
            >
              <Toggle
                checked={settings.chatMessageNotifications}
                onChange={(v) => updateSetting("chatMessageNotifications", v)}
                disabled={saving}
              />
            </SettingsRow>

            <div className="border-t border-reddit-border dark:border-reddit-dark_divider" />
            
            <SectionHeader title="Activity" />
            <SettingsRow
              label="Replies to your comments"
              description="Notify when someone replies to your comments"
            >
              <Toggle
                checked={settings.commentReplyNotifications}
                onChange={(v) => updateSetting("commentReplyNotifications", v)}
                disabled={saving}
              />
            </SettingsRow>
            <SettingsRow
              label="Username mentions"
              description="Notify when someone mentions your username"
            >
              <Toggle
                checked={settings.mentionNotifications}
                onChange={(v) => updateSetting("mentionNotifications", v)}
                disabled={saving}
              />
            </SettingsRow>
            <SettingsRow
              label="Upvotes on your posts"
              description="Notify when someone upvotes your posts"
            >
              <Toggle
                checked={settings.upvoteNotifications}
                onChange={(v) => updateSetting("upvoteNotifications", v)}
                disabled={saving}
              />
            </SettingsRow>
            <SettingsRow
              label="New followers"
              description="Notify when someone starts following you"
            >
              <Toggle
                checked={settings.newFollowerNotifications}
                onChange={(v) => updateSetting("newFollowerNotifications", v)}
                disabled={saving}
              />
            </SettingsRow>

            <div className="border-t border-reddit-border dark:border-reddit-dark_divider" />
            
            <SectionHeader title="Email" />
            <SettingsRow
              label="Email notifications"
              description="Receive important updates via email"
            >
              <Toggle
                checked={settings.emailNotifications}
                onChange={(v) => updateSetting("emailNotifications", v)}
                disabled={saving}
              />
            </SettingsRow>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      <Modal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-reddit-text dark:text-reddit-dark_text mb-2">
              Current Password
            </label>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-reddit-text dark:text-reddit-dark_text mb-2">
              New Password
            </label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-reddit-text dark:text-reddit-dark_text mb-2">
              Confirm New Password
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="flex-1 px-4 py-2 bg-reddit-hover dark:bg-reddit-dark_hover text-reddit-text dark:text-reddit-dark_text text-sm font-semibold rounded-full"
            >
              Cancel
            </button>
            <button
              onClick={handlePasswordChange}
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              className="flex-1 px-4 py-2 bg-reddit-blue hover:bg-reddit-blue_hover text-white text-sm font-semibold rounded-full disabled:opacity-50"
            >
              {saving ? "Saving..." : "Change Password"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Email Change Modal */}
      <Modal 
        isOpen={showEmailModal} 
        onClose={() => setShowEmailModal(false)}
        title="Change Email"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-reddit-text dark:text-reddit-dark_text mb-2">
              Current Email
            </label>
            <input
              type="text"
              value={settings?.email || ""}
              disabled
              className={`${inputClass} opacity-50`}
            />
          </div>
          <div>
            <label className="block text-sm text-reddit-text dark:text-reddit-dark_text mb-2">
              New Email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-reddit-text dark:text-reddit-dark_text mb-2">
              Password
            </label>
            <PasswordInput
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="Enter your password to confirm"
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowEmailModal(false)}
              className="flex-1 px-4 py-2 bg-reddit-hover dark:bg-reddit-dark_hover text-reddit-text dark:text-reddit-dark_text text-sm font-semibold rounded-full"
            >
              Cancel
            </button>
            <button
              onClick={handleEmailChange}
              disabled={saving || !newEmail || !emailPassword}
              className="flex-1 px-4 py-2 bg-reddit-blue hover:bg-reddit-blue_hover text-white text-sm font-semibold rounded-full disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update Email"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-500 dark:text-red-400">
              ⚠️ This action cannot be undone. All your posts, comments, and data will be permanently deleted.
            </p>
          </div>
          <div>
            <label className="block text-sm text-reddit-text dark:text-reddit-dark_text mb-2">
              Password
            </label>
            <PasswordInput
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-reddit-text dark:text-reddit-dark_text mb-2">
              Type <span className="font-mono font-bold text-red-500">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE"
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-4 py-2 bg-reddit-hover dark:bg-reddit-dark_hover text-reddit-text dark:text-reddit-dark_text text-sm font-semibold rounded-full"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={saving || !deletePassword || deleteConfirmText !== "DELETE"}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-full disabled:opacity-50"
            >
              {saving ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
