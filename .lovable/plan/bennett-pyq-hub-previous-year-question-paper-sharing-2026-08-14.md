# Bennett PYQ Hub — Previous Year Question Paper Sharing

A platform where Bennett University students upload and download previous year exam papers. Browsing and downloading are open to everyone; uploading requires a verified `@bennett.edu.in` email (OTP login, no passwords).

## Backend (Lovable Cloud)

Enable Lovable Cloud for auth, database, and file storage.

**Tables**
- `profiles` — id (matches auth user), email, full_name, course, year_of_study, created_at. Auto-created on signup via trigger.
- `papers` — id, uploaded_by, title, course, subject, semester, exam_year, file_url, file_path, file_type, upload_date, status (default `published`), download_count (default 0).
- `reports` — id, paper_id, reported_by, reason, created_at.

**Access rules**
- Anyone (including signed-out visitors) can read `published` papers.
- Only signed-in users can insert papers; a user can edit/delete only their own.
- Uploaders can always see their own papers, including `pending` ones (needed for the dashboard once approval is turned on).
- Reports can be inserted by signed-in users; only admins can read them.
- Roles live in a separate `user_roles` table with an `admin` role, so `/admin` can be locked down later without a schema change.

**Storage**
- Bucket `papers` (public read) for PDF/JPG/PNG up to 10MB. Files stored under `<user-id>/<uuid>.<ext>`; only the owner can write to their folder.

**Download counting**
- A database function increments `download_count` atomically, called from a server function when the Download button is clicked (so counts can't be spoofed with a direct table update).

## Auth

- Email OTP (6-digit code), not magic link, not password.
- Email must end in `@bennett.edu.in` — validated in the UI and re-validated server-side; other domains get a clear error.
- Auto-confirm is enabled so the OTP itself completes signup.
- Header reflects session state: "Sign in" when signed out; account menu with Dashboard / Upload / Sign out when signed in.

## Pages

1. `/` — Home: hero explaining the platform, search bar (jumps to Browse with the query), grid of recently added papers.
2. `/browse` — Filters for Course, Subject, Semester, Exam Year + text search; results grid of paper cards (title, subject, year, download count).
3. `/paper/$id` — Detail: full metadata, uploader name, inline preview (PDF embed or image), Download button that increments the count, and a Report dialog (reason: spam / wrong subject / unreadable / other).
4. `/auth` — Email input → Send OTP → 6-digit code input → Verify & Login → redirect to dashboard.
5. `/upload` — Protected. Short stepped form (Title + Course → Subject + Semester + Year → File), uploads to storage then inserts the paper as `published`.
6. `/dashboard` — Protected. Table of the user's uploads with title, subject, year, downloads, upload date, status, and a delete action.
7. `/admin` — Protected. All papers with a published/pending toggle, plus a table of reports with the related paper title. Reachable by any signed-in user for now; the role check is in place to switch on later.

## Design

Academic and calm: deep navy/blue primary with warm off-white surfaces, one accent for actions, generous card-based layout, clear typographic hierarchy, fully mobile responsive. All colors as semantic design tokens.

## Technical notes

- TanStack Start routes; protected pages live under the `_authenticated` layout, public pages stay SSR-enabled so paper links are shareable and indexable.
- Data reads go through route loaders + TanStack Query; public reads use a publishable-key server client, user-scoped reads use authenticated server functions.
- Uploads validated with zod (file type, size, required fields) on both client and server.
- Each page gets its own SEO metadata (title, description, og/twitter tags).
- Approval flow stays off: `status` defaults to `published`, and flipping it later is a default change plus enabling the admin gate.
