import express, { Express, Request, Response } from 'express';
import verifyRouter from './routes/verify';
import schoolRouter from './routes/school';

const app: Express = express();
const port = 8080;

const cors = require('cors');

// JSON 파싱을 위한 미들웨어 추가
app.use(express.json());

app.use(cors());

app.use('/api/v1/verify', verifyRouter);
app.use('/api/v1/school', schoolRouter);

app.get('/ping', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'pong' });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
