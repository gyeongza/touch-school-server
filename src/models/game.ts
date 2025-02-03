import { PrismaClient, Game as PrismaGame } from '@prisma/client';

const prisma = new PrismaClient();

interface GameResult {
  success: boolean;
  message: string;
  waterCount?: number;
}

class Game {
  static readonly DAILY_LIMIT = 3;
  static readonly MINIMUM_WINNING_SCORE = 80;
  static readonly WATER_REWARD = 1;

  static async canPlayToday(userId: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gamesPlayedToday = await prisma.game.count({
      where: {
        userId,
        playedAt: {
          gte: today,
        },
      },
    });

    return gamesPlayedToday < this.DAILY_LIMIT;
  }

  static async play(
    userId: number,
    score: number,
    gameType: string = 'WATER_GAME'
  ): Promise<GameResult> {
    try {
      // 오늘 게임 플레이 가능 여부 확인
      const canPlay = await this.canPlayToday(userId);
      if (!canPlay) {
        return {
          success: false,
          message:
            '오늘은 더 이상 게임을 플레이할 수 없습니다. 내일 다시 도전해주세요!',
        };
      }

      // 트랜잭션으로 게임 기록 생성과 보상 지급을 함께 처리
      const result = await prisma.$transaction(async (tx) => {
        // 게임 결과 기록
        const reward =
          score >= this.MINIMUM_WINNING_SCORE ? this.WATER_REWARD : 0;

        const gameRecord = await tx.game.create({
          data: {
            userId,
            score,
            reward,
            type: gameType,
          },
        });

        // 승리한 경우 물주기 횟수 증가
        if (reward > 0) {
          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              waterCount: {
                increment: reward,
              },
            },
          });

          return {
            success: true,
            message: `축하합니다! 게임에서 승리하여 물주기 기회 ${reward}회를 획득했습니다.`,
            waterCount: updatedUser.waterCount,
          };
        }

        return {
          success: false,
          message: `아쉽네요. ${this.MINIMUM_WINNING_SCORE}점 이상 획득하면 물주기 기회를 얻을 수 있습니다!`,
        };
      });

      return result;
    } catch (error) {
      console.error('게임 처리 실패:', error);
      throw new Error('게임 처리 중 오류가 발생했습니다.');
    }
  }

  static async getGameHistory(userId: number) {
    return await prisma.game.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      take: 10, // 최근 10개 기록만 가져오기
    });
  }

  static async getTodayGames(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.game.findMany({
      where: {
        userId,
        playedAt: {
          gte: today,
        },
      },
      orderBy: { playedAt: 'desc' },
    });
  }
}

export default Game;
export type { GameResult };
