UPDATED PERMISSION RULE — MEMBERS CANNOT DELETE OR EDIT FONTS

GOAL
-----
Restrict Members so they can ONLY upload fonts.
ALL destructive or modifying actions are Admin-only.


--------------------------------------------------
FINAL ROLE PERMISSIONS (LOCKED)
--------------------------------------------------

1. GUEST (not logged in)
- Browse fonts
- Download fonts
- Cannot like / favorite
- Cannot upload
- Cannot modify anything

2. USER (logged in, default)
- Everything Guest can do
- Can like / favorite fonts
- Can view favorites in Profile
- Cannot upload fonts
- Can request Member access

3. MEMBER (approved contributor)
- Everything User can do
- Can upload / submit fonts
- CANNOT:
  - Edit font details
  - Delete fonts
  - Replace font files
- Uploaded fonts are fully controlled by Admin

4. ADMIN
- Full control
- Can upload fonts
- Can edit any font
- Can delete any font
- Can replace font files
- Can approve/reject member requests
- Can promote/demote users


--------------------------------------------------
FONT OWNERSHIP MODEL
--------------------------------------------------

- Fonts have an uploaded_by field for attribution only
- uploaded_by DOES NOT grant edit or delete permissions
- Admin role ALWAYS overrides ownership


--------------------------------------------------
DATABASE RULES
--------------------------------------------------

TABLE: fonts
- id
- name
- file_url
- metadata
- uploaded_by (uuid)
- created_at

RULES:
- Members can INSERT rows into fonts
- Members CANNOT UPDATE or DELETE rows
- Admins can INSERT, UPDATE, DELETE any font


--------------------------------------------------
ROW LEVEL SECURITY (RLS) — REQUIRED
--------------------------------------------------

FONT READ:
- Public (Guests, Users, Members, Admins)

FONT INSERT (UPLOAD):
- Allowed if profile.role IN ('member', 'admin')

FONT UPDATE (EDIT):
- Allowed ONLY if profile.role = 'admin'

FONT DELETE:
- Allowed ONLY if profile.role = 'admin'


--------------------------------------------------
FONT REPLACEMENT RULE
--------------------------------------------------

- Replacing font files counts as UPDATE
- ONLY Admins can replace font files
- Members cannot modify uploaded files after submission


--------------------------------------------------
FRONTEND UI RULES
--------------------------------------------------

MEMBER UI:
- Show "Upload Font" button
- DO NOT show:
  - Edit button
  - Delete button
  - Replace file option

ADMIN UI:
- Show:
  - Edit Font
  - Delete Font
  - Replace Font File
  - Moderation controls

USER / GUEST UI:
- No upload, edit, or delete controls


--------------------------------------------------
MODERATION FLOW (OPTIONAL BUT RECOMMENDED)
--------------------------------------------------

1. Member uploads font
2. Font status defaults to 'pending'
3. Admin reviews font
4. Admin approves or rejects
5. Only approved fonts are public


--------------------------------------------------
SECURITY NOTES (CRITICAL)
--------------------------------------------------

- ALL permissions enforced via Supabase RLS
- Frontend logic is visibility-only
- Members must NEVER have UPDATE or DELETE rights
- uploaded_by is informational only


--------------------------------------------------
EXPECTED RESULT
--------------------------------------------------

- Members can contribute safely
- Admins retain full control
- No accidental or malicious deletions
- Clean, scalable permission system

END OF UPDATED SPEC
