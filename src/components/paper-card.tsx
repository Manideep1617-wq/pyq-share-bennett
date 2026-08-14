import { Link } from "@tanstack/react-router";
import { Download, FileImage, FileText } from "lucide-react";

import type { PaperRow } from "@/lib/papers.functions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function PaperCard({ paper }: { paper: PaperRow }) {
  const isPdf = paper.file_type === "pdf";

  return (
    <Link to="/paper/$id" params={{ id: paper.id }} className="group block h-full">
      <Card className="h-full gap-3 border-border/70 transition-all group-hover:-translate-y-0.5 group-hover:shadow-card">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {isPdf ? <FileText className="size-4" /> : <FileImage className="size-4" />}
            <span className="uppercase tracking-wide">{paper.file_type}</span>
            <span aria-hidden>·</span>
            <span>{paper.exam_year}</span>
          </div>
          <CardTitle className="font-display text-lg leading-snug">{paper.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">{paper.subject}</Badge>
          <Badge variant="outline">{paper.course}</Badge>
          <Badge variant="outline">{paper.semester}</Badge>
        </CardContent>
        <CardFooter className="justify-between text-xs text-muted-foreground">
          <span>{paper.uploader_name ? `Shared by ${paper.uploader_name}` : "Shared anonymously"}</span>
          <span className="inline-flex items-center gap-1">
            <Download className="size-3.5" /> {paper.download_count}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
