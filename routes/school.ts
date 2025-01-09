import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/info', async (req: Request, res: Response) => {
  try {
    const response = await fetch(
      `https://open.neis.go.kr/hub/schoolInfo?KEY=aa517c7c83974e14b3babe5caedee506&Type=json&pIndex=1&pSize=100`
    );

    const data = await response.json();
    console.log(data.schoolInfo[1].row.map((item: any) => item.SCHUL_NM));

    if (data.RESULT?.CODE === 'ERROR') {
      return res.status(400).json({
        message: data.RESULT.MESSAGE || '학교 정보를 가져오는데 실패했습니다',
      });
    }

    if (!data.schoolInfo) {
      return res.status(404).json({ message: '검색된 학교 정보가 없습니다' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('학교 정보 조회 중 오류 발생:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

export default router;
