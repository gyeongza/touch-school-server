import { PrismaClient } from '@prisma/client';
import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
const prisma = new PrismaClient();

const router = express.Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userSchoolId = req.user?.schoolId;

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        tree: {
          select: {
            id: true,
            level: true,
            experience: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: [
        {
          tree: {
            level: 'desc',
          },
        },
        {
          tree: {
            experience: 'desc',
          },
        },
      ],
      where: {
        tree: {
          isNot: null,
        },
      },
    });

    const validSchools = schools.filter((school) => school.tree !== null);

    logger.info(`학교 데이터:
      - 전체 학교 수: ${schools.length}
      - 유효한 학교 수: ${validSchools.length}
      - 사용자 학교 ID: ${userSchoolId}
    `);

    const top5Schools = validSchools.slice(0, 5);

    const formattedResponse = top5Schools.map((school, index) => ({
      school: {
        id: school.id,
        name: school.name,
        totalUser: school._count.users,
        rank: index + 1,
      },
      tree: {
        id: school.tree?.id,
        level: school.tree?.level,
      },
    }));

    const userSchool = schools.find((school) => school.id === userSchoolId);
    const userSchoolRank =
      userSchool && userSchool.tree
        ? validSchools.findIndex((school) => school.id === userSchoolId) + 1
        : 0;

    const response = {
      schools: formattedResponse,
      userSchoolRank,
      userSchoolTotalCount:
        schools.find((school) => school.id === userSchoolId)?._count.users || 0,
    };

    logger.info('응답:', JSON.stringify(response, null, 2));

    return res.status(200).json(response);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
