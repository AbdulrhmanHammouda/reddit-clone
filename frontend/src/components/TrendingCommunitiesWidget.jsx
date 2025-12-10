import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import defaultProfileImg from "../assets/default_profile.jpeg";

export default function TrendingCommunitiesWidget() {
  const { token } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState({});

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await api.get("/communities/trending?limit=5");
        if (res.data?.success) {
          setCommunities(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch trending:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleJoin = async (communityName, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      alert("Login to join communities");
      return;
    }

    setJoining(prev => ({ ...prev, [communityName]: true }));
    try {
      await api.post(`/communities/${communityName}/join`);
      setCommunities(prev =>
        prev.map(c =>
          c.name === communityName ? { ...c, isMember: true } : c
        )
      );
    } catch (err) {
      console.error("Failed to join:", err);
    } finally {
      setJoining(prev => ({ ...prev, [communityName]: false }));
    }
  };

  if (loading) {
    return (
      <div className="bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-reddit-hover dark:bg-reddit-dark_hover rounded w-2/3" />
          <div className="h-12 bg-reddit-hover dark:bg-reddit-dark_hover rounded" />
          <div className="h-12 bg-reddit-hover dark:bg-reddit-dark_hover rounded" />
        </div>
      </div>
    );
  }

  if (communities.length === 0) return null;

  return (
    <div className="bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-reddit-border dark:border-reddit-dark_divider bg-gradient-to-r from-reddit-blue to-blue-600">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
          🔥 Trending Communities
        </h3>
      </div>

      {/* Communities List */}
      <div className="divide-y divide-reddit-border dark:divide-reddit-dark_divider">
        {communities.map((community, index) => (
          <Link
            key={community._id}
            to={`/r/${community.name}`}
            className="flex items-center gap-3 p-3 hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors"
          >
            {/* Rank */}
            <span className="text-sm font-bold text-reddit-blue w-5 text-center">
              {index + 1}
            </span>

            {/* Icon */}
            <img
              src={community.icon && community.icon !== '/default-community.png' ? community.icon : defaultProfileImg}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
              loading="lazy"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-reddit-text dark:text-reddit-dark_text truncate">
                r/{community.name}
              </div>
              <div className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                {community.membersCount?.toLocaleString() || 0} members
              </div>
            </div>

            {/* Join Button */}
            {!community.isMember && (
              <button
                onClick={(e) => handleJoin(community.name, e)}
                disabled={joining[community.name]}
                className="px-3 py-1 text-xs font-semibold rounded-full bg-reddit-blue text-white hover:bg-reddit-blue_hover disabled:opacity-50 transition-colors"
              >
                {joining[community.name] ? "..." : "Join"}
              </button>
            )}
          </Link>
        ))}
      </div>

      {/* Footer */}
      <Link
        to="/explore"
        className="block px-4 py-3 text-center text-sm text-reddit-blue hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors border-t border-reddit-border dark:border-reddit-dark_divider"
      >
        See more →
      </Link>
    </div>
  );
}
