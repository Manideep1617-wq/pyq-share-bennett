import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { APP_NAME } from "@/lib/college";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const title = `My uploads — ${APP_NAME}`;
const description = "Manage the question papers you've shared and track their downloads.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const { data: papers, isLoading } = useQuery({
    queryKey: ["my-papers", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("papers")
        .select("id, title, subject, course, semester, exam_year, download_count, file_path, upload_date, status")
        .eq("uploaded_by", user.id)
        .order("upload_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function remove(id: string, filePath: string) {
    const { error } = await supabase.from("papers").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete that paper.");
      return;
    }
    await supabase.storage.from("papers").remove([filePath]);
    toast.success("Paper deleted.");
    void queryClient.invalidateQueries({ queryKey: ["my-papers", user.id] });
    void queryClient.invalidateQueries({ queryKey: ["papers"] });
  }

  const totalDownloads = (papers ?? []).reduce((sum, p) => sum + p.download_count, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My uploads</h1>
          <p className="mt-2 text-muted-foreground">{user.email}</p>
        </div>
        <Button asChild>
          <Link to="/upload">
            <Plus className="size-4" /> Upload paper
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Papers shared</CardDescription>
            <CardTitle className="text-3xl">{papers?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total downloads</CardDescription>
            <CardTitle className="text-3xl">{totalDownloads}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          {isLoading ? (
            <p className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading your papers…
            </p>
          ) : !papers || papers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">You haven't shared a paper yet.</p>
              <Button asChild className="mt-4">
                <Link to="/upload">Upload your first paper</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paper</TableHead>
                  <TableHead className="hidden sm:table-cell">Course</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.map((paper) => (
                  <TableRow key={paper.id}>
                    <TableCell>
                      <Link
                        to="/paper/$id"
                        params={{ id: paper.id }}
                        className="font-medium hover:underline"
                      >
                        {paper.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="secondary">{paper.subject}</Badge>
                        <Badge variant="outline">{paper.semester}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {paper.course}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{paper.exam_year}</TableCell>
                    <TableCell>
                      {paper.status === "published" ? (
                        <Badge>Published</Badge>
                      ) : (
                        <Badge variant="outline">Pending review</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Download className="size-3.5" /> {paper.download_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Delete paper">
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this paper?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{paper.title}" will be removed for everyone. This can't be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void remove(paper.id, paper.file_path)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
