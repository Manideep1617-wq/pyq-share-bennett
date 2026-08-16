import { Link } from "@tanstack/react-router";

import { APP_NAME, COLLEGE_NAME } from "@/lib/college";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{APP_NAME}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A student-run archive of previous year question papers at {COLLEGE_NAME}.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/browse" className="hover:text-foreground">
            Browse
          </Link>
          <Link to="/upload" className="hover:text-foreground">
            Upload
          </Link>
          <Link to="/dashboard" className="hover:text-foreground">
            My uploads
          </Link>
        </nav>
      </div>
    </footer>
  );
}
