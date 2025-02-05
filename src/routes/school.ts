import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { NeisSchoolRow } from '../types/school';

const prisma = new PrismaClient();
const router = express.Router();

// 저장된 학교 목록을 조회하는 API도 추가
router.get('/schools', async (req: Request, res: Response) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return res.status(200).json(schools);
  } catch (error) {
    console.error('학교 목록 조회 중 오류 발생:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

router.get('/schools/search', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;

    // 검색어가 없을 경우 전체 학교 목록 반환
    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      const allSchools = await prisma.school.findMany({
        orderBy: {
          name: 'asc',
        },
      });
      return res.status(200).json(allSchools);
    }

    // DB에서 먼저 검색
    const dbSchools = await prisma.school.findMany({
      where: {
        name: {
          contains: keyword,
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // DB에 결과가 있으면 바로 반환
    if (dbSchools.length > 0) {
      return res.status(200).json(dbSchools);
    }

    // DB에 결과가 없는 경우 NEIS API 호출
    const response = await fetch(
      `https://open.neis.go.kr/hub/schoolInfo?KEY=${process.env.NEIS_API_KEY}&Type=json&SCHUL_NM=${encodeURIComponent(keyword)}`
    );

    const data = await response.json();

    // NEIS API 결과가 없는 경우 빈 배열 반환
    if (!data.schoolInfo) {
      return res.status(200).json([]);
    }

    const schools = data.schoolInfo[1].row.map((item: NeisSchoolRow) => ({
      name: item.SCHUL_NM,
      address: item.ORG_RDNMA,
    }));

    // 새로운 학교 정보를 DB에 저장
    await prisma.school.createMany({
      data: schools,
      skipDuplicates: true,
    });

    // DB에서 새로 저장된 데이터를 조회하여 반환
    const savedSchools = await prisma.school.findMany({
      where: {
        name: {
          contains: keyword,
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json(savedSchools);
  } catch (error) {
    console.error('학교 검색 중 오류 발생:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

export default router;
