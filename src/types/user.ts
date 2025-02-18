import { User as PrismaUser } from '@prisma/client';

export type User = PrismaUser;
export type GetUserResponse = User & {
  school: {
    id: number;
    name: string;
    address: string | null;
  } | null;
  gameAvailableCount: number;
};
