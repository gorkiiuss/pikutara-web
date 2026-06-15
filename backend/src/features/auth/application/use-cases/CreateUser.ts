import crypto from 'crypto';
import { UserRepository } from '../../domain/repositories/UserRepository.js';
import { User } from '../../domain/models/User.js';

export interface CreateUserDTO {
  username: string;
  password?: string;
  role: 'admin' | 'moderator';
}

export class CreateUser {
  constructor(private userRepository: UserRepository) {}

  async execute(dto: CreateUserDTO): Promise<User> {
    const cleanUsername = dto.username.trim();
    if (!User.validateUsername(cleanUsername)) {
      throw new Error('Erabiltzaile izen okerra (gutxienez 3 karaktere behar ditu).');
    }

    if (!dto.password || !User.validatePassword(dto.password)) {
      throw new Error('Pasahitz okerra (gutxienez 6 karaktere behar ditu).');
    }

    const existing = await this.userRepository.getByUsername(cleanUsername);
    if (existing) {
      throw new Error('Erabiltzailea dagoeneko existitzen da.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(dto.password, salt, 64).toString('hex');

    const newUser = new User(null, cleanUsername, hash, salt, dto.role);
    return this.userRepository.create(newUser);
  }
}
