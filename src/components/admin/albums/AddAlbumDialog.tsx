import { createSignal, Show, createEffect, type Accessor } from "solid-js";
import { useQueryClient, useMutation } from "@tanstack/solid-query";
import type { AlbumFormData } from "~/lib/types";
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
import { createAlbum } from "~/lib/apiService";

interface AddAlbumDialogProps {
  open: Accessor<boolean>;
  onOpenChange: (isOpen: boolean) => void;
  onAlbumAdded: () => void;
}

export function AddAlbumDialog(props: AddAlbumDialogProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = createSignal("");
  const [releaseDate, setReleaseDate] = createSignal(""); // Store as string YYYY-MM-DD
  const [coverartUrl, setCoverartUrl] = createSignal("");
  const [isPublished, setIsPublished] = createSignal(false);
  const [isConfirmingAdd, setIsConfirmingAdd] = createSignal(false);

  // Effect for Add Album confirmation timeout
  createEffect(() => {
    let timeoutId: number | undefined;
    if (isConfirmingAdd()) {
      timeoutId = window.setTimeout(() => {
        setIsConfirmingAdd(false);
      }, 5000); // 5 seconds
    }
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  });

  const resetAddAlbumConfirmation = () => {
    if (isConfirmingAdd()) {
      setIsConfirmingAdd(false);
    }
  };

  // Add Album Form Setters with Reset
  const setTitleWithReset = (value: string) => {
    setTitle(value);
    resetAddAlbumConfirmation();
  };
  const setReleaseDateWithReset = (value: string) => {
    setReleaseDate(value);
    resetAddAlbumConfirmation();
  };
  const setCoverartUrlWithReset = (value: string) => {
    setCoverartUrl(value);
    resetAddAlbumConfirmation();
  };
  const setIsPublishedWithReset = (value: boolean) => {
    setIsPublished(value);
    resetAddAlbumConfirmation();
  };

  const createAlbumMutation = useMutation(() => ({
    mutationFn: createAlbum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      props.onOpenChange(false); // Close dialog
      // Reset form fields
      setTitle("");
      setReleaseDate("");
      setCoverartUrl("");
      setIsPublished(false);
      setIsConfirmingAdd(false);
      props.onAlbumAdded(); // Call parent callback
    },
    onError: (error: Error) => {
      console.error("Error creating album:", error);
      alert(`Failed to create album: ${error.message}`);
      setIsConfirmingAdd(false); // Reset confirmation on error
    }
  }));

  const handleAddAlbumSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    if (!isConfirmingAdd()) {
      setIsConfirmingAdd(true);
      return;
    }

    if (!title().trim()) {
      alert("Title is required.");
      setIsConfirmingAdd(false);
      return;
    }
    if (!releaseDate()) {
      alert("Release date is required.");
      setIsConfirmingAdd(false);
      return;
    }
    // Basic URL validation (starts with http/https)
    if (coverartUrl().trim() && !coverartUrl().match(/^https?:\/\//i)) {
        alert("Cover art URL must be a valid URL (e.g., start with http:// or https://).");
        setIsConfirmingAdd(false);
        return;
    }

    const formData: AlbumFormData = {
      title: title().trim(),
      release_date: releaseDate(), // Ensure this is in YYYY-MM-DD
      coverart_url: coverartUrl().trim() || null,
      is_published: isPublished(),
    };
    createAlbumMutation.mutate(formData);
  };
  
  // Effect to reset form when dialog is closed externally
  createEffect(() => {
    if (!props.open()) {
      setTitle("");
      setReleaseDate("");
      setCoverartUrl("");
      setIsPublished(false);
      setIsConfirmingAdd(false);
    }
  });

  return (
    <Dialog open={props.open()} onOpenChange={props.onOpenChange}>
      <DialogContent class="sm:max-w-[480px]">
        <form onSubmit={handleAddAlbumSubmit}>
        <DialogHeader>
          <DialogTitle>Add New Album</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new album. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <TextField class="grid grid-cols-4 items-center gap-4">
            <TextFieldLabel for="add_album_title" class="text-right">
              Title
            </TextFieldLabel>
            <TextFieldInput 
              id="add_album_title" 
              value={title()} 
              onInput={(e) => setTitleWithReset(e.currentTarget.value)} 
              class="col-span-3"
              placeholder="Album Title"
            />
          </TextField>
          <TextField class="grid grid-cols-4 items-center gap-4">
            <TextFieldLabel for="add_album_release_date" class="text-right">
              Release Date
            </TextFieldLabel>
            <TextFieldInput 
              id="add_album_release_date" 
              type="date" 
              value={releaseDate()} 
              onInput={(e) => setReleaseDateWithReset(e.currentTarget.value)}
              class="col-span-3" 
            />
          </TextField>
          <TextField class="grid grid-cols-4 items-center gap-4">
            <TextFieldLabel for="add_album_coverart_url" class="text-right">
              Cover Art URL
            </TextFieldLabel>
            <TextFieldInput 
              id="add_album_coverart_url" 
              value={coverartUrl()} 
              onInput={(e) => setCoverartUrlWithReset(e.currentTarget.value)} 
              class="col-span-3"
              placeholder="https://example.com/cover.jpg"
            />
          </TextField>
          <div class="grid grid-cols-4 items-center gap-4">
            <label for="add_album_is_published" class="text-sm font-medium text-right">
              Published?
            </label>
            <Checkbox 
              id="add_album_is_published"
              checked={isPublished()} 
              onChange={setIsPublishedWithReset} 
              class="col-span-3 justify-self-start"
            />
          </div>
          <Show when={coverartUrl().trim() && coverartUrl().match(/^https?:\/\//i)}>
            <div class="grid grid-cols-4 items-start gap-4">
              <span class="text-sm font-medium text-right pt-2">Preview</span>
              <div class="col-span-3 h-32 w-32 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 border dark:border-gray-600">
                <img
                  src={coverartUrl()}
                  alt="Album cover preview"
                  class="h-full w-full object-cover"
                  onError={(e) => { 
                    // Attempt to hide or show placeholder if URL is invalid after trying to load
                    // This simple onError might not be enough if URL is typed and then becomes invalid
                    // but good for broken links
                    (e.currentTarget as HTMLImageElement).style.display = 'none'; 
                    // Optionally show a placeholder text/icon here
                  }}
                />
              </div>
            </div>
          </Show>
        </div>
        <DialogFooter class="relative">
          <Button 
            type="submit" 
            disabled={createAlbumMutation.isPending}
            class={`
              relative transition-all duration-300 ease-in-out 
              min-w-[180px] px-4 py-2 font-medium
              ${isConfirmingAdd() 
                ? "bg-green-600 hover:bg-green-700 scale-105 shadow-lg" 
                : "bg-blue-600 hover:bg-blue-700 transform hover:scale-[101%]"}
            `}
          >
            <span 
              class="flex items-center justify-center gap-2 transition-all duration-300 ease-in-out"
              classList={{ "text-white": isConfirmingAdd() }}
            >
              {isConfirmingAdd() && !createAlbumMutation.isPending && (
                <span class="inline-block text-white text-lg">✓</span>
              )}
              <span>
                {createAlbumMutation.isPending 
                  ? "Saving..." 
                  : isConfirmingAdd() 
                    ? "Confirm Add Album" 
                    : "Save Album"}
              </span>
            </span>
          </Button>
        </DialogFooter>
      </form>
      </DialogContent>
    </Dialog>
  );
} 