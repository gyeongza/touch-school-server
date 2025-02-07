import express from 'express';
import cors from 'cors';
import verifyRouter from './routes/verify';
import schoolRouter from './routes/school';
import loginRouter from './routes/login';
import userRouter from './routes/user';
import treeRouter from './routes/tree';
import attendanceRouter from './routes/attendance';
import morgan from 'morgan';
import { logger } from './utils/logger';
const cookieParser = require('cookie-parser');

const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      'https://touch-school.site',
      'https://www.touch-school.site',
      'https://api.touch-school.site',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
  })
);
app.use(cookieParser());

// logger 설정
app.use(
  morgan(':method :status :url :response-time ms', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  })
);

// 라우트 설정
app.use('/api/v1/verify', verifyRouter);
app.use('/api/v1/school', schoolRouter);
app.use('/api/v1/login', loginRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/tree', treeRouter);
app.use('/api/v1/attendance', attendanceRouter);

// 헬스체크
app.get('/ping', (_req, res) => {
  res.status(200).json({ message: 'pong' });
});

export default app;
