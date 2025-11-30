<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import * as Calendar from "./index.js";
	import { cn } from "$lib/utils.js";
	import { isEqualMonth } from "@internationalized/date";
	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		class: className,
		weekdayFormat = "short" as "short" | "long" | "narrow",
		buttonVariant = "ghost",
		captionLayout = "label",
		locale = "en-US",
		months: monthsProp = undefined,
		years = undefined,
		monthFormat: monthFormatProp = undefined,
		yearFormat = "numeric" as "numeric" | "2-digit",
		day = undefined,
		disableDaysOutsideMonth = false,
		type = "single" as "single" | "multiple",
		...restProps
	} = $props();

	const monthFormat = $derived.by(() => {
		if (monthFormatProp) return monthFormatProp;
		if (captionLayout.startsWith("dropdown")) return "short";
		return "long";
	});
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<CalendarPrimitive.Root
	bind:value={value}
	bind:ref
	bind:placeholder
	{type}
	weekdayFormat={weekdayFormat}
	{disableDaysOutsideMonth}
	class={cn(
		"bg-background group/calendar p-3 [--cell-size:--spacing(8)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
		className
	)}
	{locale}
	monthFormat={monthFormat}
	yearFormat={yearFormat}
	{...restProps}
>
	{#snippet children({ months, weekdays }: { months: any; weekdays: any })}
		<Calendar.Months class="">
			<Calendar.Nav class="">
				<Calendar.PrevButton variant={buttonVariant} class="">{''}</Calendar.PrevButton>
				<Calendar.NextButton variant={buttonVariant} class="">{''}</Calendar.NextButton>
			</Calendar.Nav>
			{#each months as month, monthIndex (month)}
				<Calendar.Month class="">
					<Calendar.Header class="">
						<Calendar.Caption
							{captionLayout}
							months={monthsProp}
							{monthFormat}
							{years}
							{yearFormat}
							month={month.value}
							bind:placeholder
							{locale}
							{monthIndex}
						/>
					</Calendar.Header>
					<Calendar.Grid class="">
						<Calendar.GridHead class="">
							<Calendar.GridRow class="select-none">
							{#each weekdays as weekday (weekday)}
								<Calendar.HeadCell class="">
									{weekday.slice(0, 2)}
								</Calendar.HeadCell>
								{/each}
							</Calendar.GridRow>
						</Calendar.GridHead>
						<Calendar.GridBody class="">
							{#each month.weeks as weekDates (weekDates)}
								<Calendar.GridRow class="mt-2 w-full">
								{#each weekDates as date (date)}
									<Calendar.Cell {date} month={month.value} class="">
										{#if day}
											{@render day({
												day: date,
												outsideMonth: !isEqualMonth(date, month.value),
											})}
										{:else}
											<Calendar.Day class="" />
										{/if}
										</Calendar.Cell>
									{/each}
								</Calendar.GridRow>
							{/each}
						</Calendar.GridBody>
					</Calendar.Grid>
				</Calendar.Month>
			{/each}
		</Calendar.Months>
	{/snippet}
</CalendarPrimitive.Root>