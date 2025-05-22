import { createSignal, For, Show, createMemo } from "solid-js";
import { useQuery, useQueryClient } from "@tanstack/solid-query";
import type { Album } from "../../../lib/types";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "~/components/ui/table";
import { AlbumDelete } from "~/components/ui/AlbumDelete";
import { fetchAlbums } from "../../../lib/apiService";
import { AddAlbumDialog } from "../../../components/admin/albums/AddAlbumDialog";
import { EditAlbumDialog } from "../../../components/admin/albums/EditAlbumDialog";

export default function AlbumsPage() {
  const queryClient = useQueryClient();
  const [isAddAlbumDialogOpen, setIsAddAlbumDialogOpen] = createSignal(false);
  
  // State for Edit Album Dialog
  const [isEditAlbumDialogOpen, setIsEditAlbumDialogOpen] = createSignal(false);
  const [editingAlbum, setEditingAlbum] = createSignal<Album | null>(null);
  
  // Use the query client to access the data that was loaded by the router
  const albumsQuery = useQuery(() => ({
    queryKey: ["albums"],
    queryFn: fetchAlbums,
    initialData: queryClient.getQueryData(["albums"]),
    staleTime: 5 * 60 * 1000 // 5 minutes
  }));
  
  // Pre-process albums data when it loads
  const processedAlbums = createMemo(() => {
    if (!albumsQuery.data) return [];
    
    return albumsQuery.data.map(album => ({
      ...album,
      // Pre-format release date to avoid doing it during render
      formattedReleaseDate: new Date(album.release_date).toLocaleDateString()
    }));
  });
  
  const openEditDialog = (album: Album) => {
    setEditingAlbum(album);
    setIsEditAlbumDialogOpen(true);
  };

  const handleAlbumAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["albums"] });
    // AddAlbumDialog handles its own closing.
  };

  const handleAlbumUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["albums"] });
    setEditingAlbum(null); // Clear the album being edited
    // EditAlbumDialog handles its own closing.
  };

  return (
    <div class="container mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Albums</h1>
        <Button 
          onClick={() => setIsAddAlbumDialogOpen(true)} 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Create Album
        </Button>
        <Show when={isAddAlbumDialogOpen()}>
          <AddAlbumDialog 
            open={isAddAlbumDialogOpen}
            onOpenChange={setIsAddAlbumDialogOpen}
            onAlbumAdded={handleAlbumAdded}
          />
        </Show>
      </div>
      
      <Show when={isEditAlbumDialogOpen()}>
        <EditAlbumDialog
          open={isEditAlbumDialogOpen}
          onOpenChange={setIsEditAlbumDialogOpen}
          albumToEdit={editingAlbum}
          onAlbumUpdated={handleAlbumUpdated}
        />
      </Show>

      <Show when={albumsQuery.isLoading}>
        <div class="flex justify-center items-center h-64">
          <p class="text-gray-500 dark:text-gray-400">Loading albums...</p>
        </div>
      </Show>
      
      <Show when={albumsQuery.isError}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span class="block sm:inline">
            Error loading albums: {albumsQuery.error?.message || "Unknown error"}
          </span>
        </div>
      </Show>
      
      <Show when={!albumsQuery.isLoading && !albumsQuery.isError}>
        <div class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <Table>
            <TableCaption>Albums</TableCaption>
            <TableHeader>
              <TableRow>
                {/* <TableHead class="w-1/6">Cover</TableHead> */}
                <TableHead class="w-1/3">Title</TableHead>
                <TableHead class="w-1/6">Release Date</TableHead>
                <TableHead class="w-1/12">Status</TableHead>
                <TableHead class="w-1/12">Songs</TableHead>
                <TableHead class="w-1/5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Show
                when={albumsQuery.data && albumsQuery.data.length > 0}
                fallback={
                  <TableRow>
                    <TableCell colSpan={6} class="h-24 text-center text-gray-500 dark:text-gray-400">
                      No albums found
                    </TableCell>
                  </TableRow>
                }
              >
                <For each={processedAlbums()}>
                  {(album) => (
                    <TableRow class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell>
                        <div class="h-12 w-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <img
                            src={album.coverart_url || "/placeholder-album.jpg"}
                            alt={`${album.title} cover`}
                            class="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {album.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {album.formattedReleaseDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span class={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium ${
                          album.is_published 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {album.is_published ? 'Published' : 'Draft'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {album.songs?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell class="text-right">
                        <div class="flex justify-end items-center gap-2 pr-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(album)}
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            Edit
                          </Button>
                          <AlbumDelete 
                            albumId={album.id} 
                            albumTitle={album.title}
                            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["albums"] })}
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
      </Show>
    </div>
  );
} 