#!/bin/sh

# 데이터베이스 연결 대기
echo "Waiting for database to be ready..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME; do
  sleep 2
done

# 환경별 마이그레이션 전략 분리
if [ "$NODE_ENV" = "development" ]; then
  echo "Running development migrations..."
  npx prisma migrate reset --force
  npx prisma db push
else
  echo "Running production migrations..."
  npx prisma migrate deploy
fi

# Prisma 클라이언트 생성
echo "Generating Prisma client..."
npx prisma generate

# 서버 시작
echo "Starting the server..."
npm run start 