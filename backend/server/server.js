
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');


const authRoutes = require('./routes/auth');
const communityRoutes = require('./routes/communities');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');


const app = express();
app.use(cors());
app.use(express.json());



connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/reddit_clone');



app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);


app.get('/', (req, res) => res.json({ message: 'API running' }));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
