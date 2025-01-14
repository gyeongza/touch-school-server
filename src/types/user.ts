export interface User {
  id: number;
  phoneNumber: string;
  name: string;
  grade: number;
  class: number;
  schoolId: number;
  createdAt: Date;
  school: {
    id: number;
    name: string;
    address: string | null;
  } | null;
}

export interface GetUserResponse extends User {}
