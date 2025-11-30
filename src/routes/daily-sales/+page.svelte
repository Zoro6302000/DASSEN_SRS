<script lang="ts">
	import { mode } from 'mode-watcher';
	import './styles.css';
	import DailySalesPrint from '$lib/print/DailySalesPrint.svelte';
	import { printDocument } from '$lib/print/printUtils';
	import type { Denomination } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Popover from '$lib/components/ui/popover';
	import { DateFormatter, type DateValue, parseDate, getLocalTimeZone } from '@internationalized/date';

	let isDark = $derived(mode.current === 'dark');

	// Types
	type DailyRow = {
		id: number;
		nozzle: string;
		product: string;
		opening: number;
		closing: number;
		openingPeso: number;
		closingPeso: number;
	};

	type ExpenseRow = {
		id: number;
		description: string;
		amount: number;
	};

	type LubricantRow = {
		id: number;
		productId: string;
		productName: string;
		quantity: number;
		price: number;
		amount: number;
	};

	type LubricantProduct = {
		id: string;
		name: string;
		price: number;
	};

	// Factory functions
	const createRow = (): DailyRow => ({
		id: Date.now() + Math.random(),
		nozzle: '',
		product: 'Diesel',
		opening: 0,
		closing: 0,
		openingPeso: 0,
		closingPeso: 0
	});
	const createExpenseRow = (): ExpenseRow => ({
		id: Date.now() + Math.random(),
		description: '',
		amount: 0
	});
	const createLubricantRow = (): LubricantRow => ({
		id: Date.now() + Math.random(),
		productId: '',
		productName: '',
		quantity: 1,
		price: 0,
		amount: 0
	});

	// State
	let dailyRows = $state<DailyRow[]>(Array.from({ length: 8 }, () => createRow()));
	let expenseRows = $state<ExpenseRow[]>([createExpenseRow()]);
	let lubricantRows = $state<LubricantRow[]>([createLubricantRow()]);
	let salesDate = $state(new Date().toISOString().slice(0, 10));
	let calendarValue = $state<DateValue | undefined>(parseDate(new Date().toISOString().slice(0, 10)));
	let shift = $state('Morning');
	let cashier = $state('');
	
	// Date formatter
	const df = new DateFormatter('en-US', { dateStyle: 'medium' });
	
	// Sync calendar with input
	$effect(() => {
		if (calendarValue) {
			salesDate = `${calendarValue.year}-${String(calendarValue.month).padStart(2, '0')}-${String(calendarValue.day).padStart(2, '0')}`;
		}
	});
	let lubricantProducts = $state<LubricantProduct[]>([]);
	const initialDenoms = () =>
		[1000, 500, 200, 100, 50, 20].map((v) => ({
			value: v,
			label: `₱${v.toLocaleString()}`,
			count: 0
		}));
	let denominations = $state<Denomination[]>(initialDenoms());
	let coinsAmount = $state(0);
	let checkPayment = $state(0);
	let bankTransfer = $state(0);

	// Load lubricant products
	$effect(() => {
		fetch('/api/lubricant-products')
			.then((r) => r.json())
			.then((result) => {
				if (result.success) lubricantProducts = result.products;
			});
	});

	// Keyboard navigation handlers
	const navigate = (selector: string) => {
		const input = document.querySelector(selector) as HTMLInputElement;
		input?.focus();
	};

	const handleKeyDown = (event: KeyboardEvent, rowIndex: number, field: string) => {
		const target = event.target as HTMLInputElement;
		const fields = ['nozzle', 'product', 'opening', 'closing', 'openingPeso', 'closingPeso'];
		const currentFieldIndex = fields.indexOf(field);
		const atStart = target.type === 'number' || target.selectionStart === 0;
		const atEnd = target.type === 'number' || target.selectionStart === target.value.length;

		const actions: Record<string, () => void> = {
			ArrowRight: () =>
				atEnd &&
				currentFieldIndex < fields.length - 1 &&
				navigate(`[data-row="${rowIndex}"][data-field="${fields[currentFieldIndex + 1]}"]`),
			ArrowLeft: () =>
				atStart &&
				currentFieldIndex > 0 &&
				navigate(`[data-row="${rowIndex}"][data-field="${fields[currentFieldIndex - 1]}"]`),
			ArrowDown: () =>
				rowIndex < dailyRows.length - 1 &&
				navigate(`[data-row="${rowIndex + 1}"][data-field="${field}"]`),
			ArrowUp: () =>
				rowIndex > 0 && navigate(`[data-row="${rowIndex - 1}"][data-field="${field}"]`),
			Enter: () =>
				currentFieldIndex < fields.length - 1
					? navigate(`[data-row="${rowIndex}"][data-field="${fields[currentFieldIndex + 1]}"]`)
					: rowIndex < dailyRows.length - 1 &&
						navigate(`[data-row="${rowIndex + 1}"][data-field="nozzle"]`)
		};

		if (actions[event.key]) {
			event.preventDefault();
			actions[event.key]();
		}
	};

	const handleExpenseKeyDown = (event: KeyboardEvent, rowIndex: number, field: string) => {
		const target = event.target as HTMLInputElement;
		const fields = ['description', 'amount'];
		const currentFieldIndex = fields.indexOf(field);
		const atStart = target.type === 'number' || target.selectionStart === 0;
		const atEnd = target.type === 'number' || target.selectionStart === target.value.length;

		const actions: Record<string, () => void> = {
			ArrowRight: () =>
				atEnd &&
				currentFieldIndex < fields.length - 1 &&
				navigate(
					`[data-expense-row="${rowIndex}"][data-expense-field="${fields[currentFieldIndex + 1]}"]`
				),
			ArrowLeft: () =>
				atStart &&
				currentFieldIndex > 0 &&
				navigate(
					`[data-expense-row="${rowIndex}"][data-expense-field="${fields[currentFieldIndex - 1]}"]`
				),
			ArrowDown: () =>
				rowIndex < expenseRows.length - 1
					? navigate(`[data-expense-row="${rowIndex + 1}"][data-expense-field="${field}"]`)
					: (addExpenseRow(),
						setTimeout(
							() => navigate(`[data-expense-row="${rowIndex + 1}"][data-expense-field="${field}"]`),
							0
						)),
			ArrowUp: () =>
				rowIndex > 0 &&
				navigate(`[data-expense-row="${rowIndex - 1}"][data-expense-field="${field}"]`),
			Enter: () =>
				currentFieldIndex < fields.length - 1
					? navigate(
							`[data-expense-row="${rowIndex}"][data-expense-field="${fields[currentFieldIndex + 1]}"]`
						)
					: (addExpenseRow(),
						setTimeout(
							() =>
								navigate(`[data-expense-row="${rowIndex + 1}"][data-expense-field="description"]`),
							0
						))
		};

		if (actions[event.key]) {
			event.preventDefault();
			actions[event.key]();
		}
	};

	const handleLubricantKeyDown = (event: KeyboardEvent, rowIndex: number, field: string) => {
		const target = event.target as HTMLInputElement;
		const fields = ['description', 'amount'];
		const currentFieldIndex = fields.indexOf(field);
		const atStart = target.type === 'number' || target.selectionStart === 0;
		const atEnd = target.type === 'number' || target.selectionStart === target.value.length;

		const actions: Record<string, () => void> = {
			ArrowRight: () =>
				atEnd &&
				currentFieldIndex < fields.length - 1 &&
				navigate(
					`[data-lubricant-row="${rowIndex}"][data-lubricant-field="${fields[currentFieldIndex + 1]}"]`
				),
			ArrowLeft: () =>
				atStart &&
				currentFieldIndex > 0 &&
				navigate(
					`[data-lubricant-row="${rowIndex}"][data-lubricant-field="${fields[currentFieldIndex - 1]}"]`
				),
			ArrowDown: () =>
				rowIndex < lubricantRows.length - 1
					? navigate(`[data-lubricant-row="${rowIndex + 1}"][data-lubricant-field="${field}"]`)
					: (addLubricantRow(),
						setTimeout(
							() =>
								navigate(`[data-lubricant-row="${rowIndex + 1}"][data-lubricant-field="${field}"]`),
							0
						)),
			ArrowUp: () =>
				rowIndex > 0 &&
				navigate(`[data-lubricant-row="${rowIndex - 1}"][data-lubricant-field="${field}"]`),
			Enter: () =>
				currentFieldIndex < fields.length - 1
					? navigate(
							`[data-lubricant-row="${rowIndex}"][data-lubricant-field="${fields[currentFieldIndex + 1]}"]`
						)
					: (addLubricantRow(),
						setTimeout(
							() =>
								navigate(
									`[data-lubricant-row="${rowIndex + 1}"][data-lubricant-field="description"]`
								),
							0
						))
		};

		if (actions[event.key]) {
			event.preventDefault();
			actions[event.key]();
		}
	};

	const handleDenomKeyDown = (event: KeyboardEvent, denomIndex: number) => {
		const actions: Record<string, () => void> = {
			ArrowDown: () =>
				denomIndex < denominations.length && navigate(`[data-denom="${denomIndex + 1}"]`),
			ArrowUp: () => denomIndex > 0 && navigate(`[data-denom="${denomIndex - 1}"]`),
			Enter: () => denomIndex < denominations.length && navigate(`[data-denom="${denomIndex + 1}"]`)
		};

		if (actions[event.key]) {
			event.preventDefault();
			actions[event.key]();
		}
	};

	// Message popup
	let message = $state('');
	let isError = $state(false);
	const showMessage = (msg: string, error: boolean) => {
		message = msg;
		isError = error;
		setTimeout(() => (message = ''), 3000);
	};

	// Save functionality
	let isSaving = $state(false);

	const handleSave = async () => {
		isSaving = true;

		try {
			const nullToZero = (v: any) => v ?? 0;
			const result = await fetch('/api/daily-sales', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date: salesDate,
					shift,
					cashier,
					rows: dailyRows.map((row) => ({
						...row,
						opening: nullToZero(row.opening),
						closing: nullToZero(row.closing),
						openingPeso: nullToZero(row.openingPeso),
						closingPeso: nullToZero(row.closingPeso)
					})),
					expenses: expenseRows.map((exp) => ({ ...exp, amount: nullToZero(exp.amount) })),
					lubricants: lubricantRows.map((lub) => ({
						productId: lub.productId,
						productName: lub.productName,
						quantity: nullToZero(lub.quantity),
						price: nullToZero(lub.price),
						amount: nullToZero(lub.amount)
					})),
					denominations: denominations.map((denom) => ({
						...denom,
						count: nullToZero(denom.count)
					})),
					coinsAmount: nullToZero(coinsAmount),
					checkPayment: nullToZero(checkPayment),
					bankTransfer: nullToZero(bankTransfer),
					totalSales,
					totalExpenses,
					totalLubricants,
					cashOnHand,
					actualCash,
					cashVariance
				})
			}).then((r) => r.json());

			if (result.success) {
				showMessage('Saved successfully!', false);

				// Copy closing values to opening for next shift
				const nextRows = dailyRows.map((row) => ({
					id: Date.now() + Math.random(),
					nozzle: row.nozzle,
					product: row.product,
					opening: row.closing,
					openingPeso: row.closingPeso,
					closing: 0,
					closingPeso: 0
				}));

				dailyRows = nextRows;
				expenseRows = [createExpenseRow()];
				lubricantRows = [createLubricantRow()];
				denominations = initialDenoms();
				coinsAmount = 0;
				checkPayment = 0;
				bankTransfer = 0;

				// Advance shift/date
				if (shift === 'Morning') shift = 'Afternoon';
				else {
					const d = new Date(salesDate);
					d.setDate(d.getDate() + 1);
					salesDate = d.toISOString().slice(0, 10);
					if (shift === 'Afternoon') shift = 'Morning';
				}
			} else showMessage('Error: ' + result.error, true);
		} catch (error) {
			showMessage(
				'Error saving data: ' + (error instanceof Error ? error.message : String(error)),
				true
			);
		} finally {
			isSaving = false;
		}
	};

	// Load functionality
	let isLoading = $state(false);

	const handleLoad = async () => {
		isLoading = true;

		try {
			const result = await fetch(`/api/daily-sales?date=${salesDate}&shift=${shift}`).then((r) =>
				r.json()
			);

			if (result.success && result.data) {
				const { data } = result;
				if (data.rows?.length) {
					dailyRows = data.rows.map((row: any) => ({
						id: Date.now() + Math.random(),
						nozzle: row.nozzle || '',
						product: row.product || '',
						opening: row.opening,
						closing: row.closing,
						openingPeso: row.openingPeso,
						closingPeso: row.closingPeso
					}));
					while (dailyRows.length < 8) dailyRows.push(createRow());
				}
				if (data.expenses?.length)
					expenseRows = data.expenses.map((exp: any) => ({
						id: Date.now() + Math.random(),
						description: exp.description || '',
						amount: exp.amount
					}));
				if (data.lubricants?.length)
					lubricantRows = data.lubricants.map((lub: any) => ({
						id: Date.now() + Math.random(),
						productId: lub.productId || '',
						productName: lub.productName || '',
						quantity: lub.quantity || 1,
						price: lub.price || 0,
						amount: lub.amount || 0
					}));
				data.denominations?.forEach((denom: any) => {
					const d = denominations.find((d) => d.value === denom.value);
					if (d) d.count = denom.count;
				});
				coinsAmount = data.coinsAmount || 0;
				checkPayment = data.checkPayment || 0;
				bankTransfer = data.bankTransfer || 0;
				cashier = data.cashier || '';
				showMessage('Data loaded successfully!', false);
			} else showMessage(result.error || 'No data found', true);
		} catch (error) {
			showMessage(
				'Error loading data: ' + (error instanceof Error ? error.message : String(error)),
				true
			);
		} finally {
			isLoading = false;
		}
	};

	// Row management
	const resetDailyRows = () => {
		dailyRows = Array.from({ length: 8 }, createRow);
		coinsAmount = 0;
		checkPayment = 0;
		bankTransfer = 0;
		showMessage('Cleared successfully!', false);
	};
	const addExpenseRow = () => (expenseRows = [...expenseRows, createExpenseRow()]);
	const removeExpenseRow = (id: number) =>
		expenseRows.length > 1 && (expenseRows = expenseRows.filter((row) => row.id !== id));
	const addLubricantRow = () => (lubricantRows = [...lubricantRows, createLubricantRow()]);
	const removeLubricantRow = (id: number) =>
		lubricantRows.length > 1 && (lubricantRows = lubricantRows.filter((row) => row.id !== id));

	// Calculations
	const safeSum = (value: number) =>
		Number.isFinite(value) && value !== null ? Math.max(value, 0) : 0;

	let totalVolume = $derived(
		dailyRows.reduce((sum, row) => sum + safeSum(row.closing - row.opening), 0)
	);
	let totalSales = $derived(
		dailyRows.reduce((sum, row) => sum + safeSum(row.closingPeso - row.openingPeso), 0)
	);
	let totalExpenses = $derived(expenseRows.reduce((sum, row) => sum + safeSum(row.amount), 0));
	let totalLubricants = $derived(lubricantRows.reduce((sum, row) => sum + safeSum(row.amount), 0));
	let cashOnHand = $derived(totalSales + totalLubricants - totalExpenses);
	let actualCash = $derived(
		denominations.reduce((sum, denom) => sum + denom.value * denom.count, 0) +
			coinsAmount +
			checkPayment +
			bankTransfer
	);
	let cashVariance = $derived(actualCash - cashOnHand);

	// Utilities
	const formatPeso = (amount: number) =>
		new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
	const formatNumber = (amount: number) =>
		new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
			amount
		);

	// Print handler
	const handlePrint = () => printDocument('print-layout');

	// CSS classes
	const cardClass = (isDark: boolean) =>
		`border rounded-lg p-4 ${isDark ? 'bg-[#2a2a2a] border-gray-800' : 'bg-white border-gray-300'}`;
	const headerClass = (isDark: boolean) =>
		`border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-400 bg-gray-100'}`;
	const textClass = (isDark: boolean) => (isDark ? 'text-gray-300' : 'text-gray-700');
	const btnClass = (isDark: boolean, color: 'green' | 'blue' | 'red' | 'gray') =>
		`border rounded-md transition-colors ${{ green: isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-600 border-gray-700 hover:bg-gray-700', blue: isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-gray-700 border-gray-800 hover:bg-gray-800', red: isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-900/20' : 'border-gray-500 text-gray-600 hover:bg-gray-50', gray: isDark ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-50' }[color]}`;
	
	// Theme helper classes
	const borderClass = (isDark: boolean) => isDark ? 'border-gray-700' : 'border-gray-300';
	const borderClass2 = (isDark: boolean) => isDark ? 'border-gray-600' : 'border-gray-400';
	const rowBorderClass = (isDark: boolean) => isDark ? 'border-gray-800' : 'border-gray-200';
	const thClass = (isDark: boolean) => isDark ? 'text-gray-200' : 'text-gray-700';
	const tdTextClass = (isDark: boolean) => isDark ? 'text-gray-300' : 'text-gray-900';
	const tdSubtleClass = (isDark: boolean) => isDark ? 'text-gray-400' : 'text-gray-600';
	const inputClass = (isDark: boolean) => `w-full text-center border rounded px-1 py-0.5 ${isDark ? 'border-gray-700 bg-[#1a1a1a] text-white' : 'border-gray-300 bg-white text-gray-900'}`;
	const inputWithPlaceholderClass = (isDark: boolean) => `w-full text-center border rounded px-1 py-0.5 ${isDark ? 'border-gray-700 bg-[#1a1a1a] text-white placeholder-gray-600' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'}`;
	const selectClass = (isDark: boolean) => `w-full text-center border rounded px-1 py-0.5 ${isDark ? 'border-gray-700 bg-[#1a1a1a] text-white' : 'border-gray-300 bg-white text-gray-900'}`;
	const cardBgClass = (isDark: boolean) => `border rounded p-1.5 ${isDark ? 'border-gray-700 bg-[#1a1a1a]' : 'border-gray-300 bg-gray-50'}`;
	const labelClass = (isDark: boolean) => `block text-[10px] font-semibold mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
	const denomInputClass = (isDark: boolean) => `w-full text-center text-xs font-semibold border rounded px-1 py-0.5 ${isDark ? 'border-gray-700 bg-[#2a2a2a] text-white' : 'border-gray-300 bg-white text-gray-900'}`;
	const denomTextClass = (isDark: boolean) => `text-[10px] mt-0.5 text-center font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
	const totalBoxClass = (isDark: boolean) => `mt-2 border-2 rounded p-2 ${isDark ? 'border-gray-600 bg-[#1a1a1a]' : 'border-gray-500 bg-gray-50'}`;
	const summaryTitleClass = (isDark: boolean) => isDark ? 'text-white' : 'text-gray-900';
	const summaryTextClass = (isDark: boolean) => isDark ? 'text-gray-300' : 'text-gray-700';
