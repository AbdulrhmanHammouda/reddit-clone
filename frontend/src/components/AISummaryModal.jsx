// src/components/AISummaryModal.jsx
import { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';

export default function AISummaryModal({ isOpen, onClose, postId, postTitle }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && postId && !summary) {
      generateSummary();
    }
  }, [isOpen, postId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSummary('');
        setError('');
      }, 300);
    }
  }, [isOpen]);

  async function generateSummary() {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/ai/${postId}/summarize`);
      if (res.data?.success) {
        setSummary(res.data.data.summary);
      } else {
        setError(res.data?.error || 'Failed to generate summary');
      }
    } catch (err) {
      console.error('Summary error:', err);
      setError(err.response?.data?.error || 'Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-reddit-card dark:bg-reddit-dark_card rounded-2xl w-full max-w-[520px] relative shadow-2xl border border-reddit-border dark:border-reddit-dark_divider overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-4 pb-6">
          <button 
            className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            onClick={onClose}
          >
            <XMarkIcon className="h-5 w-5 text-white" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Summary</h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Post Title Reference */}
          <div className="mb-4 pb-4 border-b border-reddit-border dark:border-reddit-dark_divider">
            <p className="text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary mb-1 uppercase tracking-wide">
              Summarizing Post
            </p>
            <p className="text-reddit-text dark:text-reddit-dark_text font-medium line-clamp-2">
              {postTitle}
            </p>
          </div>

          {/* Summary Content */}
          <div className="min-h-[120px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-3 border-purple-200 dark:border-purple-900" />
                  <div className="absolute inset-0 w-12 h-12 rounded-full border-3 border-transparent border-t-purple-500 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-reddit-text dark:text-reddit-dark_text font-medium">
                    Generating summary...
                  </p>
                  <p className="text-sm text-reddit-text_secondary dark:text-reddit-dark_text_secondary mt-1">
                    AI is analyzing the post content
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                <button
                  onClick={generateSummary}
                  className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : summary ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-800/50 rounded-xl p-4">
                  <p className="text-reddit-text dark:text-reddit-dark_text leading-relaxed">
                    {summary}
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary">
                  <span className="flex items-center gap-1.5">
                    <SparklesIcon className="h-3.5 w-3.5" />
                    Generated with AI
                  </span>
                  <button
                    onClick={generateSummary}
                    className="hover:text-purple-500 transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-reddit-hover dark:bg-reddit-dark_hover hover:bg-reddit-border dark:hover:bg-reddit-dark_border rounded-xl text-reddit-text dark:text-reddit-dark_text font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
