import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, ShieldAlert, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { APP_NAME, REPORT_REASONS } from "@/lib/college";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const title = `Moderation — ${APP_NAME}`;
const description = "Approve or reject uploaded question papers and review reports.";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AdminPage,
});

function reasonLabel(value: string) {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}

function AdminPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: checkingRole } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) throw error;
      return Boolean(data);
    },
  });

  const { data: pending, isLoading: loadingPending } = useQuery({
    queryKey: ["pending-papers"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("papers")
        .select("id, title, subject, course, semester, exam_year, file_path, file_type, upload_date, profiles:uploaded_by(full_name, email)")
        .eq("status", "pending")
        .order("upload_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: reports, isLoading: loadingReports } = useQuery({
    queryKey: ["reports"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, reason, created_at, paper_id, papers(id, title, subject, course, file_path)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["pending-papers"] });
    void queryClient.invalidateQueries({ queryKey: ["reports"] });
    void queryClient.invalidateQueries({ queryKey: ["papers"] });
  }

  async function approve(paperId: string) {
    const { error } = await supabase
      .from("papers")
      .update({ status: "published" })
      .eq("id", paperId);
    if (error) {
      toast.error("Couldn't approve that paper.");
      return;
    }
    toast.success("Paper approved — it's now public.");
    refresh();
  }

  async function removePaper(paperId: string, filePath?: string | null, message = "Paper removed.") {
    const { error } = await supabase.from("papers").delete().eq("id", paperId);
    if (error) {
      toast.error("Couldn't delete that paper.");
      return;
    }
    if (filePath) await supabase.storage.from("papers").remove([filePath]);
    toast.success(message);
    refresh();
  }

  async function preview(filePath: string) {
    const { data, error } = await supabase.storage.from("papers").createSignedUrl(filePath, 3600);
    if (error || !data) {
      toast.error("Couldn't open that file.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  if (checkingRole) {
    return (
      <p className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Checking access…
      </p>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">
          This area is limited to moderators of {APP_NAME}.
        </p>
        <Button asChild className="mt-6">
          <Link to="/browse">Back to browse</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Moderation</h1>
      <p className="mt-2 text-muted-foreground">
        Every upload waits here until you approve it. Nothing is public before that.
      </p>

      <Tabs defaultValue="pending" className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending approval{pending && pending.length > 0 ? ` (${pending.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="reports">
            Reports{reports && reports.length > 0 ? ` (${reports.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Waiting for review</CardTitle>
              <CardDescription>
                Open the file to check it, then approve it or reject it (the file is deleted).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPending ? (
                <p className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Loading queue…
                </p>
              ) : !pending || pending.length === 0 ? (
                <p className="p-12 text-center text-muted-foreground">
                  Nothing waiting — the queue is clear.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paper</TableHead>
                      <TableHead className="hidden sm:table-cell">Uploaded by</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Review</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((paper) => (
                      <TableRow key={paper.id}>
                        <TableCell>
                          <button
                            type="button"
                            className="text-left font-medium hover:underline"
                            onClick={() => void preview(paper.file_path)}
                          >
                            {paper.title}
                          </button>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge variant="secondary">{paper.subject}</Badge>
                            <Badge variant="outline">{paper.course}</Badge>
                            <Badge variant="outline">{paper.semester}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {paper.profiles?.full_name ?? paper.profiles?.email ?? "Unknown"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{paper.exam_year}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              aria-label="Approve paper"
                              onClick={() => void approve(paper.id)}
                            >
                              <Check className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Reject paper"
                              onClick={() =>
                                void removePaper(paper.id, paper.file_path, "Upload rejected and deleted.")
                              }
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reported papers</CardTitle>
              <CardDescription>{reports?.length ?? 0} report(s)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingReports ? (
                <p className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Loading reports…
                </p>
              ) : !reports || reports.length === 0 ? (
                <p className="p-12 text-center text-muted-foreground">No reports right now.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paper</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="hidden sm:table-cell">Reported</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          {report.papers ? (
                            <Link
                              to="/paper/$id"
                              params={{ id: report.papers.id }}
                              className="font-medium hover:underline"
                            >
                              {report.papers.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Deleted paper</span>
                          )}
                          {report.papers && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              <Badge variant="secondary">{report.papers.subject}</Badge>
                              <Badge variant="outline">{report.papers.course}</Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{reasonLabel(report.reason)}</TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {new Date(report.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {report.papers && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Remove paper"
                              onClick={() =>
                                void removePaper(report.paper_id, report.papers?.file_path)
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
