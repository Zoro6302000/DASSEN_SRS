import { integer, sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	age: integer('age')
});

export const dailySales = sqliteTable('daily_sales', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	date: text('date').notNull(),
	shift: text('shift').notNull(),
	cashier: text('cashier'),
	totalSales: real('total_sales').notNull(),
	totalExpenses: real('total_expenses').notNull(),
	cashOnHand: real('cash_on_hand').notNull(),
	actualCash: real('actual_cash').notNull(),
	cashVariance: real('cash_variance').notNull(),
	coinsAmount: real('coins_amount').notNull().default(0),
	checkPayment: real('check_payment').notNull().default(0),
	bankTransfer: real('bank_transfer').notNull().default(0),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, (table) => ({
	dateShiftIdx: index('daily_sales_date_shift_idx').on(table.date, table.shift)
}));

export const salesRows = sqliteTable('sales_rows', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	dailySalesId: text('daily_sales_id').notNull().references(() => dailySales.id, { onDelete: 'cascade' }),
	nozzle: text('nozzle').notNull(),
	product: text('product').notNull(),
	opening: real('opening').notNull().default(0),
	closing: real('closing').notNull().default(0),
	openingPeso: real('opening_peso').notNull().default(0),
	closingPeso: real('closing_peso').notNull().default(0)
}, (table) => ({
	dailySalesIdIdx: index('sales_rows_daily_sales_id_idx').on(table.dailySalesId)
}));

export const expenses = sqliteTable('expenses', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	dailySalesId: text('daily_sales_id').notNull().references(() => dailySales.id, { onDelete: 'cascade' }),
	description: text('description').notNull(),
	amount: real('amount').notNull().default(0)
}, (table) => ({
	dailySalesIdIdx: index('expenses_daily_sales_id_idx').on(table.dailySalesId)
}));

export const denominations = sqliteTable('denominations', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	dailySalesId: text('daily_sales_id').notNull().references(() => dailySales.id, { onDelete: 'cascade' }),
	value: real('value').notNull(),
	label: text('label').notNull(),
	count: integer('count').notNull().default(0)
}, (table) => ({
	dailySalesIdIdx: index('denominations_daily_sales_id_idx').on(table.dailySalesId)
}));

export const lubricantProducts = sqliteTable('lubricant_products', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	price: real('price').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const lubricants = sqliteTable('lubricants', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	dailySalesId: text('daily_sales_id').notNull().references(() => dailySales.id, { onDelete: 'cascade' }),
	productId: text('product_id').references(() => lubricantProducts.id),
	productName: text('product_name').notNull(),
	quantity: integer('quantity').notNull().default(1),
	price: real('price').notNull(),
	amount: real('amount').notNull().default(0)
}, (table) => ({
	dailySalesIdIdx: index('lubricants_daily_sales_id_idx').on(table.dailySalesId)
}));
