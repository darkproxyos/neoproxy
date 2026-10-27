CREATE TABLE `agent_diary_entries` (
	`agent_id` text NOT NULL,
	`date_key` text NOT NULL,
	`entry` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`agent_id`, `date_key`)
);
--> statement-breakpoint
CREATE TABLE `fabrication_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`mode` text NOT NULL,
	`label` text,
	`params` text NOT NULL,
	`thumbnail` text NOT NULL,
	`week_of` text NOT NULL,
	`status` text DEFAULT 'voting' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fabrication_votes` (
	`submission_id` text NOT NULL,
	`visitor_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`submission_id`, `visitor_id`),
	FOREIGN KEY (`submission_id`) REFERENCES `fabrication_submissions`(`id`) ON UPDATE no action ON DELETE no action
);
