import { createSignal, Show, createEffect, type Accessor } from "solid-js";
import { useMutation } from "@tanstack/solid-query";
import type { Album } from "~/lib/types";
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
import { createSong } from "~/lib/apiService"; // Assuming createSong is exported from apiService

interface AddSongDialogProps {
  open: Accessor<boolean>;
  onOpenChange: (isOpen: boolean) => void;
  albums: Accessor<Album[] | undefined>;
  albumsLoading: Accessor<boolean>;
  albumsError: Accessor<any>; // Consider a more specific error type if available
  onSongAdded: () => void;
}

export function AddSongDialog(props: AddSongDialogProps) {
  const [isSingle, setIsSingle] = createSignal(false);
  const [title, setTitle] = createSignal("");
  const [duration, setDuration] = createSignal<number | undefined>(undefined);
  const [trackNumber, setTrackNumber] = createSignal<number | undefined>(1);
  const [selectedAlbum, setSelectedAlbum] = createSignal<Album | undefined>(undefined);
  const [isAlbumSelectOpen, setIsAlbumSelectOpen] = createSignal(false);
  const [isConfirming, setIsConfirming] = createSignal(false);

  // Effect to auto-reset confirmation state
  createEffect(() => {
    let timeoutId: number | undefined;
    if (isConfirming()) {
      timeoutId = window.setTimeout(() => setIsConfirming(false), 5000);
    }
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  });

  const resetConfirmationState = () => {
    if (isConfirming()) setIsConfirming(false);
  };

  const setTitleWithReset = (value: string) => {
    setTitle(value);
    resetConfirmationState();
  };

  const setDurationWithReset = (value: number | undefined) => {
    setDuration(value);
    resetConfirmationState();
  };

  const setTrackNumberWithReset = (value: number | undefined) => {
    setTrackNumber(value);
    resetConfirmationState();
  };

  const setIsSingleWithReset = (value: boolean) => {
    setIsSingle(value);
    resetConfirmationState();
  };

  const setSelectedAlbumWithReset = (value: Album | null) => {
    setSelectedAlbum(value || undefined);
    resetConfirmationState();
  };

  const createSongMutation = useMutation(() => ({
    mutationFn: createSong,
    onSuccess: () => {
      props.onSongAdded(); // Call parent callback
      // Reset form
      setTitle("");
      setDuration(undefined);
      setTrackNumber(1);
      setIsSingle(false);
      setSelectedAlbum(undefined);
      setIsConfirming(false);
      props.onOpenChange(false); // Close dialog
    },
    onError: (error: Error) => {
      console.error("Error creating song:", error);
      alert(`Failed to create song: ${error.message}`);
      setIsConfirming(false);
    }
  }));

  const handleAddSongSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!isConfirming()) {
      setIsConfirming(true);
      return;
    }

    if (!title()) {
      alert("Title is required");
      setIsConfirming(false);
      return;
    }
    if (duration() === undefined || isNaN(duration()!)) {
      alert("Duration is required and must be a number");
      setIsConfirming(false);
      return;
    }
    if (trackNumber() === undefined || isNaN(trackNumber()!)) {
      alert("Track number is required and must be a number");
      setIsConfirming(false);
      return;
    }

    const songData = {
      title: title(),
      duration_seconds: duration()!,
      track_number: trackNumber()!,
      is_single: isSingle(),
      album_id: selectedAlbum()?.id
    };
    createSongMutation.mutate(songData);
  };

  return (
    <Dialog open={props.open()} onOpenChange={props.onOpenChange}>
      <DialogContent class="sm:max-w-[425px]">
        <form onSubmit={handleAddSongSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Song</DialogTitle>
            <DialogDescription>
              Fill in the details below to add a new song. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <TextField class="grid grid-cols-4 items-center gap-4">
              <TextFieldLabel for="title" class="text-right">
                Title
              </TextFieldLabel>
              <TextFieldInput id="title" value={title()} onInput={(e) => setTitleWithReset(e.currentTarget.value)} class="col-span-3" />
            </TextField>
            <TextField class="grid grid-cols-4 items-center gap-4">
              <TextFieldLabel for="duration" class="text-right">
                Duration (sec)
              </TextFieldLabel>
              <TextFieldInput
                id="duration"
                type="number"
                value={duration() ?? ""}
                onInput={(e) => setDurationWithReset(e.currentTarget.valueAsNumber || undefined)}
                class="col-span-3"
              />
            </TextField>
            <TextField class="grid grid-cols-4 items-center gap-4">
              <TextFieldLabel for="track_number" class="text-right">
                Track #
              </TextFieldLabel>
              <TextFieldInput
                id="track_number"
                type="number"
                value={trackNumber() ?? 1}
                onInput={(e) => setTrackNumberWithReset(e.currentTarget.valueAsNumber || undefined)}
                class="col-span-3"
              />
            </TextField>
            <div class="grid grid-cols-4 items-center gap-4">
              <label for="is_single_checkbox" class="text-sm font-medium text-right">
                Single?
              </label>
              <Checkbox
                id="is_single_checkbox"
                checked={isSingle()}
                onChange={setIsSingleWithReset}
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
                <Show when={!props.albumsLoading() && !props.albumsError() && props.albums() && props.albums()!.length > 0}>
                  <UiSelect<Album>
                    options={props.albums() || []}
                    value={selectedAlbum()}
                    onChange={setSelectedAlbumWithReset}
                    optionValue="id"
                    optionTextValue="title"
                    open={isAlbumSelectOpen()}
                    onOpenChange={setIsAlbumSelectOpen}
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
                  <p class="text-sm text-muted-foreground">No albums found. Create one first.</p>
                </Show>
              </div>
            </div>
          </div>
          <DialogFooter class="relative">
            <Button
              type="submit"
              disabled={createSongMutation.isPending}
              class={`
                relative transition-all duration-300 ease-in-out
                min-w-[160px] px-4 py-2 font-medium
                ${isConfirming()
                  ? "bg-green-600 hover:bg-green-700 scale-105 shadow-lg"
                  : "transform hover:scale-[101%]"}
              `}
            >
              <span
                class="flex items-center justify-center gap-2 transition-all duration-300 ease-in-out"
                classList={{
                  "text-white": isConfirming()
                }}
              >
                {isConfirming() && !createSongMutation.isPending && (
                  <span class="inline-block text-white text-lg">✓</span>
                )}
                <span>
                  {createSongMutation.isPending
                    ? "Saving..."
                    : isConfirming()
                      ? "Confirm Add Song"
                      : "Save Song"}
                </span>
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 