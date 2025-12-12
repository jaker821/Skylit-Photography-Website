# QuickBooks Migration Instructions

## Migration Order

To set up the QuickBooks system, run these migrations in order:

### Step 1: Create Sessions Table
Run `migrations/create_sessions_table.sql`
- Creates the `sessions` table
- Creates the `invoices` table if it doesn't exist
- Sets up indexes and triggers

### Step 2: Add session_id to Invoices
Run `migrations/add_session_id_to_invoices.sql`
- Adds `session_id` column to existing `invoices` table
- Adds other missing columns (client_name, client_email, etc.)
- Creates foreign key relationship between invoices and sessions

## Quick Setup (All at Once)

If you want to run everything at once, you can combine both migrations:

1. Open your Supabase SQL Editor
2. Copy and paste the contents of `create_sessions_table.sql`
3. Then copy and paste the contents of `add_session_id_to_invoices.sql`
4. Run the combined SQL

## Troubleshooting

### Error: "column session_id does not exist"
This means you need to run `add_session_id_to_invoices.sql` migration.

### Error: "relation sessions does not exist"
This means you need to run `create_sessions_table.sql` first.

### Error: "relation invoices does not exist"
The migration will create the invoices table if it doesn't exist. If you get this error, check that you have proper permissions.

## Verification

After running the migrations, verify the setup:

```sql
-- Check sessions table exists
SELECT * FROM sessions LIMIT 1;

-- Check invoices table has session_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' AND column_name = 'session_id';

-- Check foreign keys
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'sessions' OR tc.table_name = 'invoices');
```

