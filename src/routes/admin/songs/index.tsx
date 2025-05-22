import { createSignal, For, Show, createMemo } from "solid-js";
import { useQuery, useQueryClient } from "@tanstack/solid-query";
import type { Song } from "../../../lib/types";
import { Button } from "~/components/ui/button";
import { SongDelete } from "~/components/ui/SongDelete";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "~/components/ui/table";
import { fetchAlbums, fetchSongs } from "../../../lib/apiService";
import { AddSongDialog } from "../../../components/admin/songs/AddSongDialog";
import { EditSongDialog } from "../../../components/admin/songs/EditSongDialog";

export default function SongsPage() {
  const queryClient = useQueryClient();
  
  // Use the query client to access the data that was loaded by the router
  const songsQuery = useQuery(() => ({
    queryKey: ["songs"],
    queryFn: fetchSongs,
    initialData: queryClient.getQueryData(["songs"]),
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));
  
  const [isAddSongDialogOpen, setIsAddSongDialogOpen] = createSignal(false);
  
  // State for EditSongDialog
  const [isEditDialogOpen, setIsEditDialogOpen] = createSignal(false);
  const [songToEdit, setSongToEdit] = createSignal<Song | null>(null);
  
  const albumsQuery = useQuery(() => ({
    queryKey: ["albums"],
    queryFn: fetchAlbums,
    // Only fetch albums when we actually need them for dialogs
    enabled: isAddSongDialogOpen() || isEditDialogOpen()
  }));
  
  const handleOpenEditDialog = (song: Song) => {
    setSongToEdit(song);
    setIsEditDialogOpen(true);
  };

  const handleSongAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["songs"] });
  };

  const handleSongUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["songs"] });
    setSongToEdit(null);
  };

  // Pre-process songs data when it loads (#7)
  const processedSongs = createMemo(() => {
    if (!songsQuery.data) return [];
    
    return songsQuery.data.map((song: Song) => ({
      ...song,
      // Pre-calculate formatted duration (#6)
      formattedDuration: `${Math.floor(song.duration_seconds / 60)}:${(song.duration_seconds % 60).toString().padStart(2, '0')}`
    }));
  });

  return (
    <div class="container mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Songs</h1>
        <Button onClick={() => setIsAddSongDialogOpen(true)} class=" bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Add Song
        </Button>
        <Show when={isAddSongDialogOpen()}>
          <AddSongDialog
            open={isAddSongDialogOpen}
            onOpenChange={setIsAddSongDialogOpen}
            albums={() => albumsQuery.data}
            albumsLoading={() => albumsQuery.isLoading}
            albumsError={() => albumsQuery.error}
            onSongAdded={handleSongAdded}
          />
        </Show>
      </div>
      
      <Show when={isEditDialogOpen()}>
        <EditSongDialog 
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          songToEdit={songToEdit} 
          albums={() => albumsQuery.data}
          albumsLoading={() => albumsQuery.isLoading}
          albumsError={() => albumsQuery.error}
          onSongUpdated={handleSongUpdated}
        />
      </Show>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableCaption>Songs</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead class="w-1/4">Title</TableHead>
              <TableHead class="w-1/6">Album</TableHead>
              <TableHead class="w-1/12">Track #</TableHead>
              <TableHead class="w-1/12">Duration</TableHead>
              <TableHead class="w-1/12">Single</TableHead>
              <TableHead class="w-1/6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show
              when={songsQuery.data && songsQuery.data.length > 0}
              fallback={
                <TableRow>
                  <TableCell colSpan={6} class="h-24 text-center text-gray-500 dark:text-gray-400">
                    No songs found
                  </TableCell>
                </TableRow>
              }
            >
              <For each={processedSongs()}>
                {(song) => (
                  <TableRow>
                    <TableCell>
                      <div class="font-medium">{song.title}</div>
                    </TableCell>
                    <TableCell>
                      <div class="text-muted-foreground">
                        {(song as any).album_title || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="text-muted-foreground">
                        {song.track_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="text-muted-foreground">
                        {song.formattedDuration}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="text-muted-foreground">
                        {song.is_single ? "Yes" : "No"}
                      </div>
                    </TableCell>
                    <TableCell class="text-right">
                      <div class="flex justify-end items-center gap-2 pr-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          onClick={() => handleOpenEditDialog(song)}
                        >
                          Edit
                        </Button>
                        <SongDelete 
                          songId={song.id} 
                          songTitle={song.title} 
                          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["songs"] })}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </Show>
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 