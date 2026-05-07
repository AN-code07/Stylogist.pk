// src/config/env.js
import 'dotenv/config';

// In a real scenario, use Zod for strict schema validation
const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Email configuration
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com', // default to Gmail
  emailPort: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 465, // default SSL port
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,

  // Public URL of the storefront, used by the sitemap generator and the
  // robots.txt response. Falls back to a sensible default for dev.
  siteUrl: (process.env.SITE_URL || 'https://stylogist.pk').replace(/\/$/, ''),

  // Cloudinary — storage for every uploaded media asset.
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'stylogist',
  },
};

// Fail-fast validation
if (!env.mongoUri) {
  console.error('FATAL ERROR: MONGO_URI is not defined in the environment.');
  process.exit(1);
}

if (!env.jwtSecret) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in the environment.');
  process.exit(1);
}

if (!env.emailUser) {
  console.error('FATAL ERROR: EMAIL_USER is not defined in the environment.');
  process.exit(1);
}

if (!env.emailPass) {
  console.error('FATAL ERROR: EMAIL_PASS is not defined in the environment.');
  process.exit(1);
}

export default env;