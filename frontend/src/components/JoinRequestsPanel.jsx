// src/components/JoinRequestsPanel.jsx
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  UserGroupIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import api from "../api/axios";
import defaultProfileImg from "../assets/default_profile.jpeg";

export default function JoinRequestsPanel({ communityName, onRequestHandled }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchRequests();
  }, [communityName]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/communities/${encodeURIComponent(communityName)}/join-requests`);
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch requests", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessing((p) => ({ ...p, [requestId]: "approve" }));
      const res = await api.post(
        `/communities/${encodeURIComponent(communityName)}/join-requests/${requestId}/approve`
      );
      if (res.data.success) {
        toast.success("Request approved!");
        setRequests((r) => r.filter((req) => req._id !== requestId));
        onRequestHandled?.();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to approve");
    } finally {
      setProcessing((p) => ({ ...p, [requestId]: null }));
    }
  };

  const handleReject = async (requestId) => {
    try {
      setProcessing((p) => ({ ...p, [requestId]: "reject" }));
      const res = await api.post(
        `/communities/${encodeURIComponent(communityName)}/join-requests/${requestId}/reject`
      );
      if (res.data.success) {
        toast.success("Request rejected");
        setRequests((r) => r.filter((req) => req._id !== requestId));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reject");
    } finally {
      setProcessing((p) => ({ ...p, [requestId]: null }));
    }
  };

  if (loading) {
    return (
      <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-xl p-4 border border-reddit-border dark:border-reddit-dark_divider">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-reddit-hover dark:bg-reddit-dark_hover rounded w-1/3" />
          <div className="h-12 bg-reddit-hover dark:bg-reddit-dark_hover rounded" />
          <div className="h-12 bg-reddit-hover dark:bg-reddit-dark_hover rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-reddit-card dark:bg-reddit-dark_card rounded-xl border border-reddit-border dark:border-reddit-dark_divider overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-reddit-border dark:border-reddit-dark_divider bg-reddit-hover/50 dark:bg-reddit-dark_hover/50">
        <h3 className="font-semibold text-reddit-text dark:text-reddit-dark_text flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5" />
          Join Requests
          {requests.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-reddit-blue text-white">
              {requests.length}
            </span>
          )}
        </h3>
      </div>

      {/* Requests List */}
      <div className="divide-y divide-reddit-border dark:divide-reddit-dark_divider">
        {requests.length === 0 ? (
          <div className="p-6 text-center text-reddit-text_secondary">
            <ClockIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No pending requests</p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request._id}
              className="p-4 flex items-center gap-4"
            >
              {/* User Avatar */}
              <img
                src={request.user.avatar || defaultProfileImg}
                alt={request.user.username}
                className="h-10 w-10 rounded-full object-cover"
              />

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-reddit-text dark:text-reddit-dark_text">
                  u/{request.user.username}
                </div>
                {request.message && (
                  <p className="text-sm text-reddit-text_secondary truncate">
                    "{request.message}"
                  </p>
                )}
                <div className="text-xs text-reddit-text_secondary mt-0.5">
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(request._id)}
                  disabled={!!processing[request._id]}
                  className="p-2 rounded-full bg-green-500/20 text-green-600 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  title="Approve"
                >
                  {processing[request._id] === "approve" ? (
                    <div className="h-5 w-5 animate-spin border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <CheckIcon className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => handleReject(request._id)}
                  disabled={!!processing[request._id]}
                  className="p-2 rounded-full bg-red-500/20 text-red-600 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  title="Reject"
                >
                  {processing[request._id] === "reject" ? (
                    <div className="h-5 w-5 animate-spin border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <XMarkIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
