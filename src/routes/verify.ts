import express, { Request, Response } from 'express';

const router = express.Router();

const verificationStore: { [key: string]: string } = {};

// 6자리 랜덤 인증번호 생성 함수
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 전화번호 받고 인증번호 생성
router.post('/phone', async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber || !/^01[0-9]{8,9}$/.test(phoneNumber)) {
    return res.status(400).json({ message: '유효하지 않은 전화번호입니다' });
  }

  const verificationCode = generateVerificationCode();
  // TODO: 인증번호 DB에 저장하는 로직 추가
  verificationStore[phoneNumber] = verificationCode;

  try {
    const { SolapiMessageService } = require('solapi');
    const messageService = new SolapiMessageService(
      process.env.SOLAPI_API_KEY,
      process.env.SOLAPI_API_SECRET
    );

    await messageService.send({
      to: phoneNumber,
      from: '01073829600',
      text: `인증번호는 ${verificationCode}입니다. 3분 이내에 입력해주세요.`,
    });

    // 3분 후 인증번호 만료
    setTimeout(
      () => {
        if (verificationStore[phoneNumber] === verificationCode) {
          delete verificationStore[phoneNumber];
        }
      },
      60 * 1000 * 3
    );

    res.status(200).send('인증번호가 전송되었습니다');
  } catch (error) {
    console.error('SMS 발송 실패:', error);
    res.status(500).json({ message: 'SMS 발송에 실패했습니다' });
  }
});

// 저장된 인증번호 조회
router.get(
  '/code/:phoneNumber',
  (req: Request<{ phoneNumber: string }>, res: Response) => {
    const { phoneNumber } = req.params;
    const code = verificationStore[phoneNumber];

    if (!code) {
      return res.status(404).json({ message: '인증번호를 찾을 수 없습니다' });
    }

    res.status(200).json({ code });
  }
);

// 인증번호 확인
router.post(
  '/confirm',
  (
    req: Request<object, object, { phoneNumber: string; code: string }>,
    res: Response
  ) => {
    const { phoneNumber, code } = req.body;
    const storedCode = verificationStore[phoneNumber];

    if (!storedCode) {
      return res.status(404).json({ message: '인증번호를 찾을 수 없습니다' });
    }

    if (storedCode === code) {
      // 인증 성공 시 저장된 인증번호 삭제
      delete verificationStore[phoneNumber];
      res
        .status(200)
        .json({ verified: true, message: '인증이 완료되었습니다' });
    } else {
      res
        .status(400)
        .json({ verified: false, message: '잘못된 인증번호입니다' });
    }
  }
);

export default router;
