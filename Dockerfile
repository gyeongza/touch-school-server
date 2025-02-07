FROM node:20.9.0-alpine

WORKDIR /app

# PostgreSQL 클라이언트 도구 설치
RUN apk add --no-cache postgresql-client vim

# 종속성 설치를 위한 파일들만 복사
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./

# 종속성 설치
RUN npm install

# 소스 코드 복사 (개발 환경에서는 볼륨 마운트로 덮어씌워짐)
COPY . .

# 프로덕션 환경에서만 빌드 실행 (docker-entrypoint.sh에서 처리)
# RUN npm run build

EXPOSE 8080

# 시작 스크립트 설정
COPY ./docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]