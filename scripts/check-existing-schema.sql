-- CHECK EXISTING SCHEMA STRUCTURE
-- Run this to see what your shops table looks like

-- =====================================================
-- STEP 1: Check shops table structure
-- =====================================================

SELECT 
    'shops table structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'shops'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 2: Check existing shops data
-- =====================================================

SELECT 
    'existing shops data' as info,
    id,
    name,
    email,
    is_active,
    created_at
FROM public.shops
LIMIT 5;

-- =====================================================
-- STEP 3: Check what other tables exist
-- =====================================================

SELECT 
    'existing tables' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- STEP 4: Check for jobs table (needed for dashboard)
-- =====================================================

DO $$
DECLARE
    jobs_exists BOOLEAN;
    jobs_columns TEXT;
BEGIN
    -- Check if jobs table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs'
    ) INTO jobs_exists;
    
    IF jobs_exists THEN
        RAISE NOTICE 'jobs table EXISTS';
        
        -- Get column list
        SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
        INTO jobs_columns
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs';
        
        RAISE NOTICE 'jobs table columns: %', jobs_columns;
    ELSE
        RAISE NOTICE 'jobs table does NOT exist - dashboard will use static data';
    END IF;
END $$;

-- =====================================================
-- STEP 5: Summary and recommendations
-- =====================================================

SELECT 
    'SUMMARY' as section,
    'Use the fix-dashboard-metrics-existing-schema.sql script' as recommendation

UNION ALL

SELECT 
    'SUMMARY',
    'This script works with your existing shops table structure'

UNION ALL

SELECT 
    'SUMMARY',
    'No need to create new shops - uses existing ones'

UNION ALL

SELECT 
    'SUMMARY',
    'Dashboard will work with static data until jobs table is available';
