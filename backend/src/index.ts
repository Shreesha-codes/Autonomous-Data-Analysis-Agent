import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import sessionRoutes from './routes/sessionRoutes';
import { errorHandler } from './middlewares/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Body Parser Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB Connection
connectDB();

// API Routes
app.use('/api/sessions', sessionRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
});
