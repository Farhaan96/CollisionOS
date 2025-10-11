-- DIAGNOSTIC SCRIPT: Find the source of "plate" column error
-- Run this to identify what's referencing the non-existent "plate" column

-- =====================================================
-- STEP 1: Check for any references to "plate" column
-- =====================================================

-- Find all indexes that might reference "plate"
SELECT 
    'INDEX' as object_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (indexdef ILIKE '%plate%' OR indexname ILIKE '%plate%')
ORDER BY tablename, indexname;

-- Find all constraints that might reference "plate"
SELECT 
    'CONSTRAINT' as object_type,
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND cc.check_clause ILIKE '%plate%'
ORDER BY tc.table_name, tc.constraint_name;

-- Find all functions that might reference "plate"
SELECT 
    'FUNCTION' as object_type,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) ILIKE '%plate%'
ORDER BY p.proname;

-- Find all views that might reference "plate"
SELECT 
    'VIEW' as object_type,
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public'
AND definition ILIKE '%plate%'
ORDER BY viewname;

-- =====================================================
-- STEP 2: Check what tables actually exist
-- =====================================================

-- List all tables in public schema
SELECT 
    'TABLE' as object_type,
    schemaname,
    tablename,
    'Table exists' as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- STEP 3: Check for vehicles table specifically
-- =====================================================

-- Check if vehicles table exists and what columns it has
DO $$
DECLARE
    table_exists BOOLEAN;
    column_list TEXT;
BEGIN
    -- Check if vehicles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vehicles'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'vehicles table EXISTS';
        
        -- Get column list
        SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
        INTO column_list
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vehicles';
        
        RAISE NOTICE 'vehicles table columns: %', column_list;
        
        -- Check if plate column exists
        IF column_list ILIKE '%plate%' THEN
            RAISE NOTICE 'plate column EXISTS in vehicles table';
        ELSE
            RAISE NOTICE 'plate column does NOT exist in vehicles table';
        END IF;
    ELSE
        RAISE NOTICE 'vehicles table does NOT exist';
    END IF;
END $$;

-- =====================================================
-- STEP 4: Check for any problematic migrations
-- =====================================================

-- Check migration history
SELECT 
    'MIGRATION' as object_type,
    version,
    description,
    installed_on
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;

-- =====================================================
-- STEP 5: Check for any remaining problematic objects
-- =====================================================

-- Find any remaining objects that might cause issues
SELECT 
    'PROBLEMATIC_OBJECT' as object_type,
    schemaname,
    objectname,
    objecttype,
    definition
FROM (
    SELECT 
        schemaname,
        indexname as objectname,
        'index' as objecttype,
        indexdef as definition
    FROM pg_indexes 
    WHERE schemaname = 'public'
    
    UNION ALL
    
    SELECT 
        n.nspname as schemaname,
        p.proname as objectname,
        'function' as objecttype,
        pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    
    UNION ALL
    
    SELECT 
        schemaname,
        viewname as objectname,
        'view' as objecttype,
        definition
    FROM pg_views 
    WHERE schemaname = 'public'
) all_objects
WHERE definition ILIKE '%plate%'
ORDER BY objecttype, objectname;

-- =====================================================
-- STEP 6: Summary and recommendations
-- =====================================================

SELECT 
    'SUMMARY' as section,
    'Run the safe fix script: scripts/fix-dashboard-metrics-safe.sql' as recommendation

UNION ALL

SELECT 
    'SUMMARY',
    'If vehicles table is missing, deploy the base schema first'

UNION ALL

SELECT 
    'SUMMARY',
    'Check the results above to see what objects reference "plate"'

UNION ALL

SELECT 
    'SUMMARY',
    'The error is likely from an index or constraint on a non-existent table/column';
