import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { dailySales, salesRows, expenses, denominations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET({ url }) {
	try {
		const date = url.searchParams.get('date');
		const shift = url.searchParams.get('shift');

		if (!date || !shift) {
			return json({ success: false, error: 'Date and shift are required' }, { status: 400 });
		}

		// Get main daily sales record
		const [dailySalesRecord] = await db
			.select()
			.from(dailySales)
			.where(and(eq(dailySales.date, date), eq(dailySales.shift, shift)))
			.limit(1);

		if (!dailySalesRecord) {
			return json({ success: false, error: 'No data found for this date and shift' }, { status: 404 });
		}

		// Get related data
		const [rows, expensesData, denomsData] = await Promise.all([
			db.select().from(salesRows).where(eq(salesRows.dailySalesId, dailySalesRecord.id)),
			db.select().from(expenses).where(eq(expenses.dailySalesId, dailySalesRecord.id)),
			db.select().from(denominations).where(eq(denominations.dailySalesId, dailySalesRecord.id))
		]);

		return json({
			success: true,
			data: {
				...dailySalesRecord,
				rows,
				expenses: expensesData,
				denominations: denomsData
			}
		});
	} catch (error) {
		console.error('Error loading daily sales:', error);
		const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
		return json({ success: false, error: errorMessage }, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		const data = await request.json();

		// Use a transaction for atomic operations
		const result = await db.transaction(async (tx) => {
			// Check if record already exists for this date and shift
			const [existingRecord] = await tx
				.select()
				.from(dailySales)
				.where(and(eq(dailySales.date, data.date), eq(dailySales.shift, data.shift)))
				.limit(1);

			let dailySalesRecord;

			if (existingRecord) {
				// Update existing record
				dailySalesRecord = existingRecord;
				
				// Delete and update in parallel batches
				await Promise.all([
					tx.delete(salesRows).where(eq(salesRows.dailySalesId, existingRecord.id)),
					tx.delete(expenses).where(eq(expenses.dailySalesId, existingRecord.id)),
					tx.delete(denominations).where(eq(denominations.dailySalesId, existingRecord.id)),
					tx.update(dailySales)
						.set({
							cashier: data.cashier,
							totalSales: data.totalSales,
							totalExpenses: data.totalExpenses,
							cashOnHand: data.cashOnHand,
							actualCash: data.actualCash,
							cashVariance: data.cashVariance,
							coinsAmount: data.coinsAmount,
							checkPayment: data.checkPayment || 0,
							bankTransfer: data.bankTransfer || 0
						})
						.where(eq(dailySales.id, existingRecord.id))
				]);
			} else {
				// Insert new record
				[dailySalesRecord] = await tx
					.insert(dailySales)
					.values({
						date: data.date || new Date().toISOString().split('T')[0],
						shift: data.shift || 'Morning',
						cashier: data.cashier,
						totalSales: data.totalSales,
						totalExpenses: data.totalExpenses,
						cashOnHand: data.cashOnHand,
						actualCash: data.actualCash,
						cashVariance: data.cashVariance,
						coinsAmount: data.coinsAmount,
						checkPayment: data.checkPayment || 0,
						bankTransfer: data.bankTransfer || 0
					})
					.returning();
			}

			// Insert all related data in parallel
			const insertPromises = [];

			if (data.rows && data.rows.length > 0) {
				const rowsToInsert = data.rows.map((/** @type {any} */ row) => ({
					dailySalesId: dailySalesRecord.id,
					nozzle: row.nozzle,
					product: row.product,
					opening: row.opening,
					closing: row.closing,
					openingPeso: row.openingPeso,
					closingPeso: row.closingPeso
				}));
				insertPromises.push(tx.insert(salesRows).values(rowsToInsert));
			}

			if (data.expenses && data.expenses.length > 0) {
				const expensesToInsert = data.expenses.map((/** @type {any} */ expense) => ({
					dailySalesId: dailySalesRecord.id,
					description: expense.description,
					amount: expense.amount
				}));
				insertPromises.push(tx.insert(expenses).values(expensesToInsert));
			}

			if (data.denominations && data.denominations.length > 0) {
				const denomsToInsert = data.denominations.map((/** @type {any} */ denom) => ({
					dailySalesId: dailySalesRecord.id,
					value: denom.value,
					label: denom.label,
					count: denom.count
				}));
				insertPromises.push(tx.insert(denominations).values(denomsToInsert));
			}

			if (insertPromises.length > 0) {
				await Promise.all(insertPromises);
			}

			return dailySalesRecord.id;
		});

		return json({ success: true, id: result });
	} catch (error) {
		console.error('Error saving daily sales:', error);
		const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
		return json({ success: false, error: errorMessage }, { status: 500 });
	}
}
