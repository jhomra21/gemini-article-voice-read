import type { ValidComponent } from "solid-js"
import { splitProps } from "solid-js"

import type { PolymorphicProps } from "@kobalte/core"
import * as TextFieldPrimitive from "@kobalte/core/text-field"

import { cn } from "~/lib/utils"

export type InputProps<T extends ValidComponent = "input"> = 
  TextFieldPrimitive.TextFieldInputProps<T> & {
  class?: string,
  type?: string
}

const Input = <T extends ValidComponent = "input">(
  props: PolymorphicProps<T, InputProps<T>>
) => {
  const [local, others] = splitProps(props as InputProps, ["class", "type"])
  
  return (
    <TextFieldPrimitive.Input
      type={local.type ?? "text"}
      class={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        local.class
      )}
      {...others}
    />
  )
}

export { Input } 