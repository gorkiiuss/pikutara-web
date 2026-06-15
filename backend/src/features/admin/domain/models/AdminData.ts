export interface AdminMeme {
  id: number;
  title: string;
  contact: string;
  image_path: string;
  votes: number;
  is_approved: number;
  created_at: string;
}

export interface AdminPoster {
  id: number;
  title: string;
  event_date: string;
  description: string | null;
  bands: string | null;
  file_path: string;
  created_at: string;
}

export interface AdminPlaylistReview {
  id: number;
  rating: number;
  comment: string;
  ip_address: string | null;
  created_at: string;
}

export interface AdminSection {
  key: string;
  name: string;
  is_active: number;
}

export interface AdminPageView {
  path: string;
  views: number;
}

export interface AdminSong {
  id: number;
  url: string;
  real_title: string | null;
  real_artist: string | null;
  proposed_titles: string[];
  proposed_artists: string[];
  submitters: string[];
  comments: string[];
  ips: string[];
  status: string;
  genres: string[];
  accepted_by: string | null;
  created_at: string;
  lyrics: string | null;
  language: string[];
}

export interface AdminGarbageTag {
  tag: string;
}

export interface AdminTagMapping {
  original_tag: string;
  canonical_tag: string;
}

export interface AdminGenreHierarchy {
  genre: string;
  parent_genre: string;
}

export interface AdminUser {
  id: number;
  username: string;
  role: string;
  created_at: string;
}
