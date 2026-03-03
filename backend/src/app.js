import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import router from './modules/auth/auth.routes.js';
import userRoutes from "./modules/users/user.routes.js"
import addressRoutes from "./modules/address/address.routes.js"
import productsRoutes from "./modules/products/product.routes.js"
import categoryRoutes from "./modules/categories/category.routes.js"
// import v1Routes from './routes/v1/index.js'; // To be created next

const app = express();

// 1. Global Middleware Composition (Security & Parsers)
app.use(helmet()); // Sets secure HTTP headers
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Prevent DOS attacks via massive payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 2. Health Check Route (Crucial for load balancers)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Stylogist.pk API is running' });
});

// 3. API Routes Mounting
app.use('/api/v1/auth', router)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/addresses', addressRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/v1/categories', categoryRoutes)

// 4. Handle Undefined Routes
app.use((req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    err.status = 404;
    next(err);
});
// 5. Global Error Handling Middleware
app.use(globalErrorHandler);

export default app;