-- Upload limits for the two public storage buckets (project-context.md 11.7).
--
-- Until now the public `images` bucket accepted any file type and any size, and `fact_sheets`
-- (types already limited to pdf / doc / docx / md) had no size limit. Files in these buckets open
-- by URL for anyone, so an uploaded SVG (which can carry script) or a huge file was served as-is.
--
--   images ....... listing photos, profile and developer pictures, promo posters, payment proofs.
--                  Only raster images: PNG, JPEG, WEBP, GIF, plus HEIC / HEIF / AVIF (phone photos).
--                  No SVG. Max 10 MB per file (largest file already stored: a 9.2 MB PNG).
--   fact_sheets .. allowed types unchanged; max 20 MB per file (largest stored: 0.12 MB).
--
-- The limits only apply to new uploads; files already stored stay as they are. The app uploads
-- with the browser's file type (`.upload(path, file)`) from `accept="image/*"` inputs, so normal
-- photos keep working; a refused upload comes back as an error the existing flows already show.
-- `support_attachments` already has its own limits (20261104160000_support_tickets.sql).
--
-- Idempotent: safe to re-run in the SQL editor.

update storage.buckets
   set file_size_limit    = 10485760,  -- 10 MB
       allowed_mime_types = array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
                                  'image/heic', 'image/heif', 'image/avif']
 where id = 'images';

update storage.buckets
   set file_size_limit = 20971520      -- 20 MB
 where id = 'fact_sheets';

-- Check: both rows show the new limits.
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets
 where id in ('images', 'fact_sheets')
 order by id;
