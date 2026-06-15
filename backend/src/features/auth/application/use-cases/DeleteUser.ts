import { UserRepository } from '../../domain/repositories/UserRepository.js';

export class DeleteUser {
  constructor(private userRepository: UserRepository) {}

  async execute(id: number, currentUsername: string): Promise<boolean> {
    const userToDelete = await this.userRepository.getById(id);
    if (!userToDelete) {
      throw new Error('Erabiltzailea ez da aurkitu.');
    }

    if (userToDelete.username === currentUsername) {
      throw new Error('Ezin duzu zure erabiltzaile propioa ezabatu.');
    }

    return this.userRepository.delete(id);
  }
}
