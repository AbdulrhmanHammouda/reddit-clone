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
  CheckIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
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

  const [step, setStep] = useState(1);
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

  const vanity = useMemo(() => name ? name.trim().toLowerCase() : "community_name", [name]);
  const nameError = useMemo(() => name ? validateName(name) : "", [name]);

  const availableTopics = [
    { name: "Gaming", emoji: "🎮", color: "from-purple-500 to-indigo-600" },
    { name: "Tech", emoji: "💻", color: "from-blue-500 to-cyan-500" },
    { name: "Music", emoji: "🎵", color: "from-pink-500 to-rose-500" },
    { name: "Art", emoji: "🎨", color: "from-orange-400 to-pink-500" },
    { name: "Anime", emoji: "🎌", color: "from-red-500 to-pink-500" },
    { name: "Film", emoji: "🎬", color: "from-amber-500 to-orange-500" },
    { name: "Photography", emoji: "📷", color: "from-teal-500 to-emerald-500" },
    { name: "Design", emoji: "✨", color: "from-violet-500 to-purple-500" },
    { name: "Sports", emoji: "⚽", color: "from-green-500 to-emerald-500" },
    { name: "Science", emoji: "🔬", color: "from-cyan-500 to-blue-500" },
    { name: "Memes", emoji: "😂", color: "from-yellow-400 to-orange-500" },
    { name: "Food", emoji: "🍕", color: "from-red-400 to-orange-400" },
  ];

  const handleTopicToggle = (topic) => {
    if (topics.includes(topic)) {
      setTopics(topics.filter((t) => t !== topic));
    } else if (topics.length < 3) {
      setTopics([...topics, topic]);
    } else {
      toast.error("Maximum 3 topics allowed");
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

  const canProceedStep1 = name.length >= 3 && !nameError;
  const canProceedStep2 = topics.length >= 1;

  const onSubmit = async () => {
    if (!canProceedStep1 || !canProceedStep2) return;

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

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
              step === s
                ? "bg-reddit-blue text-white scale-110"
                : step > s
                ? "bg-green-500 text-white"
                : "bg-reddit-hover dark:bg-reddit-dark_hover text-reddit-text_secondary"
            }`}
          >
            {step > s ? <CheckIcon className="h-5 w-5" /> : s}
          </div>
          {s < 3 && (
            <div
              className={`w-12 h-1 mx-1 rounded-full transition-colors ${
                step > s ? "bg-green-500" : "bg-reddit-border dark:bg-reddit-dark_divider"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-reddit-page via-reddit-page to-reddit-hover dark:from-reddit-dark_bg dark:via-reddit-dark_bg dark:to-reddit-dark_hover">
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-reddit-blue to-purple-600 text-white mb-4">
            <UserGroupIcon className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-reddit-text dark:text-reddit-dark_text">
            Create Your Community
          </h1>
          <p className="mt-2 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
            Build a home for your community on Reddit
          </p>
        </div>

        <StepIndicator />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form Section - 3 columns */}
          <div className="lg:col-span-3">
            {/* Step 1: Name & Description */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-2xl p-6 border border-reddit-border dark:border-reddit-dark_divider shadow-lg">
                  <h2 className="text-xl font-bold text-reddit-text dark:text-reddit-dark_text mb-1">
                    Name your community
                  </h2>
                  <p className="text-sm text-reddit-text_secondary mb-6">
                    Choose a unique name that represents your community
                  </p>

                  {/* Name Input */}
                  <div className="relative mb-6">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-reddit-blue">
                      r/
                    </div>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={21}
                      placeholder="community_name"
                      className={`w-full pl-12 pr-4 py-4 text-lg rounded-xl bg-reddit-hover dark:bg-reddit-dark_hover border-2 transition-all ${
                        nameError
                          ? "border-red-500 focus:border-red-500"
                          : name && !nameError
                          ? "border-green-500 focus:border-green-500"
                          : "border-transparent focus:border-reddit-blue"
                      } text-reddit-text dark:text-reddit-dark_text placeholder:text-reddit-text_secondary focus:outline-none`}
                    />
                    {name && !nameError && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-sm mb-4">
                    <span className={nameError ? "text-red-500" : "text-reddit-text_secondary"}>
                      {nameError || "Community names can't be changed later"}
                    </span>
                    <span className="text-reddit-text_secondary">{name.length}/21</span>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-reddit-text dark:text-reddit-dark_text mb-2">
                      Description <span className="font-normal text-reddit-text_secondary">(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={500}
                      rows={4}
                      placeholder="What is your community about?"
                      className="w-full px-4 py-3 rounded-xl bg-reddit-hover dark:bg-reddit-dark_hover border-2 border-transparent focus:border-reddit-blue text-reddit-text dark:text-reddit-dark_text placeholder:text-reddit-text_secondary focus:outline-none resize-none transition-all"
                    />
                    <div className="text-right text-sm text-reddit-text_secondary mt-1">
                      {description.length}/500
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="w-full py-4 rounded-xl bg-reddit-blue hover:bg-reddit-blue_hover text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Step 2: Topics & Type */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                {/* Topics */}
                <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-2xl p-6 border border-reddit-border dark:border-reddit-dark_divider shadow-lg">
                  <h2 className="text-xl font-bold text-reddit-text dark:text-reddit-dark_text mb-1">
                    Choose topics
                  </h2>
                  <p className="text-sm text-reddit-text_secondary mb-6">
                    Select up to 3 topics to help people discover your community
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableTopics.map((topic) => {
                      const isSelected = topics.includes(topic.name);
                      return (
                        <button
                          key={topic.name}
                          type="button"
                          onClick={() => handleTopicToggle(topic.name)}
                          className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                            isSelected
                              ? `bg-gradient-to-r ${topic.color} text-white shadow-lg scale-[1.02]`
                              : "bg-reddit-hover dark:bg-reddit-dark_hover hover:scale-[1.02]"
                          }`}
                        >
                          <div className="text-2xl mb-1">{topic.emoji}</div>
                          <div className="font-semibold text-sm">{topic.name}</div>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <CheckCircleIcon className="h-5 w-5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {topics.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-sm text-reddit-text_secondary">Selected:</span>
                      {topics.map((t) => (
                        <span
                          key={t}
                          className="px-3 py-1 rounded-full bg-reddit-blue/20 text-reddit-blue text-sm font-medium flex items-center gap-1"
                        >
                          {t}
                          <button onClick={() => handleTopicToggle(t)} className="hover:text-red-500">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Type Selection */}
                <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-2xl p-6 border border-reddit-border dark:border-reddit-dark_divider shadow-lg">
                  <h2 className="text-xl font-bold text-reddit-text dark:text-reddit-dark_text mb-4">
                    Community type
                  </h2>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
                        !isPrivate
                          ? "border-reddit-blue bg-reddit-blue/10"
                          : "border-reddit-border dark:border-reddit-dark_divider hover:border-reddit-blue/50"
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${!isPrivate ? "bg-reddit-blue text-white" : "bg-reddit-hover dark:bg-reddit-dark_hover"}`}>
                        <GlobeAltIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-reddit-text dark:text-reddit-dark_text">Public</div>
                        <div className="text-sm text-reddit-text_secondary">Anyone can view and join</div>
                      </div>
                      {!isPrivate && <CheckCircleIcon className="h-6 w-6 text-reddit-blue" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
                        isPrivate
                          ? "border-reddit-blue bg-reddit-blue/10"
                          : "border-reddit-border dark:border-reddit-dark_divider hover:border-reddit-blue/50"
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${isPrivate ? "bg-reddit-blue text-white" : "bg-reddit-hover dark:bg-reddit-dark_hover"}`}>
                        <LockClosedIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-reddit-text dark:text-reddit-dark_text">Private</div>
                        <div className="text-sm text-reddit-text_secondary">Requires approval to join</div>
                      </div>
                      {isPrivate && <CheckCircleIcon className="h-6 w-6 text-reddit-blue" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 rounded-xl border-2 border-reddit-border dark:border-reddit-dark_divider font-bold text-lg hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                    className="flex-[2] py-4 rounded-xl bg-reddit-blue hover:bg-reddit-blue_hover text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Customize */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-2xl p-6 border border-reddit-border dark:border-reddit-dark_divider shadow-lg">
                  <h2 className="text-xl font-bold text-reddit-text dark:text-reddit-dark_text mb-1">
                    Customize your community
                  </h2>
                  <p className="text-sm text-reddit-text_secondary mb-6">
                    Add visuals to make your community stand out
                  </p>

                  {/* Banner Upload */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-reddit-text dark:text-reddit-dark_text mb-2">
                      Banner Image
                    </label>
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className="relative h-32 rounded-xl overflow-hidden cursor-pointer group bg-gradient-to-r from-reddit-blue to-purple-600"
                    >
                      <img
                        src={bannerPreview || defaultBanner}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <CameraIcon className="h-6 w-6" />
                          {bannerPreview ? "Change Banner" : "Add Banner"}
                        </div>
                      </div>
                    </div>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </div>

                  {/* Icon Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-reddit-text dark:text-reddit-dark_text mb-2">
                      Community Icon
                    </label>
                    <div className="flex items-center gap-4">
                      <div
                        onClick={() => iconInputRef.current?.click()}
                        className="relative w-20 h-20 rounded-2xl overflow-hidden cursor-pointer group bg-reddit-hover dark:bg-reddit-dark_hover"
                      >
                        <img
                          src={iconPreview || defaultProfileImg}
                          alt="Icon"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <CameraIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="text-sm text-reddit-text_secondary">
                        <p>Recommended: 256x256 pixels</p>
                        <p>Supports: JPG, PNG, GIF</p>
                      </div>
                    </div>
                    <input
                      ref={iconInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIconChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-4 rounded-xl border-2 border-reddit-border dark:border-reddit-dark_divider font-bold text-lg hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={onSubmit}
                    disabled={loading}
                    className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-reddit-blue to-purple-600 hover:from-reddit-blue_hover hover:to-purple-700 text-white font-bold text-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-5 w-5" />
                        Create Community
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section - 2 columns */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-2xl border border-reddit-border dark:border-reddit-dark_divider overflow-hidden shadow-xl">
                {/* Banner */}
                <div className="relative h-24 bg-gradient-to-r from-reddit-blue to-purple-600">
                  <img
                    src={bannerPreview || defaultBanner}
                    alt="Banner preview"
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>

                {/* Icon */}
                <div className="relative px-4 -mt-8">
                  <div className="w-16 h-16 rounded-xl border-4 border-reddit-card dark:border-reddit-dark_card overflow-hidden shadow-lg bg-reddit-hover dark:bg-reddit-dark_hover">
                    <img
                      src={iconPreview || defaultProfileImg}
                      alt="Icon preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 pt-2">
                  <h3 className="text-lg font-bold text-reddit-text dark:text-reddit-dark_text">
                    r/{vanity}
                  </h3>
                  <p className="text-sm text-reddit-text_secondary mt-1 line-clamp-2">
                    {description || "Your community description..."}
                  </p>

                  {topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {topics.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 text-xs rounded-full bg-reddit-hover dark:bg-reddit-dark_hover"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 text-sm text-reddit-text_secondary">
                    {isPrivate ? (
                      <>
                        <LockClosedIcon className="h-4 w-4" />
                        <span>Private</span>
                      </>
                    ) : (
                      <>
                        <GlobeAltIcon className="h-4 w-4" />
                        <span>Public</span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-6 mt-4 pt-4 border-t border-reddit-border dark:border-reddit-dark_divider text-sm">
                    <div>
                      <div className="font-bold text-reddit-text dark:text-reddit-dark_text">1</div>
                      <div className="text-reddit-text_secondary">Member</div>
                    </div>
                    <div>
                      <div className="font-bold text-reddit-text dark:text-reddit-dark_text">0</div>
                      <div className="text-reddit-text_secondary">Online</div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-reddit-text_secondary mt-4 flex items-center justify-center gap-1">
                <SparklesIcon className="h-4 w-4" />
                Live preview
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
