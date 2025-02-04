#!/bin/sh

# 데이터베이스 연결 대기
echo "Waiting for database to be ready..."
sleep 10

# Prisma 마이그레이션 실행
echo "Running Prisma migrations..."
npx prisma migrate reset --force
npx prisma db push
npx prisma generate

# 서버 시작
echo "Starting the server..."
npm run start 