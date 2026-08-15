import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { APP_NAME, REPORT_REASONS } from "@/lib/college";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const title = `Moderation — ${APP_NAME}`;

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: "Review reported question papers." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: "Review reported question papers." },
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

  const { data: reports, isLoading } = useQuery({
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

  async function removePaper(paperId: string, filePath?: string | null) {
    const { error } = await supabase.from("papers").delete().eq("id", paperId);
    if (error) {
      toast.error("Couldn't delete that paper.");
      return;
    }
    if (filePath) await supabase.storage.from("papers").remove([filePath]);
    toast.success("Paper removed.");
    void queryClient.invalidateQueries({ queryKey: ["reports"] });
    void queryClient.invalidateQueries({ queryKey: ["papers"] });
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
      <h1 className="text-3xl font-semibold tracking-tight">Reported papers</h1>
      <p className="mt-2 text-muted-foreground">
        Review flagged uploads and remove anything that breaks the rules.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Open reports</CardTitle>
          <CardDescription>{reports?.length ?? 0} report(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
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
    </div>
  );
}
