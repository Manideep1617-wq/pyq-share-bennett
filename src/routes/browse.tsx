import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { getFilterOptions, listPapers } from "@/lib/papers.functions";
import { APP_NAME, COURSES, EXAM_YEARS, SEMESTERS } from "@/lib/college";
import { PaperCard } from "@/components/paper-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BrowseSearch = {
  q?: string | undefined;
  course?: string | undefined;
  subject?: string | undefined;
  semester?: string | undefined;
  year?: number | undefined;
};

const ALL = "__all__";

function papersQuery(search: BrowseSearch) {
  return queryOptions({
    queryKey: ["papers", "browse", search],
    queryFn: () =>
      listPapers({
        data: {
          q: search.q,
          course: search.course,
          subject: search.subject,
          semester: search.semester,
          examYear: search.year,
        },
      }),
  });
}

const optionsQuery = queryOptions({
  queryKey: ["papers", "filter-options"],
  queryFn: () => getFilterOptions(),
});

const title = `Browse question papers — ${APP_NAME}`;
const description =
  "Filter previous year question papers by course, subject, semester and exam year, then download instantly.";

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>): BrowseSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? (search["q"] as string) : undefined,
    course: typeof search["course"] === "string" && search["course"] ? (search["course"] as string) : undefined,
    subject: typeof search["subject"] === "string" && search["subject"] ? (search["subject"] as string) : undefined,
    semester: typeof search["semester"] === "string" && search["semester"] ? (search["semester"] as string) : undefined,
    year: search["year"] ? Number(search["year"]) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(papersQuery(deps)),
      context.queryClient.ensureQueryData(optionsQuery),
    ]),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  errorComponent: () => (
    <p className="mx-auto max-w-6xl px-4 py-24 text-center text-muted-foreground">
      We couldn't load papers right now. Please refresh.
    </p>
  ),
  component: Browse,
});

function Browse() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: papers } = useSuspenseQuery(papersQuery(search));
  const { data: options } = useSuspenseQuery(optionsQuery);

  const update = (patch: Partial<BrowseSearch>) => {
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };

  const courses = options.courses.length ? options.courses : [...COURSES];
  const semesters = options.semesters.length ? options.semesters : [...SEMESTERS];
  const years = options.years.length ? options.years : EXAM_YEARS;
  const hasFilters = Boolean(search.q || search.course || search.subject || search.semester || search.year);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Browse papers</h1>
      <p className="mt-2 text-muted-foreground">
        {papers.length} paper{papers.length === 1 ? "" : "s"} available
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                value={search.q ?? ""}
                onChange={(e) => update({ q: e.target.value || undefined })}
                placeholder="Title or subject"
                className="pl-9"
              />
            </div>
          </div>

          <FilterSelect
            label="Course"
            value={search.course}
            options={courses}
            onChange={(v) => update({ course: v })}
          />
          <FilterSelect
            label="Subject"
            value={search.subject}
            options={options.subjects}
            onChange={(v) => update({ subject: v })}
            emptyHint="No subjects yet"
          />
          <FilterSelect
            label="Semester"
            value={search.semester}
            options={semesters}
            onChange={(v) => update({ semester: v })}
          />
          <FilterSelect
            label="Exam year"
            value={search.year ? String(search.year) : undefined}
            options={years.map(String)}
            onChange={(v) => update({ year: v ? Number(v) : undefined })}
          />

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() =>
                navigate({
                  search: {},
                })
              }
            >
              <X className="size-4" /> Clear filters
            </Button>
          )}
        </aside>

        <div>
          {papers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No papers match these filters yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {papers.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  emptyHint,
}: {
  label: string;
  value?: string | undefined;
  options: string[];
  onChange: (value: string | undefined) => void;
  emptyHint?: string | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value ?? ALL}
        onValueChange={(v) => onChange(v === ALL ? undefined : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`All ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All {label.toLowerCase()}</SelectItem>
          {options.length === 0 && emptyHint ? (
            <SelectItem value="__none__" disabled>
              {emptyHint}
            </SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
