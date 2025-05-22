import { createSignal } from "solid-js";
import { createMutation, useQueryClient } from "@tanstack/solid-query";
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

// Function to delete a song from the API
const deleteSong = async (songId: number): Promise<void> => {
  const response = await fetch(`http://127.0.0.1:8787/songs/${songId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete song");
  }
  
  return;
};

interface SongDeleteProps {
  songId: number;
  songTitle: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function SongDelete(props: SongDeleteProps) {
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = createSignal(false);

  // Delete song mutation
  const deleteSongMutation = createMutation(() => ({
    mutationFn: () => deleteSong(props.songId),
    onSuccess: () => {
      // Invalidate and refetch songs query
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      setIsDeleteDialogOpen(false);
      if (props.onSuccess) {
        props.onSuccess();
      }
    },
    onError: (error: Error) => {
      console.error("Error deleting song:", error);
      alert(`Failed to delete song: ${error.message}`);
      setIsDeleteDialogOpen(false);
      if (props.onError) {
        props.onError(error);
      }
    }
  }));

  const handleDelete = () => {
    deleteSongMutation.mutate();
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
            Are you sure you want to delete the song "{props.songTitle}"? 
            This action cannot be undone.
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
            disabled={deleteSongMutation.isPending}
            class="text-white"
          >
            {deleteSongMutation.isPending ? "Deleting..." : "Delete Song"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 