</script>

<div id="page-content">
	<Card.Root class="mb-4">
		<Card.Header class="">
			<Card.Title class="text-lg">DAILY SALES INFORMATION</Card.Title>
		</Card.Header>
		<Card.Content class="">
			<div class="form-controls">
				<div class="form-field">
					<Label class="" for="date">DATE</Label>
					<Popover.Root>
						<Popover.Trigger class="w-full">
							<Button
								variant="outline"
								class="w-full justify-start text-left font-normal"
							>
								📅 {calendarValue ? df.format(calendarValue.toDate(getLocalTimeZone())) : 'Pick a date'}
							</Button>
						</Popover.Trigger>
						<Popover.Content class="w-auto p-0" portalProps={null}>
							<Calendar bind:value={calendarValue} class="" />
						</Popover.Content>
					</Popover.Root>
				</div>

				<div class="form-field">
					<Label class="" for="shift">SHIFT</Label>
					<select
						id="shift"
						bind:value={shift}
						class="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="Morning">MORNING</option>
						<option value="Afternoon">AFTERNOON</option>
						<option value="Whole Day">WHOLE DAY</option>
					</select>
				</div>

				<div class="form-field">
					<Label class="" for="cashier">CASHIER</Label>
					<Input
						class="uppercase"
						id="cashier"
						type="text"
						bind:value={cashier}
						placeholder="NAME"
					/>
				</div>
			</div>

			<div class="action-buttons mt-4">
				<Button class="" variant="outline" disabled={false} onclick={resetDailyRows}>
					CLEAR ALL
				</Button>
				<Button
					class=""
					variant="outline"
					disabled={isLoading}
					onclick={handleLoad}
				>
					{isLoading ? 'LOADING...' : 'LOAD'}
				</Button>
				<Button
					class=""
					variant="outline"
					disabled={isSaving}
					onclick={handleSave}
				>
					{isSaving ? 'SAVING...' : 'SAVE'}
				</Button>
				<Button class="" variant="outline" disabled={false} onclick={handlePrint}>
					🖨️ PRINT
				</Button>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="relative">
		<Card.Header class="">
			<Card.Title class="text-base">DAILY SALES ENTRY</Card.Title>
		</Card.Header>
		<Card.Content class="">
			<!-- Popup Message -->
			{#if message}
				<div class="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
					<div
						class="px-4 py-2.5 rounded-md shadow-xl {isError
							? isDark
								? 'bg-gray-800 text-gray-300 border border-gray-600'
								: 'bg-white text-gray-700 border border-gray-400'
							: isDark
								? 'bg-gray-800 text-white border border-gray-500'
								: 'bg-white text-gray-900 border border-gray-600'} animate-fade-in backdrop-blur-sm"
					>
						<p class="text-sm font-medium">{message}</p>
					</div>
				</div>
			{/if}

		<div class="overflow-x-auto">
			<Table.Root class="">
				<Table.Header class="">
					<Table.Row class="">
						<Table.Head class="text-center">NOZZLE</Table.Head>
						<Table.Head class="text-center">PRODUCT</Table.Head>
						<Table.Head class="text-center">OPENING (L)</Table.Head>
						<Table.Head class="text-center">CLOSING (L)</Table.Head>
						<Table.Head class="text-center">VOLUME</Table.Head>
						<Table.Head class="text-center">OPENING (₱)</Table.Head>
						<Table.Head class="text-center">CLOSING (₱)</Table.Head>
						<Table.Head class="text-center">SALES</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body class="">
					{#each dailyRows as row, index (row.id)}
						{@const volume = row.closing - row.opening}
						{@const sales = row.closingPeso - row.openingPeso}
						<Table.Row class="">
							<Table.Cell class="text-center">
								<input
									type="text"
									bind:value={row.nozzle}
									data-row={index}
									data-field="nozzle"
									onkeydown={(e) => handleKeyDown(e, index, 'nozzle')}
									class="max-w-16 {inputWithPlaceholderClass(isDark)}"
									placeholder="N1"
								/>
							</Table.Cell>
							<Table.Cell class="text-center">
								<select
									bind:value={row.product}
									data-row={index}
									data-field="product"
									onkeydown={(e) => handleKeyDown(e, index, 'product')}
									class="max-w-28 {selectClass(isDark)}"
								>
									<option value="Diesel">DIESEL</option>
									<option value="Regular">REGULAR</option>
									<option value="Premium">PREMIUM</option>
								</select>
							</Table.Cell>
							<Table.Cell class="text-center">
								<input
									type="number"
									value={row.opening || ''}
									oninput={(e) => row.opening = parseFloat(e.currentTarget.value) || 0}
									data-row={index}
									data-field="opening"
									onkeydown={(e) => handleKeyDown(e, index, 'opening')}
									class={inputClass(isDark)}
									step="0.01"
									placeholder="-"
								/>
							</Table.Cell>
							<Table.Cell class="text-center">
								<input
									type="number"
									value={row.closing || ''}
									oninput={(e) => row.closing = parseFloat(e.currentTarget.value) || 0}
									data-row={index}
									data-field="closing"
									onkeydown={(e) => handleKeyDown(e, index, 'closing')}
									class={inputClass(isDark)}
									step="0.01"
									placeholder="-"
								/>
							</Table.Cell>
							<Table.Cell class="text-center {tdTextClass(isDark)}">
								{Number.isFinite(volume) && volume !== 0 ? volume.toFixed(2) : '-'}
							</Table.Cell>
							<Table.Cell class="text-center">
								<input
									type="number"
									value={row.openingPeso || ''}
									oninput={(e) => row.openingPeso = parseFloat(e.currentTarget.value) || 0}
									data-row={index}
									data-field="openingPeso"
									onkeydown={(e) => handleKeyDown(e, index, 'openingPeso')}
									class={inputClass(isDark)}
									step="0.01"
									placeholder="-"
								/>
							</Table.Cell>
							<Table.Cell class="text-center">
								<input
									type="number"
									value={row.closingPeso || ''}
									oninput={(e) => row.closingPeso = parseFloat(e.currentTarget.value) || 0}
									data-row={index}
									data-field="closingPeso"
									onkeydown={(e) => handleKeyDown(e, index, 'closingPeso')}
									class={inputClass(isDark)}
									step="0.01"
									placeholder="-"
								/>
							</Table.Cell>
							<Table.Cell class="text-center {tdTextClass(isDark)}">
								{Number.isFinite(sales) && sales !== 0 ? formatPeso(sales) : '-'}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
				<Table.Footer class="">
					<Table.Row class="">
						<Table.Cell
							colspan={4}
							class="text-right font-semibold"
						>
							TOTAL
						</Table.Cell>
						<Table.Cell
							class="text-right font-semibold"
						>
							{totalVolume === 0 ? '-' : totalVolume.toFixed(2)}
						</Table.Cell>
						<Table.Cell colspan={2} class="">{''}</Table.Cell>
						<Table.Cell
							class="text-right font-semibold"
						>
							{totalSales === 0 ? '-' : formatPeso(totalSales)}
						</Table.Cell>
					</Table.Row>
				</Table.Footer>
			</Table.Root>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Two Column Layout: Left (Expenses + Cash Count) | Right (Summary) -->
	<div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Left Column: Expenses and Cash Count -->
		<div class="flex flex-col space-y-6 h-full">
			<!-- Lubricants Section -->
			<Card.Root class="shrink-0">
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-3">
					<Card.Title class="text-base">OTHER SALES (LUBRICANTS)</Card.Title>
					<Button
						class=""
						disabled={false}
						onclick={addLubricantRow}
						size="sm"
						variant="outline"
					>
						ADD
					</Button>
				</Card.Header>
				<Card.Content class="">

				<div class="overflow-x-auto">
					<Table.Root class="">
						<Table.Header class="">
							<Table.Row class="">
								<Table.Head class="text-center">#</Table.Head>
								<Table.Head class="text-center">PRODUCT</Table.Head>
								<Table.Head class="text-center">QTY</Table.Head>
								<Table.Head class="text-center">PRICE</Table.Head>
								<Table.Head class="text-center">AMOUNT</Table.Head>
								<Table.Head class="text-center">DEL</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body class="">
							{#each lubricantRows as row, index (row.id)}
								<Table.Row class="">
									<Table.Cell class="text-center {isDark ? 'text-gray-300' : 'text-gray-900'}"
										>{index + 1}</Table.Cell
									>
									<Table.Cell class="">
										<select
											bind:value={row.productId}
											onchange={(e) => {
												const product = lubricantProducts.find(
													(p) => p.id === e.currentTarget.value
												);
												if (product) {
													row.productName = product.name;
													row.price = product.price;
													row.amount = row.quantity * product.price;
												}
											}}
											class="w-full text-center border rounded px-1 py-0.5 {isDark
												? 'border-gray-700 bg-[#1a1a1a] text-white'
												: 'border-gray-300 bg-white text-gray-900'}"
										>
											<option value="">SELECT PRODUCT...</option>
											{#each lubricantProducts as product}
												<option value={product.id}>{product.name}</option>
											{/each}
										</select>
									</Table.Cell>
									<Table.Cell class="">
										<input
											type="number"
											value={row.quantity || ''}
											oninput={(e) => {
												row.quantity = parseFloat(e.currentTarget.value) || 0;
												row.amount = row.quantity * row.price;
											}}
											class="w-full text-center border rounded px-1 py-0.5 {isDark
												? 'border-gray-700 bg-[#1a1a1a] text-white'
												: 'border-gray-300 bg-white text-gray-900'}"
											min="1"
											placeholder="-"
										/>
									</Table.Cell>
									<Table.Cell class="text-center {isDark ? 'text-gray-400' : 'text-gray-600'}">
										{row.price > 0 ? formatPeso(row.price) : '-'}
									</Table.Cell>
									<Table.Cell
										class="text-center font-semibold {isDark
											? 'text-gray-300'
											: 'text-gray-900'}"
									>
										{row.amount > 0 ? formatPeso(row.amount) : '-'}
									</Table.Cell>
									<Table.Cell class="text-center">
										<button
											onclick={() => removeLubricantRow(row.id)}
											class="px-1 py-0.5 text-xs {btnClass(isDark, 'red')}"
										>
											X
										</button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
						<Table.Footer class="">
							<Table.Row class="">
								<Table.Cell
									colspan={4}
									class="text-right font-semibold"
								>
									TOTAL
								</Table.Cell>
								<Table.Cell
									class="text-center font-semibold"
								>
									{totalLubricants === 0 ? '-' : formatPeso(totalLubricants)}
								</Table.Cell>
								<Table.Cell class="">{''}</Table.Cell>
							</Table.Row>
						</Table.Footer>
					</Table.Root>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Expenses Section -->
			<Card.Root class="shrink-0">
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-3">
					<Card.Title class="text-base">EXPENSES</Card.Title>
					<Button
						class=""
						disabled={false}
						onclick={addExpenseRow}
						size="sm"
						variant="outline"
					>
						ADD
					</Button>
				</Card.Header>
				<Card.Content class="">

				<div class="overflow-x-auto">
					<Table.Root class="">
						<Table.Header class="">
							<Table.Row class="">
								<Table.Head class="text-center">#</Table.Head>
								<Table.Head class="text-center">DESCRIPTION</Table.Head>
								<Table.Head class="text-center">AMOUNT</Table.Head>
								<Table.Head class="text-center">DEL</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body class="">
							{#each expenseRows as row, index (row.id)}
								<Table.Row class="">
									<Table.Cell class="text-center {isDark ? 'text-gray-300' : 'text-gray-900'}"
										>{index + 1}</Table.Cell
									>
									<Table.Cell class="">
										<input
											type="text"
											bind:value={row.description}
											data-expense-row={index}
											data-expense-field="description"
											onkeydown={(e) => handleExpenseKeyDown(e, index, 'description')}
											class="w-full text-center border rounded px-1 py-0.5 {isDark
												? 'border-gray-700 bg-[#1a1a1a] text-white placeholder-gray-600'
												: 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'}"
											placeholder="DESCRIPTION"
										/>
									</Table.Cell>
									<Table.Cell class="">
										<input
											type="number"
											value={row.amount || ''}
											oninput={(e) => row.amount = parseFloat(e.currentTarget.value) || 0}
											data-expense-row={index}
											data-expense-field="amount"
											onkeydown={(e) => handleExpenseKeyDown(e, index, 'amount')}
											class="w-full text-center border rounded px-1 py-0.5 {isDark
												? 'border-gray-700 bg-[#1a1a1a] text-white'
												: 'border-gray-300 bg-white text-gray-900'}"
											step="0.01"
											min="0"
											placeholder="-"
										/>
									</Table.Cell>
									<Table.Cell class="text-center">
										<button
											onclick={() => removeExpenseRow(row.id)}
											class="px-1 py-0.5 text-xs {btnClass(isDark, 'red')}"
										>
											X
										</button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
						<Table.Footer class="">
							<Table.Row class="">
								<Table.Cell
									colspan={2}
									class="text-right font-semibold"
								>
									TOTAL
								</Table.Cell>
								<Table.Cell
									class="text-center font-semibold"
								>
									{totalExpenses === 0 ? '-' : formatPeso(totalExpenses)}
								</Table.Cell>
								<Table.Cell class="">{''}</Table.Cell>
							</Table.Row>
						</Table.Footer>
					</Table.Root>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Cash Denomination Section -->
			<Card.Root class="flex flex-col">
				<Card.Header class="">
					<Card.Title class="text-sm">ACTUAL CASH COUNT</Card.Title>
				</Card.Header>
				<Card.Content class="">
				<div class="grid grid-cols-3 gap-2 flex-1 content-start">
					{#each denominations as denom, index}
						<div
							class="border rounded p-1.5 {isDark
								? 'border-gray-700 bg-[#1a1a1a]'
								: 'border-gray-300 bg-gray-50'}"
						>
							<label
								for="denom-{index}"
								class="block text-[10px] font-semibold mb-0.5 {isDark
									? 'text-gray-300'
									: 'text-gray-700'}"
							>
								{denom.label}
							</label>
							<input
								id="denom-{index}"
								type="number"
								value={denom.count || ''}
								oninput={(e) => denom.count = parseInt(e.currentTarget.value) || 0}
								data-denom={index}
								onkeydown={(e) => handleDenomKeyDown(e, index)}
								min="0"
								class="w-full text-center text-xs font-semibold border rounded px-1 py-0.5 {isDark
									? 'border-gray-700 bg-[#2a2a2a] text-white'
									: 'border-gray-300 bg-white text-gray-900'}"
								placeholder="-"
							/>
							<div
								class="text-[10px] mt-0.5 text-center font-semibold {isDark
									? 'text-gray-400'
									: 'text-gray-600'}"
							>
								= {denom.value * denom.count === 0 ? '-' : formatPeso(denom.value * denom.count)}
							</div>
						</div>
					{/each}
					<!-- Coins -->
					<div
						class="border rounded p-1.5 {isDark
							? 'border-gray-700 bg-[#1a1a1a]'
							: 'border-gray-300 bg-gray-50'}"
					>
						<label
							for="coins-amount"
							class="block text-[10px] font-semibold mb-0.5 {isDark
								? 'text-gray-300'
								: 'text-gray-700'}"
						>
							Coins
						</label>
						<input
							id="coins-amount"
							type="number"
							value={coinsAmount || ''}
							oninput={(e) => coinsAmount = parseFloat(e.currentTarget.value) || 0}
							data-denom={denominations.length}
							onkeydown={(e) => handleDenomKeyDown(e, denominations.length)}
							min="0"
							step="0.01"
							class="w-full text-center text-xs font-semibold border rounded px-1 py-0.5 {isDark
								? 'border-gray-700 bg-[#2a2a2a] text-white'
								: 'border-gray-300 bg-white text-gray-900'}"
							placeholder="-"
						/>
						<div
							class="text-[10px] mt-0.5 text-center font-semibold {isDark
								? 'text-gray-400'
								: 'text-gray-600'}"
						>
							= {coinsAmount === 0 ? '-' : formatPeso(coinsAmount)}
						</div>
					</div>

					<!-- Check Payment -->
					<div
						class="border rounded p-1.5 {isDark
							? 'border-gray-700 bg-[#1a1a1a]'
							: 'border-gray-300 bg-gray-50'}"
					>
						<label
							for="check-payment"
							class="block text-[10px] font-semibold mb-0.5 {isDark
								? 'text-gray-300'
								: 'text-gray-700'}"
						>
							Check Payment
						</label>
						<input
							id="check-payment"
							type="number"
							value={checkPayment || ''}
							oninput={(e) => checkPayment = parseFloat(e.currentTarget.value) || 0}
							min="0"
							step="0.01"
							class="w-full text-center text-xs font-semibold border rounded px-1 py-0.5 {isDark
								? 'border-gray-700 bg-[#2a2a2a] text-white'
								: 'border-gray-300 bg-white text-gray-900'}"
							placeholder="-"
						/>
						<div
							class="text-[10px] mt-0.5 text-center font-semibold {isDark
								? 'text-gray-400'
								: 'text-gray-600'}"
						>
							= {checkPayment === 0 ? '-' : formatPeso(checkPayment)}
						</div>
					</div>

					<!-- Bank Transfer -->
					<div
						class="border rounded p-1.5 {isDark
							? 'border-gray-700 bg-[#1a1a1a]'
							: 'border-gray-300 bg-gray-50'}"
					>
						<label
							for="bank-transfer"
							class="block text-[10px] font-semibold mb-0.5 {isDark
								? 'text-gray-300'
								: 'text-gray-700'}"
						>
							Bank Transfer
						</label>
						<input
							id="bank-transfer"
							type="number"
							value={bankTransfer || ''}
							oninput={(e) => bankTransfer = parseFloat(e.currentTarget.value) || 0}
							min="0"
							step="0.01"
							class="w-full text-center text-xs font-semibold border rounded px-1 py-0.5 {isDark
								? 'border-gray-700 bg-[#2a2a2a] text-white'
								: 'border-gray-300 bg-white text-gray-900'}"
							placeholder="-"
						/>
						<div
							class="text-[10px] mt-0.5 text-center font-semibold {isDark
								? 'text-gray-400'
								: 'text-gray-600'}"
						>
							= {bankTransfer === 0 ? '-' : formatPeso(bankTransfer)}
						</div>
					</div>
				</div>

				<!-- Total Box - Full Width Row -->
				<div
					class="mt-2 border-2 rounded p-2 {isDark
						? 'border-gray-600 bg-[#1a1a1a]'
						: 'border-gray-500 bg-gray-50'}"
				>
					<div
						class="block text-xs font-semibold mb-1 text-center {isDark
							? 'text-gray-400'
							: 'text-gray-700'}"
					>
						TOTAL CASH COUNT
					</div>
					<div
						class="w-full text-center text-lg font-bold py-1 {isDark
							? 'text-white'
							: 'text-gray-900'}"
					>
						{actualCash === 0 ? '-' : formatPeso(actualCash)}
					</div>
				</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Right Column: Summary -->
		<Card.Root class="flex flex-col">
			<Card.Header class="">
				<Card.Title class="">SUMMARY</Card.Title>
			</Card.Header>
			<Card.Content class="">
			<div class="space-y-4 text-lg flex-1 flex flex-col justify-between">
				<div
					class="flex justify-between items-center py-2 border-b {borderClass(isDark)}"
				>
					<span class={textClass(isDark)}>TOTAL SALES:</span>
					<span class="font-semibold {isDark ? 'text-white' : 'text-gray-900'}"
						>{totalSales === 0 ? '-' : formatPeso(totalSales)}</span
					>
				</div>
				<div
					class="flex justify-between items-center py-2 border-b {borderClass(isDark)}"
				>
					<span class={textClass(isDark)}>TOTAL LUBRICANTS:</span>
					<span class="font-semibold {isDark ? 'text-gray-300' : 'text-gray-700'}"
						>{totalLubricants === 0 ? '-' : '+ ' + formatPeso(totalLubricants)}</span
					>
				</div>
				<div
					class="flex justify-between items-center py-2 border-b {borderClass(isDark)}"
				>
					<span class={textClass(isDark)}>TOTAL EXPENSES:</span>
					<span class="font-semibold {isDark ? 'text-gray-400' : 'text-gray-600'}"
						>{totalExpenses === 0 ? '-' : '- ' + formatPeso(totalExpenses)}</span
					>
				</div>
				<div
					class="flex justify-between items-center py-2 border-b {borderClass(isDark)}"
				>
					<span class="font-bold {summaryTitleClass(isDark)}"
						>EXPECTED CASH ON HAND:</span
					>
					<span
						class="font-bold text-base {cashOnHand >= 0
							? isDark
								? 'text-gray-300'
								: 'text-gray-700'
							: isDark
								? 'text-gray-500'
								: 'text-gray-600'}"
					>
						{cashOnHand === 0 ? '-' : formatPeso(cashOnHand)}
					</span>
				</div>
				<div
					class="flex justify-between items-center py-2 border-b {borderClass(isDark)}"
				>
					<span class="font-bold {summaryTitleClass(isDark)}">ACTUAL CASH COUNT:</span
					>
					<span class="font-bold text-base {isDark ? 'text-gray-300' : 'text-gray-700'}">
						{actualCash === 0 ? '-' : formatPeso(actualCash)}
					</span>
				</div>
				<div class="flex justify-between items-center py-2 border-b {borderClass(isDark)}">
					<span class="font-bold {summaryTitleClass(isDark)}">
						{cashVariance === 0 ? 'EXACT' : cashVariance > 0 ? 'OVER' : 'SHORT'}:
					</span>
					<span
						class="font-bold text-base {cashVariance === 0
							? isDark
								? 'text-gray-400'
								: 'text-gray-600'
							: cashVariance > 0
								? isDark
									? 'text-gray-300'
									: 'text-gray-700'
								: isDark
									? 'text-gray-500'
									: 'text-gray-600'}"
					>
						{cashVariance === 0 ? '-' : formatPeso(Math.abs(cashVariance))}
					</span>
				</div>

				<!-- Received By Section -->
				<div class="mt-8 space-y-5">
					<div class="font-bold text-lg {summaryTitleClass(isDark)}">
						RECEIVED BY:
					</div>
					<div class="space-y-6">
						<div>
							<div class="text-sm mb-2 {summaryTextClass(isDark)}">
								Name:
							</div>
							<div class="border-b-2 h-12 {borderClass2(isDark)}"></div>
						</div>
						<div>
							<div class="text-sm mb-2 {summaryTextClass(isDark)}">
								Actual Cash Received:
							</div>
							<div class="border-b-2 h-12 {borderClass2(isDark)}"></div>
						</div>
						<div>
							<div class="text-sm mb-2 {summaryTextClass(isDark)}">
								Signature:
							</div>
							<div class="border-b-2 h-16 {borderClass2(isDark)}"></div>
						</div>
					</div>
				</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- Print Layout Component -->
<DailySalesPrint
	{salesDate}
	{shift}
	{cashier}
	{dailyRows}
	{denominations}
	{coinsAmount}
	{checkPayment}
	{bankTransfer}
	{totalSales}
	{totalLubricants}
	{totalExpenses}
	{cashOnHand}
	{actualCash}
	{cashVariance}
/>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	.animate-fade-in {
		animation: fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}
</style>
