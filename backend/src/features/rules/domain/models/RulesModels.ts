export class GarbageTag {
  constructor(public tag: string) {}
}

export class TagMapping {
  constructor(
    public originalTag: string,
    public canonicalTag: string
  ) {}
}

export class GenreHierarchy {
  constructor(
    public genre: string,
    public parentGenre: string
  ) {}
}
