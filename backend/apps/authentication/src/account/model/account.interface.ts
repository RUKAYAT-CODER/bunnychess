export interface Account {
  id: string;
  email: string;
  username: string;
  password: string;
  isAdmin: boolean;
  createdAt: Date;
  lastLoginAt?: Date | null;
}
