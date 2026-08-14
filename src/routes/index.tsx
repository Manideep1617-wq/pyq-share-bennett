import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, FileSearch, Search, ShieldCheck, Upload } from "lucide-react";
import { useState } from "react";

import { listPapers } from "@/lib/papers.functions";
import { APP_NAME, COLLEGE_EMAIL_DOMAIN, COLLEGE_NAME } from "@/lib/college";
import { PaperCard } from "@/components/paper-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const recentPapersQuery = queryOptions({
  queryKey: ["papers", "recent"],
  queryFn: () => listPapers({ data: { limit: 8 } }),
});

const title = `${APP_NAME} — Previous year question papers`;
const description = `Find and share previous year exam question papers from ${COLLEGE_NAME}. Browse by course, subject, semester and year — free for every student.`;

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(recentPapersQuery),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  errorComponent: () => <PageMessage text="We couldn't load papers right now. Please refresh." />,
  component: Home,
});

function PageMessage({ text }: { text: string }) {
  return <p className="mx-auto max-w-6xl px-4 py-24 text-center text-muted-foreground">{text}</p>;
}

function Home() {
  const { data: papers } = useSuspenseQuery(recentPapersQuery);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  return (
    <div>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5" /> For @{COLLEGE_EMAIL_DOMAIN} students
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Every past paper, in one place.
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              {COLLEGE_NAME} students upload the question papers they just wrote, so the next batch
              never has to hunt through WhatsApp groups again. Browsing and downloading are free — no
              login needed.
            </p>

            <form
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                navigate({ to: "/browse", search: q.trim() ? { q: q.trim() } : {} });
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by subject, course or paper title"
                  className="h-12 bg-background pl-9"
                  aria-label="Search papers"
                />
              </div>
              <Button type="submit" size="lg" className="h-12">
                Search papers
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Button asChild variant="ghost" size="sm">
                <Link to="/browse">
                  <FileSearch className="size-4" /> Browse all papers
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/upload">
                  <Upload className="size-4" /> Upload a paper
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: "1. Finish your exam", body: "Snap a photo or grab the PDF of the question paper." },
            { title: "2. Tag it", body: "Add course, subject, semester and exam year in a few taps." },
            { title: "3. Help your juniors", body: "It goes live instantly for everyone to download." },
          ].map((step) => (
            <div key={step.title} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Recently added</h2>
          <Button asChild variant="link" size="sm">
            <Link to="/browse">
              See all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {papers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">
              No papers yet — be the first to upload one and kick this off.
            </p>
            <Button asChild className="mt-4">
              <Link to="/upload">Upload the first paper</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
