
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { authLimiter, writeLimiter } = require('./middleware/rateLimiter');


const authRoutes = require('./routes/auth');
const communityRoutes = require('./routes/communities');
const postRoutes = require('./routes/posts');
// const voteRoutes = require('./routes/votes');
const commentRoutes = require('./routes/comments');
const commentVoteRoutes = require('./routes/commentVotes');
const userRoutes = require('./routes/users');
const postsImageRoutes = require('./routes/postsImage');
const notificationsRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const messagesRoutes = require('./routes/messages'); // New import
const aiRoutes = require('./routes/ai'); // AI integration
const requireAuth = require('./middleware/authMiddleware');


const app = express();
app.use(cors());
app.use(express.json());



connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/reddit_clone');



app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
// app.use('/api/posts', voteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/comments', commentVoteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postsImageRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/messages', messagesRoutes); // New route
app.use('/api/ai', aiRoutes); // AI integration routes

// app.use('/api/auth', authLimiter, authRoutes); // only public routes

// app.use(requireAuth); // apply middleware to everything below
// app.use('/api/communities', communityRoutes);
// app.use('/api/posts', postRoutes);
// app.use('/api/posts', voteRoutes);
// app.use('/api/comments', commentRoutes);
// app.use('/api/comments', commentVoteRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/posts', postsImageRoutes);
// app.use('/api/notifications', notificationsRoutes);
// app.use('/api/search', searchRoutes);
// app.use('/api/messages', messagesRoutes);
// ========================
// Rate limiting for write operations
// ========================

// const { writeLimiter } = require('./middleware/rateLimiter');
// const requireAuth = require('./middleware/authMiddleware');

// // Routes that modify data
// app.use('/api/posts', requireAuth, writeLimiter, postRoutes);
// app.use('/api/comments', requireAuth, writeLimiter, commentRoutes);
// app.use('/api/messages', requireAuth, writeLimiter, messagesRoutes);
// app.use('/api/posts', requireAuth, writeLimiter, voteRoutes);
// app.use('/api/comments', requireAuth, writeLimiter, commentVoteRoutes);



app.get('/', (req, res) => res.json({ message: 'API running' }));

// Fallback 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, data: null, error: 'Not Found' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}    ` ));
