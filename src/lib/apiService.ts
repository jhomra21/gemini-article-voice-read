import type { Song, Album, AlbumFormData } from "./types";

const getBaseUrl = () => {
  return import.meta.env.PROD
    ? "https://ana-maria-turso-db-worker.jhonra121.workers.dev"
    : "http://127.0.0.1:8787";
};

// Function to fetch songs from our API
export const fetchSongs = async (): Promise<Song[]> => {
  const response = await fetch(`${getBaseUrl()}/songs`);
  if (!response.ok) {
    throw new Error("Failed to fetch songs");
  }
  const data = await response.json();
  return data.songs;
};

// Function to fetch albums from our API
export const fetchAlbums = async (): Promise<Album[]> => {
  const response = await fetch(`${getBaseUrl()}/albums`);
  if (!response.ok) {
    throw new Error("Failed to fetch albums");
  }
  const data = await response.json();
  return data.albums;
};

// Function to create a new song
export const createSong = async (songData: {
  title: string;
  duration_seconds: number;
  track_number: number;
  is_single: boolean;
  album_id?: number;
}): Promise<Song> => {
  const response = await fetch(`${getBaseUrl()}/songs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(songData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create song");
  }

  const data = await response.json();
  return data.song;
};

// Function to update a song
export const updateSong = async (songId: number, songData: {
  title: string;
  duration_seconds: number;
  track_number: number;
  is_single: boolean;
  album_id?: number | null; // Allow null for album_id
}): Promise<Song> => {
  const response = await fetch(`${getBaseUrl()}/songs/${songId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(songData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update song");
  }

  const data = await response.json();
  return data.song;
};

// ALBUM API FUNCTIONS

// Function to create an album
export const createAlbum = async (data: AlbumFormData): Promise<Album> => {
  const response = await fetch(`${getBaseUrl()}/albums`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create album");
  }
  
  const result = await response.json();
  return result.album;
};

// Function to update an album
export const updateAlbum = async ({ id, data }: { id: number; data: AlbumFormData }): Promise<Album> => {
  const response = await fetch(`${getBaseUrl()}/albums/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update album");
  }
  
  const result = await response.json();
  return result.album;
};

// Function to delete an album
export const deleteAlbum = async (id: number): Promise<void> => {
  const response = await fetch(`${getBaseUrl()}/albums/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); // Try to get error details
    throw new Error(errorData.error || "Failed to delete album");
  }
  // No JSON parsing if delete is successful and returns no content
}; 