// src/pages/ExplorePage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import defaultProfileImg from "../assets/default_profile.jpeg";

export default function ExplorePage() {
  const { token } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState({});
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const fetchExplore = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/communities/explore?category=${activeCategory}&limit=50`);
        const data = res.data?.data;
        
        if (data) {
          setCategories(data.categories || []);
          setGrouped(data.grouped || {});
        }
        setError(null);
      } catch (err) {
        console.error("Explore fetch error:", err);
        setError(err.response?.data?.error || "Failed to load communities");
      } finally {
        setLoading(false);
      }
    };
    fetchExplore();
  }, [activeCategory]);

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
      // Update grouped state
      setGrouped(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].map(c =>
            c.name === communityName ? { ...c, isMember: true } : c
          );
        });
        return updated;
      });
    } catch (err) {
      console.error("Failed to join:", err);
    } finally {
      setJoining(prev => ({ ...prev, [communityName]: false }));
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Community Card matching Reddit's design
  const CommunityCard = ({ community }) => (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition-colors">
      <Link to={`/r/${community.name}`} className="flex-shrink-0">
        <img
          src={community.icon && community.icon !== '/default-community.png' ? community.icon : defaultProfileImg}
          className="h-10 w-10 rounded-full object-cover"
          alt=""
          loading="lazy"
        />
      </Link>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <Link to={`/r/${community.name}`} className="min-w-0">
            <div className="font-medium text-sm text-reddit-text dark:text-reddit-dark_text truncate hover:underline">
              r/{community.name}
            </div>
            <div className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
              {community.membersCount?.toLocaleString() || 0} members
            </div>
          </Link>
          
          {!community.isMember && (
            <button
              onClick={(e) => handleJoin(community.name, e)}
              disabled={joining[community.name]}
              className="px-3 py-1 text-xs font-semibold rounded-full border border-reddit-border dark:border-reddit-dark_divider text-reddit-text dark:text-reddit-dark_text hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover disabled:opacity-50 transition flex-shrink-0"
            >
              {joining[community.name] ? "..." : "Join"}
            </button>
          )}
        </div>
        
        {community.description && (
          <p className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary mt-1 line-clamp-2">
            {community.description}
          </p>
        )}
      </div>
    </div>
  );

  // Category section with 3-column grid
  const CategorySection = ({ title, communities }) => {
    const isExpanded = expandedSections[title];
    const displayedCommunities = isExpanded ? communities : communities.slice(0, 3);
    
    if (!communities || communities.length === 0) return null;

    return (
      <section className="mb-8">
        <h2 className="text-base font-semibold text-reddit-text dark:text-reddit-dark_text mb-3">
          {title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
          {displayedCommunities.map((community) => (
            <CommunityCard key={community._id} community={community} />
          ))}
        </div>

        {communities.length > 3 && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => toggleSection(title)}
              className="px-4 py-2 text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary border border-reddit-border dark:border-reddit-dark_divider rounded-full hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover transition"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto pt-6 px-4 pb-20">
      {/* Page Title */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-reddit-text dark:text-reddit-dark_text">
          Explore Communities
        </h1>
        <p className="mt-1 text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
          Discover new communities based on your interests
        </p>
      </header>

      {/* Category Pills - Horizontal scrollable */}
      <nav className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setActiveCategory("All")}
          className={`
            px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
            ${activeCategory === "All"
              ? "bg-reddit-blue text-white"
              : "bg-reddit-hover dark:bg-reddit-dark_hover text-reddit-text dark:text-reddit-dark_text hover:bg-reddit-border dark:hover:bg-reddit-dark_border"
            }
          `}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
              ${activeCategory === cat
                ? "bg-reddit-blue text-white"
                : "bg-reddit-hover dark:bg-reddit-dark_hover text-reddit-text dark:text-reddit-dark_text hover:bg-reddit-border dark:hover:bg-reddit-dark_border"
              }
            `}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Content */}
      {loading ? (
        <div className="space-y-8">
          {[1, 2].map((section) => (
            <div key={section}>
              <div className="h-5 w-40 bg-reddit-hover dark:bg-reddit-dark_hover rounded mb-4 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3 p-2">
                    <div className="h-10 w-10 bg-reddit-hover dark:bg-reddit-dark_hover rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-reddit-hover dark:bg-reddit-dark_hover rounded w-24 mb-1" />
                      <div className="h-3 bg-reddit-hover dark:bg-reddit-dark_hover rounded w-16 mb-2" />
                      <div className="h-3 bg-reddit-hover dark:bg-reddit-dark_hover rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => setActiveCategory("All")}
            className="px-4 py-2 rounded-full bg-reddit-blue text-white"
          >
            Retry
          </button>
        </div>
      ) : activeCategory === "All" ? (
        // Show grouped by category (like Reddit)
        <div>
          {/* Recommended section first */}
          {grouped["Technology"] && (
            <CategorySection title="Recommended for you" communities={grouped["Technology"]} />
          )}
          
          {/* Other categories */}
          {Object.entries(grouped)
            .filter(([key]) => key !== "Technology")
            .map(([category, communities]) => (
              <CategorySection key={category} title={category} communities={communities} />
            ))}
        </div>
      ) : (
        // Show single category
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
          {grouped[activeCategory]?.length > 0 ? (
            grouped[activeCategory].map((community) => (
              <CommunityCard key={community._id} community={community} />
            ))
          ) : (
            <div className="col-span-3 text-center py-10 text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
              No communities found in this category
            </div>
          )}
        </div>
      )}
    </div>
  );
}
