import { createSignal, Show, createEffect, type Accessor, on } from "solid-js";
import { useMutation } from "@tanstack/solid-query";
import type { Album, AlbumFormData } from "~/lib/types";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Checkbox } from "~/components/ui/checkbox";
import { TextField, TextFieldInput, TextFieldLabel } from "~/components/ui/text-field";
import { updateAlbum } from "~/lib/apiService";

interface EditAlbumDialogProps {
  open: Accessor<boolean>;
  onOpenChange: (isOpen: boolean) => void;
  albumToEdit: Accessor<Album | null>;
  onAlbumUpdated: () => void;
}

export function EditAlbumDialog(props: EditAlbumDialogProps) {

  const [editTitle, setEditTitle] = createSignal("");
  const [editReleaseDate, setEditReleaseDate] = createSignal("");
  const [editCoverartUrl, setEditCoverartUrl] = createSignal("");
  const [editIsPublished, setEditIsPublished] = createSignal(false);

  // Effect to populate form when albumToEdit changes
  createEffect(on(props.albumToEdit, (album) => {
    if (album) {
      setEditTitle(album.title);
      setEditReleaseDate(album.release_date ? new Date(album.release_date).toISOString().split('T')[0] : "");
      setEditCoverartUrl(album.coverart_url || "");
      setEditIsPublished(album.is_published);
    } else {
      // Reset fields if albumToEdit becomes null (e.g., dialog closes and editingAlbum is cleared)
      setEditTitle("");
      setEditReleaseDate("");
      setEditCoverartUrl("");
      setEditIsPublished(false);
    }
  }));

  const updateAlbumMutation = useMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: AlbumFormData }) => updateAlbum({ id, data }),
    onSuccess: () => {
      props.onAlbumUpdated(); // Call parent callback
      props.onOpenChange(false); // Close dialog
    },
    onError: (error: Error) => {
      console.error("Error updating album:", error);
      alert(`Failed to update album: ${error.message}`);
    }
  }));

  const handleEditAlbumSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const currentAlbum = props.albumToEdit();
    if (!currentAlbum) return;

    if (!editTitle().trim()) {
      alert("Title is required.");
      return;
    }
    if (!editReleaseDate()) {
      alert("Release date is required.");
      return;
    }
    if (editCoverartUrl().trim() && !editCoverartUrl().match(/^https?:\/\//i)) {
        alert("Cover art URL must be a valid URL (e.g., start with http:// or https://).");
        return;
    }

    const formData: AlbumFormData = {
      title: editTitle().trim(),
      release_date: editReleaseDate(),
      coverart_url: editCoverartUrl().trim() || null,
      is_published: editIsPublished(),
    };
    updateAlbumMutation.mutate({ id: currentAlbum.id, data: formData });
  };

  return (
    <Dialog open={props.open()} onOpenChange={props.onOpenChange}>
      <DialogContent class="sm:max-w-[480px]">
        <form onSubmit={handleEditAlbumSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Album: {props.albumToEdit()?.title}</DialogTitle>
            <DialogDescription>
              Make changes to the album details below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <TextField class="grid grid-cols-4 items-center gap-4">
              <TextFieldLabel for="edit_album_title" class="text-right">
                Title
              </TextFieldLabel>
              <TextFieldInput 
                id="edit_album_title" 
                value={editTitle()} 
                onInput={(e) => setEditTitle(e.currentTarget.value)} 
                class="col-span-3"
              />
            </TextField>
            <TextField class="grid grid-cols-4 items-center gap-4">
              <TextFieldLabel for="edit_album_release_date" class="text-right">
                Release Date
              </TextFieldLabel>
              <TextFieldInput 
                id="edit_album_release_date" 
                type="date" 
                value={editReleaseDate()} 
                onInput={(e) => setEditReleaseDate(e.currentTarget.value)}
                class="col-span-3" 
              />
            </TextField>
            <TextField class="grid grid-cols-4 items-center gap-4">
              <TextFieldLabel for="edit_album_coverart_url" class="text-right">
                Cover Art URL
              </TextFieldLabel>
              <TextFieldInput 
                id="edit_album_coverart_url" 
                value={editCoverartUrl()} 
                onInput={(e) => setEditCoverartUrl(e.currentTarget.value)} 
                class="col-span-3"
              />
            </TextField>
            <div class="grid grid-cols-4 items-center gap-4">
              <label for="edit_album_is_published" class="text-sm font-medium text-right">
                Published?
              </label>
              <Checkbox 
                id="edit_album_is_published"
                checked={editIsPublished()} 
                onChange={setEditIsPublished} 
                class="col-span-3 justify-self-start"
              />
            </div>
            <Show when={editCoverartUrl().trim() && editCoverartUrl().match(/^https?:\/\//i)}>
               <div class="grid grid-cols-4 items-start gap-4">
                <span class="text-sm font-medium text-right pt-2">Preview</span>
                <div class="col-span-3 h-32 w-32 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 border dark:border-gray-600">
                  <img
                    src={editCoverartUrl()}
                    alt="Album cover preview"
                    class="h-full w-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder-album.jpg"; }}
                  />
                </div>
              </div>
            </Show>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={updateAlbumMutation.isPending}
              class="bg-blue-600 text-white hover:bg-blue-700"
            >
              {updateAlbumMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 