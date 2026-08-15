import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarDays, Download, Flag, GraduationCap, Loader2, User } from "lucide-react";
import { toast } from "sonner";

import { getPaper } from "@/lib/papers.functions";
import { getPaperFileUrl } from "@/lib/storage";
import { APP_NAME, REPORT_REASONS } from "@/lib/college";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function paperQuery(id: string) {
  return queryOptions({
    queryKey: ["paper", id],
    queryFn: () => getPaper({ data: { id } }),
  });
}

export const Route = createFileRoute("/paper/$id")({
  loader: async ({ context, params }) => {
    const paper = await context.queryClient.ensureQueryData(paperQuery(params.id));
    if (!paper) throw notFound();
    return paper;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: `Paper unavailable — ${APP_NAME}` }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.title} — ${APP_NAME}`;
    const description = `${loaderData.subject} · ${loaderData.course} · ${loaderData.semester} · ${loaderData.exam_year} question paper, free to download.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  errorComponent: () => (
    <p className="mx-auto max-w-6xl px-4 py-24 text-center text-muted-foreground">
      We couldn't load this paper. Please refresh.
    </p>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Paper not found</h1>
      <p className="mt-2 text-muted-foreground">It may have been removed by the uploader.</p>
      <Button asChild className="mt-6">
        <Link to="/browse">Browse other papers</Link>
      </Button>
    </div>
  ),
  component: PaperDetail,
});

function PaperDetail() {
  const paper = Route.useLoaderData();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [downloads, setDownloads] = useState(paper.download_count);
  const { data: freshPaper } = useSuspenseQuery(paperQuery(paper.id));

  useEffect(() => {
    let active = true;
    getPaperFileUrl(paper.file_path).then((url) => {
      if (active) setFileUrl(url);
    });
    return () => {
      active = false;
    };
  }, [paper.file_path]);

  useEffect(() => {
    if (freshPaper) setDownloads(freshPaper.download_count);
  }, [freshPaper]);

  async function handleDownload() {
    if (!fileUrl) {
      toast.error("The file link is still loading — try again in a second.");
      return;
    }
    const { error } = await supabase.rpc("increment_download_count", { _paper_id: paper.id });
    if (!error) setDownloads((c) => c + 1);
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }

  const isPdf = paper.file_type === "pdf";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/browse" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to browse
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{paper.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">{paper.subject}</Badge>
            <Badge variant="outline">{paper.course}</Badge>
            <Badge variant="outline">{paper.semester}</Badge>
            <Badge variant="outline">{paper.exam_year}</Badge>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
            {!fileUrl ? (
              <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" /> Loading preview…
              </div>
            ) : isPdf ? (
              <iframe src={fileUrl} title={paper.title} className="h-[75vh] w-full" />
            ) : (
              <img src={fileUrl} alt={`${paper.subject} question paper, ${paper.exam_year}`} className="w-full" />
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paper details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <GraduationCap className="size-4" /> {paper.course} · {paper.semester}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4" /> Exam year {paper.exam_year}
              </p>
              <p className="flex items-center gap-2">
                <User className="size-4" /> {paper.uploader_name ?? "Anonymous"}
              </p>
              <p className="flex items-center gap-2">
                <Download className="size-4" /> {downloads} download{downloads === 1 ? "" : "s"}
              </p>
              <Button className="w-full" onClick={handleDownload} disabled={!fileUrl}>
                <Download className="size-4" /> Download paper
              </Button>
              <ReportDialog paperId={paper.id} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ReportDialog({ paperId }: { paperId: string }) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!user) {
      toast.error("Please sign in with your college email to report a paper.");
      return;
    }
    if (!reason) {
      toast.error("Pick a reason first.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("reports")
      .insert({ paper_id: paperId, reported_by: user.id, reason });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit the report. Please try again.");
      return;
    }
    toast.success("Thanks — we'll take a look at this paper.");
    setOpen(false);
    setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full">
          <Flag className="size-4" /> Report this paper
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this paper</DialogTitle>
          <DialogDescription>
            Tell us what's wrong with it. Reports are reviewed by the team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Reason</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a reason" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!user && (
            <p className="text-xs text-muted-foreground">
              You'll need to{" "}
              <Link to="/auth" className="underline">
                sign in
              </Link>{" "}
              with your college email first.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null} Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
