import express from 'express';
import cors from 'cors';
import verifyRouter from './routes/verify';
import schoolRouter from './routes/school';

const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(cors());

// 라우트 설정
app.use('/api/v1/verify', verifyRouter);
app.use('/api/v1/school', schoolRouter);

// 헬스체크
app.get('/ping', (_req, res) => {
  res.status(200).json({ message: 'pong' });
});

export default app;
