export class User {
  constructor(
    public id: number | null,
    public username: string,
    public passwordHash: string,
    public salt: string,
    public role: 'admin' | 'moderator',
    public createdAt?: string
  ) {}

  static validateUsername(username: string): boolean {
    return typeof username === 'string' && username.trim().length >= 3;
  }

  static validatePassword(password: string): boolean {
    return typeof password === 'string' && password.trim().length >= 6;
  }
}
