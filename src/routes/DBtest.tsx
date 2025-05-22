import { For, Show } from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import { turso } from "../lib/turso";
import type { Album, Song } from "../lib/types";
import { AlbumCard } from "../components/AlbumCard";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { Link } from "@tanstack/solid-router";

// Helper function to map database rows to TypeScript objects
const mapRowToSong = (row: any): Song => ({
  id: row.s_id as number,
  title: row.s_title as string,
  duration_seconds: row.duration_seconds as number,
  track_number: row.track_number as number,
  is_single: Boolean(row.is_single),
  album_id: row.album_id as number,
});

const mapRowToAlbum = (row: any, songs: Song[]): Album => ({
  id: row.a_id as number,
  title: row.a_title as string,
  release_date: row.release_date as string,
  coverart_url: row.coverart_url as string,
  songs: songs.filter(song => song.album_id === (row.a_id as number)),
  is_published: Boolean(row.is_published),
});

// Fetching function for Tanstack Query
const fetchAlbumsAndSongs = async (): Promise<Album[]> => {
  const query = `
    SELECT
      a.id AS a_id,
      a.title AS a_title,
      a.release_date,
      a.coverart_url,
      s.id AS s_id,
      s.title AS s_title,
      s.duration_seconds,
      s.track_number,
      s.is_single,
      s.album_id,
      a.is_published
    FROM albums a
    LEFT JOIN songs s ON a.id = s.album_id
    ORDER BY a.release_date DESC, s.track_number ASC;
  `;
  const result = await turso.execute(query);

  if (result.rows.length === 0) {
    return [];
  }

  const songsMap = new Map<number, Song[]>();
  result.rows.forEach(row => {
    if (row.s_id !== null) {
      const song = mapRowToSong(row);
      const albumSongs = songsMap.get(song.album_id) || [];
      albumSongs.push(song);
      songsMap.set(song.album_id, albumSongs);
    }
  });

  const uniqueAlbumRows = result.rows.filter((row, index, self) =>
    index === self.findIndex((r) => r.a_id === row.a_id)
  );

  return uniqueAlbumRows.map(row =>
    mapRowToAlbum(row, songsMap.get(row.a_id as number) || [])
  );
};

export default function DBTest() {
  const albumsQuery = useQuery(() => ({
    queryKey: ["albums"],
    queryFn: fetchAlbumsAndSongs,
  }));

  return (
    <div class="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 class="text-3xl font-bold mb-6 text-center">Ana Maria's Discography</h1>
      <div class="flex justify-center items-center gap-4 mb-6">
        <Button>
          <Icon name="music" />
          <Link to="/albums">
            Albums
          </Link>
        </Button>
        <Button>
          <Icon name="musicNote" />
          <Link to="/songs">
            Songs
          </Link>
        </Button>
      </div>
      
      <Show when={albumsQuery.isLoading}>
        <div class="flex justify-center items-center min-h-[40vh]">
          <p class="text-lg text-gray-600">Loading albums...</p>
        </div>
      </Show>
      
      <Show when={albumsQuery.isError}>
        <div class="flex justify-center items-center min-h-[40vh]">
          <p class="text-lg text-red-600">
            Error: {albumsQuery.error?.message || "An unknown error occurred"}
          </p>
        </div>
      </Show>
      
      <Show 
        when={!albumsQuery.isLoading && !albumsQuery.isError && albumsQuery.data && albumsQuery.data.length > 0}
        fallback={
          <Show when={!albumsQuery.isLoading && !albumsQuery.isError}>
            <div class="text-center py-10">
              <p class="text-xl text-gray-700">No albums found.</p>
              <p class="text-sm text-gray-500">Check back later or try adding some music!</p>
            </div>
          </Show>
        }
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <For each={albumsQuery.data}>
            {(album) => <AlbumCard album={album} />}
          </For>
        </div>
      </Show>
    </div>
  );
}
