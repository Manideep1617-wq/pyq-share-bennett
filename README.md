# PYQ Share

# PYQ Paper Sharing Platform — Prompt for Lovable

## What this document is
A ready-to-paste prompt for Lovable to build your college's Previous Year Question (PYQ) paper sharing platform. Paste the "PROMPT FOR LOVABLE" section directly into Lovable's chat to start building.

---

## How the site works (in plain terms)

1. A student finishes an exam and uploads the question paper (PDF or photo) — tags it with course, subject, semester, and year.
2. Other students search/filter by course + subject + year to find relevant papers.
3. Anyone can browse and download without logging in.
4. To upload, a student must sign up using their **college email only**. They enter the email, get a 6-digit OTP, enter it, and they're logged in — no passwords.
5. Later (once the site has traction) you'll flip on an admin-approval step so new uploads wait for admin review before going public. For now, everything auto-publishes.

---

## Tech stack (what Lovable will use)

- **Frontend**: React + Tailwind CSS (Lovable's default)
- **Backend & Database**: Supabase (Postgres + Auth + Storage) — Lovable integrates with this natively
- **Auth**: Supabase Auth with **email OTP** (magic-code, not magic-link), restricted to your college's email domain
- **File storage**: Supabase Storage bucket for uploaded PDFs/images
- **Search/Filter**: Postgres queries via Supabase (filter by course, subject, semester, year)

---

## Database structure (tables)

**profiles**
- id (uuid, linked to auth.users)
- email
- full_name
- course
- year_of_study
- created_at

**papers**
- id
- uploaded_by (references profiles.id)
- title
- course
- subject
- semester
- exam_year
- file_url (Supabase Storage path)
- file_type (pdf/image)
- upload_date
- status (published / pending — default "published" for now, ready for later admin toggle)
- download_count

**reports** (for flagging bad content, since we're skipping admin review for now)
- id
- paper_id
- reported_by
- reason
- created_at

---

## Pages / screens needed

1. **Home page** — hero explaining the idea, search bar, recently added papers grid
2. **Browse/Search page** — filters for Course, Subject, Semester, Year; grid/list of paper cards (title, subject, year, download count, download button)
3. **Paper detail page** — preview (PDF viewer or image), full metadata, download button, "Report this paper" link
4. **Upload page** (login required) — form: title, course, subject, semester, exam year, file upload (PDF/image), submit
5. **Login/Signup page** — single email input → "Send OTP" → OTP input field → verify → redirect to dashboard
6. **My Uploads / Dashboard** (login required) — list of papers the student has uploaded, with download counts
7. **Admin page (build now, keep hidden/unused for later)** — table of all papers with a toggle to approve/reject, and a view of reported papers

---

## PROMPT FOR LOVABLE
*(copy everything below into Lovable)*

```
Build a web app called "[Your College Name] PYQ Hub" — a platform where students can upload and download previous year exam question papers for their college.

TECH: Use Supabase for auth, database, and file storage.

AUTHENTICATION:
- Use Supabase Auth with email OTP (one-time password sent to email), NOT email/password and NOT magic link.
- Restrict signup/login to email addresses ending in "@[yourcollege-domain].edu.in" (replace with actual domain) — reject any other email domain with a clear error message.
- Flow: user enters college email → clicks "Send OTP" → receives 6-digit code → enters code → logged in.
- No login required to browse or download papers. Login IS required to upload a paper.

DATABASE TABLES:
1. profiles: id (uuid, fk to auth.users), email, full_name, course, year_of_study, created_at
2. papers: id, uploaded_by (fk to profiles), title, course, subject, semester, exam_year, file_url, file_type, upload_date, status (default 'published'), download_count (default 0)
3. reports: id, paper_id (fk to papers), reported_by (fk to profiles), reason, created_at

FILE STORAGE:
- Use Supabase Storage for uploaded files (accept PDF, JPG, PNG, max 10MB).
- Generate a public URL for each uploaded file and store it in papers.file_url.

PAGES:
1. Home page: hero section explaining the platform, prominent search bar, grid of recently uploaded papers (card shows title, subject, year, download count).
2. Browse page: filter sidebar (Course dropdown, Subject dropdown, Semester dropdown, Exam Year dropdown) + results grid of paper cards. Clicking a card goes to paper detail.
3. Paper detail page: shows title, course, subject, semester, year, uploader name, download count, an inline preview (PDF embed or image), a Download button (increments download_count on click), and a "Report" link that opens a small form (reason dropdown: spam / wrong subject / unreadable / other) and inserts into the reports table.
4. Login page: single email input field, "Send OTP" button, then OTP input field, "Verify & Login" button. Show error if email domain doesn't match college domain.
5. Upload page (protected route, redirect to login if not authenticated): form with Title, Course, Subject, Semester, Exam Year fields, and a file upload input. On submit, upload file to Supabase Storage, then insert a row into papers with status='published'.
6. Dashboard page (protected route): shows the logged-in user's uploaded papers in a table with title, subject, year, download count, and upload date.
7. Admin page at /admin (protected route, just leave it accessible for now, we'll restrict by role later): table listing ALL papers with a status toggle (published/pending) and a separate table listing all rows from reports with the related paper title.

DESIGN:
Clean, modern, student-friendly. Use a calm color palette (blues/whites or similar academic feel). Card-based layout for papers. Mobile responsive since students will use this on phones. Make the upload flow feel quick and simple (max 2-3 fields visible at once, no long forms).

Make sure download counts, filters, and the OTP login flow are fully functional and connected to Supabase — not just UI placeholders.
```

---

## What to fill in before pasting
- Replace bennett university   and  see for 4rth years mail is e23cseu1986@bennett.edu.in like this and it varies for other year students okay so they tpye teh mail verify otp then give login access  with your actual college name and email domain.

## What happens after this (later, not now)
Once the site has real usage, come back and we'll write a follow-up prompt for Lovable to:
- Add the admin-approval toggle so new papers start as "pending" instead of auto-publishing
- Restrict `/admin` to a specific admin account
- Add subject-wise leaderboards, comments, or ratings if you want

Just ask me when you're ready for that part.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pyq-share-bennett.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ddcc1c25-c996-444e-a32b-a16e723502be).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
