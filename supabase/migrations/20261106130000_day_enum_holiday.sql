-- Holiday office hours for developers.
--
-- The Developer List's office-hours picker offers Monday to Sunday plus Holiday
-- (src/assets/classes/developers.ts), but day_enum only had Monday..Sunday, so saving a
-- Holiday slot failed with 22P02 'invalid input value for enum day_enum: "Holiday"'.
-- This adds the value at the end (after Sunday, like the picker). Nothing else changes.
-- Safe to re-run.
--
-- Run it on its own: a new enum value can't be used in the transaction that adds it.
ALTER TYPE public.day_enum ADD VALUE IF NOT EXISTS 'Holiday';
