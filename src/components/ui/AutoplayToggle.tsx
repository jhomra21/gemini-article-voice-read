import { createSignal, Show } from 'solid-js';
import { Toggle } from './toggle';
import { cn } from '~/lib/utils';

interface AutoplayToggleProps {
  class?: string;
  onChange?: (enabled: boolean) => void;
  defaultEnabled?: boolean;
}

export function AutoplayToggle(props: AutoplayToggleProps) {
  const [enabled, setEnabled] = createSignal(props.defaultEnabled ?? true);

  const handleToggle = () => {
    const newValue = !enabled();
    setEnabled(newValue);
    props.onChange?.(newValue);
  };

  return (
    <div class={cn("flex items-center gap-2", props.class)}>
      <Toggle
        pressed={enabled()}
        onChange={handleToggle}
        variant="outline"
        size="sm"
        class={cn(
          "data-[pressed]:bg-primary data-[pressed]:text-primary-foreground",
          "transition-colors"
        )}
        aria-label="Toggle autoplay"
      >
        <div class="flex items-center gap-1.5">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-3.5 w-3.5" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span class="text-xs">Autoplay</span>
        </div>
      </Toggle>
      <Show when={enabled()}>
        <span class="text-xs text-muted-foreground">On</span>
      </Show>
      <Show when={!enabled()}>
        <span class="text-xs text-muted-foreground">Off</span>
      </Show>
    </div>
  );
} 