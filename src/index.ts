import dotenv from 'dotenv';
import path from 'path';
import app from './app';

// 환경변수 설정
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

const port =
  process.env.NODE_ENV === 'development' ? 8000 : process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// 예상치 못한 에러 처리
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
