import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import {
  ACCEPTED_FILE_TYPES,
  APP_NAME,
  COURSES,
  EXAM_YEARS,
  MAX_FILE_SIZE,
  SEMESTERS,
} from "@/lib/college";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  title: z.string().trim().min(4, "Give the paper a clear title").max(140),
  course: z.string().min(1, "Pick a course"),
  subject: z.string().trim().min(2, "Enter the subject name").max(120),
  semester: z.string().min(1, "Pick a semester"),
  examYear: z.number().int().min(2005).max(new Date().getFullYear()),
});

const title = `Upload a paper — ${APP_NAME}`;
const description = "Share a previous year question paper with your batchmates in under a minute.";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [form, setForm] = useState({
    title: "",
    course: "",
    subject: "",
    semester: "",
    examYear: String(new Date().getFullYear()),
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, examYear: Number(form.examYear) });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    if (!file) {
      toast.error("Attach the paper file (PDF, JPG or PNG).");
      return;
    }
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error("Only PDF, JPG and PNG files are allowed.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is larger than 10 MB.");
      return;
    }

    setBusy(true);
    const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("papers")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setBusy(false);
      toast.error("Upload failed. Please try again.");
      return;
    }

    const { data, error } = await supabase
      .from("papers")
      .insert({
        uploaded_by: user.id,
        title: parsed.data.title,
        course: parsed.data.course,
        subject: parsed.data.subject,
        semester: parsed.data.semester,
        exam_year: parsed.data.examYear,
        file_path: path,
        file_url: path,
        file_type: ext === "pdf" ? "pdf" : "image",
      })
      .select("id")
      .single();

    setBusy(false);

    if (error || !data) {
      await supabase.storage.from("papers").remove([path]);
      toast.error("Couldn't save the paper details. Please try again.");
      return;
    }

    toast.success("Sent for approval — an admin will review it shortly.");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Upload a question paper</CardTitle>
          <CardDescription>
            PDF, JPG or PNG up to 10 MB. Every upload is reviewed by an admin before it goes
            public — you'll see it as "Pending" in My uploads until then.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="paper-title">Title</Label>
              <Input
                id="paper-title"
                value={form.title}
                onChange={(e) => set("title")(e.target.value)}
                placeholder="Data Structures Mid-Semester 2024"
                maxLength={140}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={form.course} onValueChange={set("course")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => set("subject")(e.target.value)}
                  placeholder="Data Structures"
                  maxLength={120}
                />
              </div>

              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={form.semester} onValueChange={set("semester")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Exam year</Label>
                <Select value={form.examYear} onValueChange={set("examYear")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Paper file</Label>
              <label
                htmlFor="file"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center transition-colors hover:bg-muted"
              >
                <FileUp className="size-6 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {file ? file.name : "Click to choose a PDF or image"}
                </span>
                <span className="text-xs text-muted-foreground">Max 10 MB</span>
              </label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Submit for approval
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
