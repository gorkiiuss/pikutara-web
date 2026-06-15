export class Poster {
  constructor(
    public id: number | null,
    public title: string,
    public eventDate: string,
    public description: string | null,
    public bands: string | null, // Stores bands JSON string or tag list
    public filePath: string,
    public createdAt?: string
  ) {}

  static validate(title: string, eventDate: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Izenburua ezin da hutsik egon.');
    }
    if (!eventDate || eventDate.trim().length === 0) {
      throw new Error('Data ezin da hutsik egon.');
    }
  }
}
