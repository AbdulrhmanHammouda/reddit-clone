// src/pages/EditCommunityPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";

export default function EditCommunityPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [community, setCommunity] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/communities/${encodeURIComponent(name)}`);
        setCommunity(res.data.data);
        setTitle(res.data.data.title || "");
        setDescription(res.data.data.description || "");
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [name]);

  async function onSave(e) {
    e.preventDefault();
    if (!token) return navigate("/login");
    setSaving(true);
    try {
      const res = await api.patch(`/communities/${encodeURIComponent(name)}`, { title, description });
      if (res.data.success) {
        navigate(`/r/${res.data.data.name}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl mb-4">Edit community {community.name}</h1>
      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full" />
        </div>
        <div>
          <button type="submit" className="btn" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}
