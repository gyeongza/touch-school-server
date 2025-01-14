import express from 'express';
import cors from 'cors';
import verifyRouter from './routes/verify';
import schoolRouter from './routes/school';
import loginRouter from './routes/login';
import userRouter from './routes/user';
const cookieParser = require('cookie-parser');

const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(cookieParser());

// 라우트 설정
app.use('/api/v1/verify', verifyRouter);
app.use('/api/v1/school', schoolRouter);
app.use('/api/v1/login', loginRouter);
app.use('/api/v1/user', userRouter);

// 헬스체크
app.get('/ping', (_req, res) => {
  res.status(200).json({ message: 'pong' });
});

export default app;
