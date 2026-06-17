import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, FileText, Check, Sparkles, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { AIAPI } from "@/lib/api/ai";

export const Route = createFileRoute("/app/documents")({
  component: Documents,
});

interface Doc {
  id: number;
  name: string;
  uploaded_at: string;
  summary?: string;
  suggestions?: string[];
  mongo_id?: string;
  status: "processed" | "processing";
}

function Documents() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: rawDocs, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => AIAPI.listDocuments(),
    staleTime: 2 * 60 * 1000,
  });

  const docs: Doc[] = (rawDocs ?? []).map((d: any) => ({
    id: d.id,
    name: d.file_name || d.name || `Document ${d.id}`,
    uploaded_at: d.created_at || new Date().toISOString(),
    summary: d.summary || "",
    mongo_id: d.mongo_doc_id || "",
    status: "processed" as const,
  }));

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) { setError("File too large (max 10MB)"); return; }
    setUploading(true);
    setError("");
    try {
      const result = await AIAPI.processDocument(file);
      let summaryText = "";
      if (typeof result.summary === "string") summaryText = result.summary;
      else if (result.summary?.summary) summaryText = result.summary.summary;
      else if (result.summary) summaryText = JSON.stringify(result.summary);

      const newDoc: Doc = {
        id: result.document_id || result.sql_document_id || Date.now(),
        name: file.name,
        uploaded_at: new Date().toISOString(),
        summary: summaryText,
        mongo_id: result.mongo_id || "",
        status: "processed",
      };

      if (result.mongo_id) {
        try {
          const [sumData, sugData] = await Promise.allSettled([
            AIAPI.getExpenseSummary(result.mongo_id),
            AIAPI.getSuggestions(result.mongo_id),
          ]);
          if (sumData.status === "fulfilled" && sumData.value?.summary) {
            newDoc.summary = typeof sumData.value.summary === "string"
              ? sumData.value.summary
              : JSON.stringify(sumData.value.summary);
          }
          if (sugData.status === "fulfilled") {
            const raw = sugData.value?.suggestions ?? [];
            newDoc.suggestions = raw.map((s: any) => typeof s === "string" ? s : (s.suggestion || s.text || JSON.stringify(s)));
          }
        } catch { /* ignore */ }
      }

      setActiveDoc(newDoc);
      qc.invalidateQueries({ queryKey: ["documents"] });
    } catch (e: any) {
      setError(e.message || "Failed to process document. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Upload anything. We read, parse, categorise."
        action={
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-cta px-4 py-2 text-sm font-medium text-cta-foreground"
          >
            <Upload className="h-4 w-4" /> Upload
          </button>
        }
      />

      {/* Drop zone */}
      <Card className="mb-4">
        <div
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
            isDragging ? "border-brand-light bg-brand/5" : "border-border bg-surface/40"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {uploading ? (
            <>
              <Loader2 className="h-7 w-7 text-brand-light animate-spin" />
              <div className="mt-3 text-sm">Analysing with AI…</div>
              <div className="text-xs text-muted-foreground">OCR · extraction · indexing</div>
            </>
          ) : (
            <>
              <Upload className="h-7 w-7 text-brand-light" />
              <div className="mt-3 text-sm">Drop PDFs, images, or statements here</div>
              <div className="text-xs text-muted-foreground">PDF · JPG · PNG — max 10MB</div>
            </>
          )}
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            <X className="h-4 w-4" />
            {error}
          </div>
        )}
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i}><Skeleton className="h-32 w-full" /></Card>)}
        </div>
      ) : docs.length === 0 && !activeDoc ? (
        <Card className="py-16 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Upload a bank statement or PDF to get AI-powered insights.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Document list */}
          <Card>
            <div className="text-display text-lg mb-4">Uploaded Documents</div>
            <div className="space-y-2">
              {[...(activeDoc && !docs.find(d => d.id === activeDoc.id) ? [activeDoc] : []), ...docs].map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                    activeDoc?.id === doc.id
                      ? "border-brand-light bg-brand/5"
                      : "border-border hover:bg-surface/60"
                  }`}
                >
                  <div className="h-9 w-9 rounded-lg bg-surface grid place-items-center shrink-0">
                    <FileText className="h-4 w-4 text-brand-light" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{doc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(doc.uploaded_at).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                    doc.status === "processed" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  }`}>
                    {doc.status === "processed" ? <Check className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
                    {doc.status}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Document detail */}
          {activeDoc && (
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-display text-lg truncate">{activeDoc.name}</div>
                <button onClick={() => setActiveDoc(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                Uploaded {new Date(activeDoc.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              {activeDoc.summary ? (
                <div className="rounded-xl border border-border bg-surface/40 p-4">
                  <div className="flex items-center gap-2 mb-2 text-xs text-brand-light font-medium">
                    <Sparkles className="h-3.5 w-3.5" /> AI Summary
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {activeDoc.summary}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <FileText className="h-7 w-7 mx-auto mb-2 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">No AI analysis available.</p>
                </div>
              )}
              {activeDoc.suggestions && activeDoc.suggestions.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-2">AI Recommendations</div>
                  <div className="space-y-2">
                    {activeDoc.suggestions.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-surface/40 p-3 text-xs">
                        <Sparkles className="h-3.5 w-3.5 mt-0.5 text-brand-light shrink-0" />
                        <span className="text-muted-foreground">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </>
  );
}
