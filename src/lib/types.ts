export interface Song {
  id: number;
  title: string;
  duration_seconds: number;
  track_number: number;
  is_single: boolean;
  album_id: number;
}

export interface Album {
  id: number;
  title: string;
  release_date: string;
  coverart_url: string;
  is_published: boolean;
  songs: Song[];
}

export interface AlbumFormData {
  title: string;
  release_date: string; // Keep as string for form input (YYYY-MM-DD)
  coverart_url: string | null;
  is_published: boolean;
} 