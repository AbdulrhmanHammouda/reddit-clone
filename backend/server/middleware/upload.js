const multer = require('multer');
const { storage } = require('../utils/cloudinary');

const upload = multer({ storage });

module.exports = upload;
