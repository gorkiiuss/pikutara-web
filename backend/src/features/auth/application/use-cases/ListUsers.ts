import { UserRepository } from '../../domain/repositories/UserRepository.js';
import { User } from '../../domain/models/User.js';

export class ListUsers {
  constructor(private userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepository.getAll();
  }
}
