import { Registration } from '../models/Registration.js';

export interface RegistrationRepository {
  findAll(): Promise<Registration[]>;
  findById(id: number): Promise<Registration | null>;
  findByEmailAndName(email: string, izena: string, abizenak: string): Promise<Registration | null>;
  findByEmailAndNameAndMote(email: string, izena: string, abizenak: string, mote: string): Promise<Registration | null>;
  save(registration: Registration): Promise<void>;
  delete(id: number): Promise<void>;
}
