import { createSignal, Show, createEffect, type Accessor, on } from "solid-js";
import { useMutation } from "@tanstack/solid-query";
import type { Album, Song } from "~/lib/types";
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
import {
  Select as UiSelect,
  SelectContent as UiSelectContent,
  SelectItem as UiSelectItem,
  SelectTrigger as UiSelectTrigger,
  SelectValue as UiSelectValue
} from "~/components/ui/select";
import { updateSong } from "~/lib/apiService";

interface EditSongDialogProps {
  open: Accessor<boolean>;
  onOpenChange: (isOpen: boolean) => void;
  songToEdit: Accessor<Song | null>;
  albums: Accessor<Album[] | undefined>;
  albumsLoading: Accessor<boolean>;
  albumsError: Accessor<any>; 
  onSongUpdated: () => void;
}

export function EditSongDialog(props: EditSongDialogProps) {

  const [editTitle, setEditTitle] = createSignal("");
  const [editDuration, setEditDuration] = createSignal<number>(0);
  const [editTrackNumber, setEditTrackNumber] = createSignal<number>(0);
  const [editIsSingle, setEditIsSingle] = createSignal(false);
  const [editAlbumId, setEditAlbumId] = createSignal<number | undefined>(undefined);
  // const [isEditAlbumSelectOpen, setIsEditAlbumSelectOpen] = createSignal(false); // If needed for UiSelect

  // Effect to populate form when songToEdit changes
  createEffect(on(props.songToEdit, (song) => {
    if (song) {
      setEditTitle(song.title);
      setEditDuration(song.duration_seconds);
      setEditTrackNumber(song.track_number);
      setEditIsSingle(song.is_single);
      setEditAlbumId(song.album_id);
    } else {
      // Optionally reset fields if songToEdit becomes null (e.g., dialog closes)
      setEditTitle("");
      setEditDuration(0);
      setEditTrackNumber(0);
      setEditIsSingle(false);
      setEditAlbumId(undefined);
    }
  }));

  const updateSongMutation = useMutation(() => ({
    mutationFn: (params: { id: number, data: any }) => updateSong(params.id, params.data),
    onSuccess: () => {
      props.onSongUpdated(); // Call parent callback
      props.onOpenChange(false); // Close dialog
    },
    onError: (error: Error) => {
      console.error("Error updating song:", error);
      alert(`Failed to update song: ${error.message}`);
    }
  }));

  const handleEditSongSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const currentSong = props.songToEdit();
    if (!currentSong) return;

    if (!editTitle().trim()) {
      alert("Title is required");
      return;
    }
    if (editDuration() <= 0) {
      alert("Duration must be greater than 0");
      return;
    }
    if (editTrackNumber() <= 0) {
      alert("Track number must be greater than 0");
      return;
    }

    const songData = {
      title: editTitle(),
      duration_seconds: editDuration(),
      track_number: editTrackNumber(),
      is_single: editIsSingle(),
      album_id: editAlbumId() || null 
    };
    updateSongMutation.mutate({ id: currentSong.id, data: songData });
  };

  return (
    <Dialog open={props.open()} onOpenChange={props.onOpenChange}>
      <DialogContent class="sm:max-w-[425px]">
        <form onSubmit={handleEditSongSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Song</DialogTitle>
            <DialogDescription>
              Make changes to the song details below.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <TextField class="grid grid-cols-4 items-center gap-4">
              <TextFieldLabel for="edit_title" class="text-right">
                Title
              </TextFieldLabel>
              <TextFieldInput 
                id="edit_title" 
                value={editTitle()} 
                onInput={(e) => setEditTitle(e.currentTarget.value)} 
                class="col-span-3" 
              />
            </TextField>
            <TextField class="grid grid-cols-4 items-center gap-4">
              <TextFieldLabel for="edit_duration" class="text-right">
                Duration (sec)
              </TextFieldLabel>
              <TextFieldInput 
                id="edit_duration" 
                type="number" 
                min="1"
                value={editDuration()} 
                onInput={(e) => {
                  const value = e.currentTarget.valueAsNumber;
                  if (!isNaN(value)) setEditDuration(value);
                }} 
                class="col-span-3" 
              />
            </TextField>
            <TextField class="grid grid-cols-4 items-center gap-4">
              <TextFieldLabel for="edit_track_number" class="text-right">
                Track #
              </TextFieldLabel>
              <TextFieldInput 
                id="edit_track_number" 
                type="number" 
                min="1"
                value={editTrackNumber()} 
                onInput={(e) => {
                  const value = e.currentTarget.valueAsNumber;
                  if (!isNaN(value)) setEditTrackNumber(value);
                }} 
                class="col-span-3" 
              />
            </TextField>
            <div class="grid grid-cols-4 items-center gap-4">
              <label for="edit_is_single_checkbox" class="text-sm font-medium text-right">
                Single?
              </label>
              <Checkbox 
                id="edit_is_single_checkbox"
                checked={editIsSingle()} 
                onChange={setEditIsSingle} 
                class="col-span-3 justify-self-start"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <label class="text-right text-sm font-medium">Album</label>
              <div class="col-span-3">
                <Show when={props.albumsLoading()}>
                  <p class="text-sm text-muted-foreground">Loading albums...</p>
                </Show>
                <Show when={!props.albumsLoading() && props.albumsError()}>
                  <p class="text-sm text-destructive">
                    Error loading albums: {props.albumsError()?.message || "Unknown error"}
                  </p>
                </Show>
                <Show when={!props.albumsLoading() && !props.albumsError() && props.albums()}>
                  <UiSelect<Album>
                    options={props.albums() || []}
                    value={props.albums()?.find(album => album.id === editAlbumId())}
                    onChange={(selectedOption: Album | null) => {
                      setEditAlbumId(selectedOption ? selectedOption.id : undefined);
                    }}
                    optionValue="id"
                    optionTextValue="title"
                    // open={isEditAlbumSelectOpen()} // Add state if needed for controlled open
                    // onOpenChange={setIsEditAlbumSelectOpen} // Add state if needed
                    itemComponent={(itemProps) => (
                      <UiSelectItem item={itemProps.item}>
                        {itemProps.item.rawValue.title}
                      </UiSelectItem>
                    )}
                    placeholder="Select an album"
                    class="w-full"
                  >
                    <UiSelectTrigger>
                      <UiSelectValue<Album>>
                        {(state) => state.selectedOption()?.title || "Select an album"}
                      </UiSelectValue>
                    </UiSelectTrigger>
                    <UiSelectContent portal={false} />
                  </UiSelect>
                </Show>
                <Show when={!props.albumsLoading() && !props.albumsError() && (!props.albums() || props.albums()!.length === 0)}>
                   <p class="text-sm text-muted-foreground">No albums available to select.</p>
                </Show>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={updateSongMutation.isPending}
              class="bg-blue-600 text-white hover:bg-blue-700"
            >
              {updateSongMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 