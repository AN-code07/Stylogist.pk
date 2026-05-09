import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import authRouter from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import addressRoutes from './modules/address/address.routes.js';
import productsRoutes from './modules/products/product.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import brandRoutes from './modules/brands/brand.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import uploadRoutes from './modules/uploads/upload.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import seoRoutes from './modules/seo/seo.routes.js';
import ingredientRoutes from './modules/ingredients/ingredient.routes.js';

const app = express();

// Render (and most managed hosts) sit behind a reverse proxy. Without this,
// Express sees requests as HTTP, which breaks `secure` cookies, correct IP
// detection for express-rate-limit, and req.secure checks.
app.set('trust proxy', 1);

// Allow requests from the deployed Vercel frontend *and* local dev origins.
// `origin` callback rather than a single string so we can whitelist multiple hosts.
const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://stylogist-pk.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
].filter(Boolean);

// Tighter security posture — satisfies the Lighthouse "Best Practices" audit
// (CSP, COOP, XFO, no sniff). Adjust `imgSrc` / `connectSrc` whitelists when
// plugging in a new CDN or analytics host.
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginOpenerPolicy: { policy: 'same-origin' },
        crossOriginEmbedderPolicy: false,   // disable to keep cross-origin images easy
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                'default-src': ["'self'"],
                'img-src': ["'self'", 'data:', 'blob:', 'https:'],
                'media-src': ["'self'", 'https:'],
                'script-src': ["'self'"],
                'style-src': ["'self'", "'unsafe-inline'", 'https:'],
                'font-src': ["'self'", 'data:', 'https:'],
                'connect-src': ["'self'", 'https:', 'wss:'],
                'frame-ancestors': ["'none'"],
                'base-uri': ["'self'"],
                'object-src': ["'none'"],
                'upgrade-insecure-requests': [],
            },
        },
        hsts: { maxAge: 15552000, includeSubDomains: true, preload: true },
        frameguard: { action: 'deny' },
    })
);
app.use(cookieParser());
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve uploaded files. Kept outside the /api namespace so assets resolve
// with a clean URL. Files here are content-addressed (unique slug/filename),
// so we mark them immutable + 1 year so browsers reuse the cached copy
// indefinitely — this is what turns Lighthouse's "efficient cache lifetimes"
// audit from yellow to green.
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), {
    maxAge: '365d',
    immutable: true,
    fallthrough: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
}));

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'success', message: 'HarbalMart.pk API is running' });
});

// SEO routes — sitemap.xml and robots.txt at the app root so crawlers find
// them at the conventional paths.
app.use('/', seoRoutes);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/ingredients', ingredientRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/settings', settingsRoutes);

app.use((req, _res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    err.status = 404;
    next(err);
});

app.use(globalErrorHandler);

export default app;
