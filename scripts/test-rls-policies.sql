-- Test RLS Policies for BMS Customer Visibility
-- Run this script to verify that SELECT policies are working correctly

-- =====================================================
-- STEP 1: CHECK IF POLICIES EXIST
-- =====================================================

-- Check for SELECT policies on customers table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'customers' 
AND policyname LIKE '%select%'
ORDER BY policyname;

-- =====================================================
-- STEP 2: TEST CUSTOMER VISIBILITY
-- =====================================================

-- Test 1: Count total customers (should work for authenticated users)
SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_customers
FROM customers;

-- Test 2: Show sample customers (should work for authenticated users)
SELECT 
    id,
    customer_number,
    first_name,
    last_name,
    email,
    phone,
    shop_id,
    is_active,
    created_at
FROM customers 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- STEP 3: VERIFY HELPER FUNCTIONS
-- =====================================================

-- Test user_belongs_to_shop function
SELECT 
    user_belongs_to_shop('00000000-0000-0000-0000-000000000000'::UUID) as test_result,
    'Should return true for authenticated users' as expected;

-- Test has_permission function
SELECT 
    has_permission(auth.uid(), 'customers.read') as test_result,
    'Should return true for authenticated users' as expected;

-- =====================================================
-- STEP 4: CHECK RLS STATUS
-- =====================================================

-- Check if RLS is enabled on customers table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'customers';

-- =====================================================
-- STEP 5: SUMMARY
-- =====================================================

DO $$
DECLARE
    policy_count INTEGER;
    customer_count INTEGER;
    rls_enabled BOOLEAN;
BEGIN
    -- Count SELECT policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'customers' 
    AND policyname LIKE '%select%';
    
    -- Count customers
    SELECT COUNT(*) INTO customer_count FROM customers;
    
    -- Check RLS status
    SELECT rowsecurity INTO rls_enabled 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'customers';
    
    RAISE NOTICE '=== RLS POLICY TEST RESULTS ===';
    RAISE NOTICE 'SELECT policies found: %', policy_count;
    RAISE NOTICE 'Total customers: %', customer_count;
    RAISE NOTICE 'RLS enabled: %', rls_enabled;
    
    IF policy_count > 0 AND customer_count > 0 THEN
        RAISE NOTICE '✅ SUCCESS: RLS policies are working - customers should be visible';
    ELSE
        RAISE NOTICE '❌ ISSUE: RLS policies may not be working correctly';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: %', SQLERRM;
END $$;

/*
TEST RESULTS INTERPRETATION:

✅ SUCCESS INDICATORS:
- SELECT policies found: > 0
- Total customers: > 0  
- RLS enabled: true
- Sample customers query returns data

❌ FAILURE INDICATORS:
- SELECT policies found: 0 (need to run fix-rls-select-policies.sql)
- Total customers: 0 (no customers exist)
- RLS enabled: false (RLS not enabled)
- Sample customers query fails with permission error

NEXT STEPS:
1. If no SELECT policies found: Run scripts/fix-rls-select-policies.sql
2. If customers exist but not visible: Check authentication context
3. If RLS not enabled: Enable RLS on customers table
4. If still issues: Check shop_id matching in policies
*/
