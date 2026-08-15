import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type PaperRow = {
  id: string;
  title: string;
  course: string;
  subject: string;
  semester: string;
  exam_year: number;
  file_path: string;
  file_type: string;
  upload_date: string;
  download_count: number;
  status: string;
  uploaded_by: string;
  uploader_name: string | null;
};

type PaperFilters = {
  course?: string | undefined;
  subject?: string | undefined;
  semester?: string | undefined;
  examYear?: number | undefined;
  q?: string | undefined;
  limit?: number | undefined;
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const SELECT = "id,title,course,subject,semester,exam_year,file_path,file_type,upload_date,download_count,status,uploaded_by,profiles:uploaded_by(full_name)";

type RawPaper = Omit<PaperRow, "uploader_name"> & {
  profiles: { full_name: string | null } | null;
};

function shape(rows: RawPaper[] | null): PaperRow[] {
  return (rows ?? []).map(({ profiles, ...rest }) => ({
    ...rest,
    uploader_name: profiles?.full_name ?? null,
  }));
}

export const listPapers = createServerFn({ method: "GET" })
  .inputValidator((data: PaperFilters | undefined) => data ?? {})
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let query = supabase
      .from("papers")
      .select(SELECT)
      .eq("status", "published")
      .order("upload_date", { ascending: false })
      .limit(data.limit ?? 60);

    if (data.course) query = query.eq("course", data.course);
    if (data.subject) query = query.eq("subject", data.subject);
    if (data.semester) query = query.eq("semester", data.semester);
    if (data.examYear) query = query.eq("exam_year", data.examYear);
    if (data.q) {
      const term = data.q.replace(/[%,]/g, " ").trim();
      if (term) query = query.or(`title.ilike.%${term}%,subject.ilike.%${term}%,course.ilike.%${term}%`);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return shape(rows as unknown as RawPaper[]);
  });

export const getPaper = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("papers")
      .select(SELECT)
      .eq("id", data.id)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const [paper] = shape([row as unknown as RawPaper]);
    return paper ?? null;
  });

export const getFilterOptions = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("papers")
    .select("course,subject,semester,exam_year")
    .eq("status", "published")
    .limit(1000);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const uniq = (values: (string | number)[]) => Array.from(new Set(values.filter(Boolean)));
  return {
    courses: uniq(rows.map((r) => r.course)) as string[],
    subjects: uniq(rows.map((r) => r.subject)) as string[],
    semesters: uniq(rows.map((r) => r.semester)) as string[],
    years: (uniq(rows.map((r) => r.exam_year)) as number[]).sort((a, b) => b - a),
  };
});
