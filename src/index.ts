import dotenv from 'dotenv';
import app from './app';
import { logger } from './utils/logger';

// 환경변수 설정 (개선된 버전)
dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.local' : '.env',
  override: true,
});

const port = parseInt(process.env.NODE_DOCKER_PORT || '8080', 10);

app.listen(port, '0.0.0.0', () => {
  logger.info(`[server]: Server is running at http://0.0.0.0:${port}`);
});

// 예상치 못한 에러 처리
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
