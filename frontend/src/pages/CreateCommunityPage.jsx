// src/pages/CreateCommunityPage.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

/*
 CreateCommunityPage
 - Create real community using backend POST /communities
*/

function validateName(name) {
  if (!name || name.trim().length === 0) return "Name is required.";
  if (!/^[A-Za-z0-9_]+$/.test(name)) return "Name may only include letters, numbers, and underscores.";
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
  const [rules, setRules] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const vanity = useMemo(() => `/r/${name || "your_community"}`, [name]);

const onSubmit = async (e) => {
  e.preventDefault();

  const nameErr = validateName(name);
  const descErr = description.length > 500 ? "Description too long" : "";
  const rulesArr = rules.split("\n").map(r => r.trim()).filter(Boolean);

  const newErrors = {};
  if (nameErr) newErrors.name = nameErr;
  if (descErr) newErrors.description = descErr;
  if (rulesArr.length === 0) newErrors.rules = "At least one rule is required.";
  setErrors(newErrors);
  if (Object.keys(newErrors).length > 0) return;

  // ✔️ Accept token from context OR localStorage
  const effectiveToken = token || localStorage.getItem("token");
  if (!effectiveToken) return navigate("/login");

  setLoading(true);
  setErrors({});
  setSuccessMessage("");

  try {
    const res = await api.post("/communities", {
      name: name.trim().toLowerCase(),
      title: name.trim(),
      description: description.trim(),
      isPrivate,
      rules: rulesArr,
    });

    if (res.data?.success) {
      const newCommunity = res.data.data;
      setSuccessMessage("Community created!");
      navigate(`/r/${newCommunity.name}`);
    }
  } catch (err) {
    setErrors({
      name: err.response?.data?.error || "Failed to create community",
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <main className="w-full max-w-[740px] px-4" aria-labelledby="create-community-heading">
      <header className="mb-4">
        <h1 id="create-community-heading" className="text-2xl font-semibold text-reddit-text dark:text-reddit-dark_text">
          Create a Community
        </h1>
        <p className="mt-1 text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
          Create a place where people can share and discuss a topic.
        </p>
      </header>

      {/* Live preview header */}
      <section className="mb-6">
        <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-lg p-4 border border-reddit-border dark:border-reddit-dark_divider">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-md bg-reddit-hover dark:bg-reddit-dark_hover flex items-center justify-center text-reddit-text dark:text-reddit-dark_text font-semibold">
              {name ? name[0].toUpperCase() : "R"}
            </div>
            <div>
              <div className="text-lg font-semibold text-reddit-text dark:text-reddit-dark_text">
                {name ? `r/${name}` : "r/your_community"}
              </div>
              <div className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                {description || "Community description preview"}
              </div>
            </div>
            <div className="ml-auto text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
              {isPrivate ? "Private" : "Public"}
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={onSubmit} noValidate>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium">Community Name</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider"
              />
              <div className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary select-none">
                Preview: {vanity}
              </div>
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 rounded-md bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider"
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium">Type</label>
            <div className="mt-1 flex gap-2">
              <label className="inline-flex gap-2 text-sm">
                <input type="radio" checked={!isPrivate} onChange={() => setIsPrivate(false)} />
                Public
              </label>
              <label className="inline-flex gap-2 text-sm">
                <input type="radio" checked={isPrivate} onChange={() => setIsPrivate(true)} />
                Private
              </label>
            </div>
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium">Rules (one per line)</label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={4}
              className="w-full mt-1 px-3 py-2 rounded-md bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider"
            />
            {errors.rules && <p className="mt-1 text-sm text-red-500">{errors.rules}</p>}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-reddit-blue text-white font-semibold disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create Community"}
            </button>

            <button
              type="button"
              onClick={() => {
                setName("");
                setDescription("");
                setIsPrivate(false);
                setRules("");
                setErrors({});
              }}
              className="px-4 py-2 rounded-md bg-reddit-card dark:bg-reddit-dark_card border text-sm"
            >
              Reset
            </button>

            {successMessage && (
              <div className="ml-4 text-sm text-green-600">{successMessage}</div>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}
