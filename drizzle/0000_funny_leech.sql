CREATE TABLE `daily_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`shift` text NOT NULL,
	`cashier` text,
	`total_sales` real NOT NULL,
	`total_expenses` real NOT NULL,
	`cash_on_hand` real NOT NULL,
	`actual_cash` real NOT NULL,
	`cash_variance` real NOT NULL,
	`coins_amount` real DEFAULT 0 NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `denominations` (
	`id` text PRIMARY KEY NOT NULL,
	`daily_sales_id` text NOT NULL,
	`value` real NOT NULL,
	`label` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`daily_sales_id`) REFERENCES `daily_sales`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`daily_sales_id` text NOT NULL,
	`description` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`daily_sales_id`) REFERENCES `daily_sales`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lubricant_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price` real NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `lubricants` (
	`id` text PRIMARY KEY NOT NULL,
	`daily_sales_id` text NOT NULL,
	`product_id` text,
	`product_name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`price` real NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`daily_sales_id`) REFERENCES `daily_sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `lubricant_products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_rows` (
	`id` text PRIMARY KEY NOT NULL,
	`daily_sales_id` text NOT NULL,
	`nozzle` text NOT NULL,
	`product` text NOT NULL,
	`opening` real DEFAULT 0 NOT NULL,
	`closing` real DEFAULT 0 NOT NULL,
	`opening_peso` real DEFAULT 0 NOT NULL,
	`closing_peso` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`daily_sales_id`) REFERENCES `daily_sales`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`age` integer
);
