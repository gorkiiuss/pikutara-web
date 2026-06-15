export class Meme {
  constructor(
    public id: number | null,
    public title: string,
    public contact: string,
    public imagePath: string,
    public votes: number = 0,
    public isApproved: boolean = false,
    public createdAt?: string
  ) {}

  static validate(title: string, contact: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Izenburua ezin da hutsik egon.');
    }
    if (!contact || contact.trim().length === 0) {
      throw new Error('Kontaktua (konpartsa edo izena) ezin da hutsik egon.');
    }
  }
}
