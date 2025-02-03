FROM node:20.9.0-alpine

WORKDIR /app

# 먼저 종속성 설치를 위한 파일들만 복사
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./

# 종속성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

EXPOSE 8080

# Express 서버 실행
CMD ["npm", "run", "start"] 