<script>
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';

	let name = $state('');
	let selectedValue = $state('option1');
</script>

<div class="container mx-auto p-8 max-w-2xl">
	<h1 class="text-3xl font-bold mb-8">shadcn-svelte Demo</h1>

	<Card.Root class="">
		<Card.Header class="">
			<Card.Title class="">Sample Form</Card.Title>
			<Card.Description class="">This demonstrates shadcn-svelte components</Card.Description>
		</Card.Header>
		<Card.Content class="">
			<div class="space-y-4">
				<div class="space-y-2">
					<Label class="" for="name">Name</Label>
					<Input class="" type="text" id="name" bind:value={name} placeholder="Enter your name" />
				</div>

				<div class="space-y-2">
					<Label class="" for="select">Select Option</Label>
					<select
						id="select"
						bind:value={selectedValue}
						class="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="option1">Option 1</option>
						<option value="option2">Option 2</option>
						<option value="option3">Option 3</option>
					</select>
				</div>
			</div>
		</Card.Content>
		<Card.Footer class="">
			<Button class="" disabled={false}>Submit</Button>
			<Button class="" variant="outline" disabled={false}>Cancel</Button>
		</Card.Footer>
	</Card.Root>

	<div class="mt-8 p-4 border rounded-md">
		<h2 class="font-semibold mb-2">Preview:</h2>
		<p>Name: {name}</p>
		<p>Selected: {selectedValue}</p>
	</div>
	</div>
