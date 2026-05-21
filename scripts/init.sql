-- NutriVision AI — Database initialization
-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- for fuzzy food search
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Additional performance indexes (run after migrations)
-- These are supplementary to what Alembic creates
