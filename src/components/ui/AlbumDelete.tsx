import { createSignal } from "solid-js";
import { useQueryClient, useMutation } from "@tanstack/solid-query";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

interface AlbumDeleteProps {
  albumId: number;
  albumTitle: string;
  onSuccess?: () => void; // Optional callback on successful deletion
  onError?: (error: Error) => void; // Optional callback on error
}

// Function to delete an album (copied from albums/index.tsx for now, can be centralized later)
const deleteAlbum = async (id: number): Promise<void> => {
  const response = await fetch(`http://127.0.0.1:8787/albums/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete album");
  }
  // No JSON parsing if delete is successful and returns no content (HTTP 204)
};

export function AlbumDelete(props: AlbumDeleteProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = createSignal(false);
  const queryClient = useQueryClient();

  const deleteAlbumMutation = useMutation(() => ({
    mutationFn: deleteAlbum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      queryClient.invalidateQueries({ queryKey: ["songs"] }); // Also invalidate songs as they might be affected
      setIsDeleteDialogOpen(false);
      if (props.onSuccess) {
        props.onSuccess();
      }
    },
    onError: (error: Error) => {
      console.error("Error deleting album:", error);
      alert(`Failed to delete album: ${error.message}`);
      setIsDeleteDialogOpen(false); // Close dialog on error as well
      if (props.onError) {
        props.onError(error);
      }
    },
  }));

  const handleDelete = () => {
    deleteAlbumMutation.mutate(props.albumId);
  };

  return (
    <Dialog open={isDeleteDialogOpen()} onOpenChange={setIsDeleteDialogOpen}>
      <DialogTrigger as={Button} variant="ghost" size="sm" class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
        Delete
      </DialogTrigger>
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the album "{props.albumTitle}"? 
            This action cannot be undone. This will also delete all songs associated with this album.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(false)}
            class="mr-2"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteAlbumMutation.isPending}
            class="text-white"
          >
            {deleteAlbumMutation.isPending ? "Deleting..." : "Delete Album"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 