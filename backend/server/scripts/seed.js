// backend/scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Community = require('../models/Community');
const Post = require('../models/post');


(async () => {
try {
const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/reddit_clone';
await connectDB(uri);


await User.deleteMany({});
await Community.deleteMany({});
await Post.deleteMany({});


const salt = await bcrypt.genSalt(10);
const pw = await bcrypt.hash('password123', salt);
const user = await User.create({ username: 'testuser', email: 'test@example.com', passwordHash: pw });


const comm = await Community.create({ name: 'javascript', title: 'JavaScript', description: 'All about JS', createdBy: user._id, membersCount: 10 });


await Post.create([
{ title: 'Welcome to r/javascript', body: 'first post body', author: user._id, community: comm._id },
{ title: 'How to learn React', body: 'use hooks...', author: user._id, community: comm._id }
]);


console.log('Seed done');
process.exit(0);
} catch (err) {
console.error(err);
process.exit(1);
}
})();