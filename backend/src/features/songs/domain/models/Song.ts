export class Song {
  constructor(
    public id: number | null,
    public url: string,
    public realTitle: string | null,
    public realArtist: string | null,
    public proposedTitles: string[],
    public proposedArtists: string[],
    public submitters: string[],
    public comments: string[],
    public ips: string[],
    public status: 'pending' | 'accepted' | 'rejected',
    public genres: string[],
    public acceptedBy: string | null,
    public createdAt?: string,
    public lyrics: string | null = null,
    public language: string[] = []
  ) {}

  static cleanArtist(artist: string): string {
    return artist.replace(/\s*-\s*Topic\s*$/gi, '').trim();
  }

  static isGenericArtist(artist: string): boolean {
    const lower = artist.toLowerCase();
    return (
      lower === 'release' ||
      lower === 'various artists' ||
      lower === 'various artist' ||
      lower === 'artistas varios' ||
      lower === 'varios artistas'
    );
  }
}
