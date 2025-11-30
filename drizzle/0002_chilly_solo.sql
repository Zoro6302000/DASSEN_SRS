CREATE INDEX `daily_sales_date_shift_idx` ON `daily_sales` (`date`,`shift`);--> statement-breakpoint
CREATE INDEX `denominations_daily_sales_id_idx` ON `denominations` (`daily_sales_id`);--> statement-breakpoint
CREATE INDEX `expenses_daily_sales_id_idx` ON `expenses` (`daily_sales_id`);--> statement-breakpoint
CREATE INDEX `lubricants_daily_sales_id_idx` ON `lubricants` (`daily_sales_id`);--> statement-breakpoint
CREATE INDEX `sales_rows_daily_sales_id_idx` ON `sales_rows` (`daily_sales_id`);