<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	type ButtonVariant = "link" | "default" | "destructive" | "outline" | "secondary" | "ghost";

	let {
		ref = $bindable(null),
		class: className,
		children = undefined,
		variant = "ghost" as ButtonVariant,
		...restProps
	} = $props();
</script>

{#snippet Fallback()}
	<ChevronLeftIcon class="size-4" />
{/snippet}

<CalendarPrimitive.PrevButton
	bind:ref
	class={cn(
		buttonVariants({ variant }),
		"size-(--cell-size) select-none bg-transparent p-0 disabled:opacity-50 rtl:rotate-180 text-foreground hover:text-foreground",
		className
	)}
	children={children || Fallback}
	{...restProps}
/>