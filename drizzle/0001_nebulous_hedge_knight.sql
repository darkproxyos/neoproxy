CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`priority` text NOT NULL,
	`source` text NOT NULL,
	`payload` text NOT NULL,
	`processed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
