// Database indexes for optimal query performance
// Run this script once: node scripts/create-indexes.js

const mongoose = require('mongoose');
require('dotenv').config();

async function createIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/reddit-clone');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Posts indexes
    console.log('Creating Posts indexes...');
    await db.collection('posts').createIndex({ createdAt: -1 });
    await db.collection('posts').createIndex({ score: -1 });
    await db.collection('posts').createIndex({ author: 1, createdAt: -1 });
    await db.collection('posts').createIndex({ community: 1, createdAt: -1 });
    await db.collection('posts').createIndex({ community: 1, score: -1 });

    // Comments indexes
    console.log('Creating Comments indexes...');
    await db.collection('comments').createIndex({ post: 1, createdAt: -1 });
    await db.collection('comments').createIndex({ author: 1, createdAt: -1 });
    await db.collection('comments').createIndex({ parent: 1 });

    // Votes indexes
    console.log('Creating Votes indexes...');
    await db.collection('votes').createIndex({ user: 1, post: 1 }, { unique: true });
    await db.collection('votes').createIndex({ post: 1 });

    // CommentVotes indexes
    console.log('Creating CommentVotes indexes...');
    await db.collection('commentvotes').createIndex({ user: 1, comment: 1 }, { unique: true });
    await db.collection('commentvotes').createIndex({ comment: 1 });

    // CommunityMembers indexes
    console.log('Creating CommunityMembers indexes...');
    await db.collection('communitymembers').createIndex({ user: 1, community: 1 }, { unique: true });
    await db.collection('communitymembers').createIndex({ community: 1 });
    await db.collection('communitymembers').createIndex({ user: 1 });

    // SavedPosts indexes
    console.log('Creating SavedPosts indexes...');
    await db.collection('savedposts').createIndex({ user: 1, post: 1 }, { unique: true });
    await db.collection('savedposts').createIndex({ user: 1, createdAt: -1 });

    // Notifications indexes
    console.log('Creating Notifications indexes...');
    await db.collection('notifications').createIndex({ user: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ user: 1, read: 1 });

    // Follows indexes
    console.log('Creating Follows indexes...');
    await db.collection('follows').createIndex({ follower: 1, following: 1 }, { unique: true });
    await db.collection('follows').createIndex({ following: 1 });
    await db.collection('follows').createIndex({ follower: 1 });

    // Communities indexes
    console.log('Creating Communities indexes...');
    await db.collection('communities').createIndex({ name: 1 }, { unique: true });
    await db.collection('communities').createIndex({ membersCount: -1 });

    // Users indexes
    console.log('Creating Users indexes...');
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });

    // HiddenPosts indexes
    console.log('Creating HiddenPosts indexes...');
    await db.collection('hiddenposts').createIndex({ user: 1, post: 1 }, { unique: true });

    console.log('✅ All indexes created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating indexes:', err);
    process.exit(1);
  }
}

createIndexes();
