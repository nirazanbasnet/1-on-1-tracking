-- =====================================================
-- COMPLETE DATABASE RESET - Nuclear Option
-- =====================================================
-- This drops EVERYTHING in the public schema
-- Use this when you want a completely fresh start

-- =====================================================
-- STEP 1: Drop all tables with CASCADE
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: Drop all custom types
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all custom types (enums) in public schema
    FOR r IN (
        SELECT t.typname
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        AND t.typtype = 'e'  -- enum types
    )
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
        RAISE NOTICE 'Dropped type: %', r.typname;
    END LOOP;
END $$;

-- =====================================================
-- STEP 3: Drop all functions
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all functions in public schema
    FOR r IN (
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
    )
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
        RAISE NOTICE 'Dropped function: %(%)', r.proname, r.args;
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: Drop all triggers on auth.users (if any)
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_schema = 'auth'
        AND event_object_table = 'users'
        AND trigger_name LIKE '%auth_user%'
    )
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON auth.users CASCADE';
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;

-- =====================================================
-- STEP 5: Drop all sequences
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    )
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
        RAISE NOTICE 'Dropped sequence: %', r.sequence_name;
    END LOOP;
END $$;

-- =====================================================
-- STEP 6: Drop all views
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
    )
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', r.table_name;
    END LOOP;
END $$;

-- =====================================================
-- STEP 7: Verify everything is clean
-- =====================================================

DO $$
DECLARE
    table_count INT;
    type_count INT;
    function_count INT;
    trigger_count INT;
BEGIN
    -- Count remaining objects
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
    SELECT COUNT(*) INTO type_count FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e';
    SELECT COUNT(*) INTO function_count FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public';
    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers WHERE trigger_schema = 'public';

    RAISE NOTICE '';
    RAISE NOTICE '=== CLEANUP SUMMARY ===';
    RAISE NOTICE 'Remaining tables: %', table_count;
    RAISE NOTICE 'Remaining types: %', type_count;
    RAISE NOTICE 'Remaining functions: %', function_count;
    RAISE NOTICE 'Remaining triggers: %', trigger_count;
    RAISE NOTICE '';

    IF table_count = 0 AND type_count = 0 AND function_count = 0 THEN
        RAISE NOTICE '✓✓✓ DATABASE COMPLETELY CLEAN! ✓✓✓';
        RAISE NOTICE '';
        RAISE NOTICE 'You can now start applying migrations from 00001';
    ELSE
        RAISE NOTICE '⚠ Some objects remain (this might be okay)';
        RAISE NOTICE 'Check if they are part of extensions or system objects';
    END IF;
END $$;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

-- Show any remaining tables
SELECT 'Remaining tables:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Show any remaining types
SELECT 'Remaining custom types:' as info;
SELECT t.typname
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
AND t.typtype = 'e';

-- Show any remaining functions
SELECT 'Remaining functions:' as info;
SELECT p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public';

SELECT '=== Database is ready for fresh migrations ===' as status;
