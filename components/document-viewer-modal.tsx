"use client";
import { useEffect, useState } from "react";
import { X, ExternalLink, FileText, Download, Loader2, BookOpen } from "lucide-react";
import { supabase } from "../lib/supabase";

interface SourceItem {
  title: string;
  page?: number | null;
  document_id?: string;
  source_url?: string;
}

interface DocumentViewerModalProps {
  source: SourceItem | null;
  onClose: () => void;
}

export function DocumentViewerModal({ source, onClose }: DocumentViewerModalProps) {
  const [loading, setLoading] = useState(true);
  const [docData, setDocData] = useState<any>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (!source) return;
    let isMounted = true;
    setLoading(true);
    setDocData(null);
    setViewUrl(null);
    setTextContent(null);

    const loadDocument = async () => {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }

        let doc: any = null;

        // Fetch document metadata by document_id or title
        if (source.document_id) {
          const { data } = await supabase.from("documents").select("*").eq("id", source.document_id).maybeSingle();
          doc = data;
        }
        if (!doc && source.title) {
          const { data } = await supabase.from("documents").select("*").ilike("title", source.title).limit(1).maybeSingle();
          doc = data;
        }

        if (doc) {
          if (isMounted) setDocData(doc);

          if (doc.storage_path) {
            const { data: signedData } = await supabase.storage
              .from("documents")
              .createSignedUrl(doc.storage_path, 3600);

            if (signedData?.signedUrl) {
              if (isMounted) setViewUrl(signedData.signedUrl);

              if (doc.file_type === "txt" || doc.storage_path.endsWith(".txt")) {
                try {
                  const res = await fetch(signedData.signedUrl);
                  const txt = await res.text();
                  if (isMounted) setTextContent(txt);
                } catch (_) {}
              }
            } else if (doc.source_url) {
              if (isMounted) setViewUrl(doc.source_url);
            }
          } else if (doc.source_url) {
            if (isMounted) setViewUrl(doc.source_url);
          }
        } else if (source.source_url) {
          if (isMounted) setViewUrl(source.source_url);
        }
      } catch (err: any) {
        console.error("Document viewer error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
    };
  }, [source]);

  if (!source) return null;

  const pageNum = source.page ?? docData?.metadata?.page_number;
  const webUrl = docData?.source_url || source.source_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[88vh] bg-[#0c1322] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center flex-shrink-0 text-[#10b981]">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white truncate max-w-md m-0">
                  {docData?.title || source.title}
                </h3>
                {pageNum ? (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Page {pageNum}
                  </span>
                ) : null}
                {docData?.category && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                    {docData.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 truncate m-0">
                Official Knowledge Base Source Reference
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {webUrl && (
              <a
                href={webUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition-colors"
              >
                <ExternalLink size={13} /> Original Link
              </a>
            )}
            {viewUrl && (
              <a
                href={viewUrl}
                target="_blank"
                download
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10b981] text-black text-xs font-bold hover:bg-[#059669] transition-colors"
              >
                <Download size={13} /> Download
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 bg-black/40 overflow-hidden relative flex flex-col justify-center items-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-zinc-400">
              <Loader2 size={32} className="animate-spin text-[#10b981]" />
              <span className="text-xs font-medium">Opening official document viewer...</span>
            </div>
          ) : textContent ? (
            <div className="w-full h-full p-6 overflow-y-auto text-xs sm:text-sm font-mono text-zinc-200 leading-relaxed whitespace-pre-wrap selection:bg-[#10b981]/30">
              {textContent}
            </div>
          ) : viewUrl ? (
            <div className="w-full h-full relative">
              <iframe
                src={pageNum ? `${viewUrl}#page=${pageNum}` : viewUrl}
                className="w-full h-full border-none bg-white/90"
                title={source.title}
              />
            </div>
          ) : (
            <div className="p-8 text-center max-w-md mx-auto flex flex-col items-center">
              <BookOpen size={40} className="text-zinc-500 mb-3" />
              <h4 className="text-base font-bold text-white mb-1">{docData?.title || source.title}</h4>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                This document is indexed in the campus AI RAG knowledge base.
                {pageNum ? ` Cited on page ${pageNum}.` : ""}
              </p>
              {webUrl ? (
                <a
                  href={webUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#10b981] text-black font-bold text-xs flex items-center gap-2 hover:bg-[#059669] transition-colors"
                >
                  <ExternalLink size={14} /> Open Source URL ({webUrl})
                </a>
              ) : (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-400">
                  Document text is active in the AI embedding index.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
