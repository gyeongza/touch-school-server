#!/bin/sh

# 데이터베이스 연결 대기
echo "Waiting for database to be ready..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME; do
  sleep 2
done

# Prisma 클라이언트 생성
echo "Generating Prisma client..."
npx prisma generate

# 환경별 마이그레이션 전략 분리
if [ "$NODE_ENV" = "development" ]; then
  echo "Running development migrations..."
  npx prisma db push
  
  # 개발 환경에서는 nodemon으로 실행
  echo "Starting development server..."
  exec npm run docker:dev
else
  echo "Running production migrations..."
  npx prisma migrate deploy
  
  # 프로덕션 환경에서는 빌드 후 실행
  echo "Building and starting production server..."
  npm run build
  exec npm run docker:prod
fi 