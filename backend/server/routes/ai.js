// backend/routes/ai.js
const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const Post = require('../models/Post');
const optionalAuth = require('../middleware/optionalAuth');

// Lazy initialization of Groq client (only when API key is available)
let groqClient = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groqClient;
}

/* ---------------------------------------------------------------------------
   🤖 SUMMARIZE POST - Generate AI summary of a post using Groq
--------------------------------------------------------------------------- */
router.post('/:postId/summarize', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Check if API key is configured
    const groq = getGroqClient();
    if (!groq) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not configured. Please add GROQ_API_KEY to environment variables.'
      });
    }

    // Fetch the post
    const post = await Post.findById(postId)
      .populate('author', 'username')
      .populate('community', 'name');

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Build the content to summarize (strip HTML tags from body)
    const cleanBody = post.body ? post.body.replace(/<[^>]*>/g, '') : '';
    const postContent = `
Title: ${post.title}
${cleanBody ? `Content: ${cleanBody}` : ''}
`.trim();

    // Check if there's enough content to summarize
    if (!cleanBody && post.title.length < 20) {
      return res.status(400).json({
        success: false,
        error: 'This post does not have enough content to summarize.'
      });
    }

    // Generate summary using Groq (Llama 3.3 70B - fast and powerful)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes Reddit-style posts concisely. Provide summaries in 2-3 sentences. Be concise, capture the key points, and maintain a neutral tone. Do not add opinions or extra information.'
        },
        {
          role: 'user',
          content: `Summarize the following post:\n\n${postContent}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 200,
    });

    const summary = chatCompletion.choices[0]?.message?.content?.trim() || 'Unable to generate summary.';

    res.json({
      success: true,
      data: {
        postId: post._id,
        title: post.title,
        summary,
        generatedAt: new Date()
      }
    });

  } catch (err) {
    console.error('AI Summarize error:', err);
    
    // Handle specific Groq errors
    if (err.message?.includes('API key') || err.status === 401) {
      return res.status(503).json({
        success: false,
        error: 'Invalid API key. Please check your GROQ_API_KEY configuration.'
      });
    }

    if (err.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again in a moment.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate summary. Please try again later.'
    });
  }
});

module.exports = router;
