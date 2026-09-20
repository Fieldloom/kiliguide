"use client";
import { useEffect, useState, useRef } from "react";
import { X, ExternalLink, FileText, Download, Loader2, BookOpen, Search, Copy, Check } from "lucide-react";
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
  const [chunksText, setChunksText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "file">("text");
  const [searchFilter, setSearchFilter] = useState("");
  const [copied, setCopied] = useState(false);
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!source) return;
    let isMounted = true;
    setLoading(true);
    setDocData(null);
    setViewUrl(null);
    setChunksText(null);
    setActiveTab("text");

    const loadDocument = async () => {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }

        let doc: any = null;

        // 1. Fetch document metadata by document_id or title
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

          // 2. Fetch RAG text chunks for this document
          const { data: chunks } = await supabase
            .from("document_chunks")
            .select("content, page_number, chunk_index")
            .eq("document_id", doc.id)
            .order("chunk_index", { ascending: true });

          if (chunks && chunks.length > 0) {
            let combinedText = "";
            let lastPage: number | null = null;
            chunks.forEach(c => {
              if (c.page_number && c.page_number !== lastPage) {
                combinedText += `\n\n--- Page ${c.page_number} ---\n\n`;
                lastPage = c.page_number;
              }
              combinedText += c.content + "\n";
            });
            if (isMounted) setChunksText(combinedText.trim());
          }

          // 3. Generate signed URL for original storage file if exists
          if (doc.storage_path) {
            const { data: signedData } = await supabase.storage
              .from("documents")
              .createSignedUrl(doc.storage_path, 3600);

            if (signedData?.signedUrl) {
              if (isMounted) setViewUrl(signedData.signedUrl);

              if ((doc.file_type === "txt" || doc.storage_path.endsWith(".txt")) && !chunks?.length) {
                try {
                  const res = await fetch(signedData.signedUrl);
                  const txt = await res.text();
                  if (isMounted) setChunksText(txt);
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
        console.error("Document viewer load error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
    };
  }, [source]);

  // Scroll to cited page automatically if available
  useEffect(() => {
    if (pageRef.current && source?.page && chunksText) {
      setTimeout(() => {
        pageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [chunksText, source?.page]);

  if (!source) return null;

  const pageNum = source.page ?? docData?.metadata?.page_number;
  const webUrl = docData?.source_url || source.source_url;

  const handleCopyText = () => {
    if (!chunksText) return;
    navigator.clipboard.writeText(chunksText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[90vh] bg-[#0b1320] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.03]">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center flex-shrink-0 text-[#10b981]">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white truncate max-w-md m-0">
                  {docData?.title || source.title}
                </h3>
                {pageNum && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Cited Page {pageNum}
                  </span>
                )}
                {docData?.category && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                    {docData.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 truncate m-0">
                Official Knowledge Base Source Document
              </p>
            </div>
          </div>

          {/* Mode Tabs & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("text")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border-none cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "text"
                    ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                    : "text-zinc-400 hover:text-white bg-transparent"
                }`}
              >
                <BookOpen size={13} /> Text View
              </button>
              {viewUrl && (
                <button
                  onClick={() => setActiveTab("file")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border-none cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "file"
                      ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                      : "text-zinc-400 hover:text-white bg-transparent"
                  }`}
                >
                  <FileText size={13} /> Original File / PDF
                </button>
              )}
            </div>

            {webUrl && (
              <a
                href={webUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition-colors"
              >
                <ExternalLink size={13} /> Web Link
              </a>
            )}

            {viewUrl && (
              <a
                href={viewUrl}
                target="_blank"
                download
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#10b981] text-black text-xs font-bold hover:bg-[#059669] transition-colors"
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

        {/* Search Bar for Text Content */}
        {activeTab === "text" && chunksText && (
          <div className="px-5 py-2.5 bg-black/30 border-b border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 flex-1 max-w-md">
              <Search size={14} className="text-zinc-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search within this document..."
                className="bg-transparent border-none outline-none text-xs text-white w-full"
              />
              {searchFilter && (
                <button onClick={() => setSearchFilter("")} className="text-zinc-400 hover:text-white border-none bg-transparent cursor-pointer">
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 font-semibold cursor-pointer transition-colors"
            >
              {copied ? <Check size={13} className="text-[#10b981]" /> : <Copy size={13} />}
              {copied ? "Copied Text" : "Copy Text"}
            </button>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="flex-1 bg-black/50 overflow-hidden relative flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 size={32} className="animate-spin text-[#10b981]" />
              <span className="text-xs font-medium">Loading official document content...</span>
            </div>
          ) : activeTab === "text" ? (
            chunksText ? (
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                {chunksText.split(/\n\n--- Page (\d+) ---\n\n/).map((part, idx, arr) => {
                  if (idx % 2 === 1) return null;
                  const currentPageNum = idx > 0 ? parseInt(arr[idx - 1], 10) : null;
                  const textChunk = part;
                  const isCitedPage = pageNum && currentPageNum === pageNum;

                  if (searchFilter && !textChunk.toLowerCase().includes(searchFilter.toLowerCase())) {
                    return null;
                  }

                  return (
                    <div
                      key={idx}
                      ref={isCitedPage ? pageRef : null}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCitedPage
                          ? "bg-[#10b981]/10 border-[#10b981]/40 shadow-lg shadow-[#10b981]/10"
                          : "bg-white/[0.02] border-white/10"
                      }`}
                    >
                      {currentPageNum && (
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                          <span className={`text-xs font-extrabold uppercase tracking-wider ${isCitedPage ? "text-[#10b981]" : "text-zinc-400"}`}>
                            📄 Page {currentPageNum} {isCitedPage ? "★ Cited in Answer" : ""}
                          </span>
                        </div>
                      )}
                      <div className="text-xs sm:text-sm font-mono text-zinc-200 leading-relaxed whitespace-pre-wrap selection:bg-[#10b981]/30">
                        {textChunk}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                <BookOpen size={44} className="text-zinc-500 mb-3" />
                <h4 className="text-base font-bold text-white mb-1">{docData?.title || source.title}</h4>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  This document is indexed in the campus RAG knowledge base.
                  {pageNum ? ` Cited on page ${pageNum}.` : ""}
                </p>
                {viewUrl ? (
                  <button
                    onClick={() => setActiveTab("file")}
                    className="px-4 py-2.5 rounded-xl bg-[#10b981] text-black font-bold text-xs flex items-center gap-2 hover:bg-[#059669] transition-colors border-none cursor-pointer"
                  >
                    <FileText size={14} /> Switch to Original File View
                  </button>
                ) : webUrl ? (
                  <a
                    href={webUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#10b981] text-black font-bold text-xs flex items-center gap-2 hover:bg-[#059669] transition-colors"
                  >
                    <ExternalLink size={14} /> Open Source Web Link
                  </a>
                ) : null}
              </div>
            )
          ) : viewUrl ? (
            <div className="w-full h-full relative flex flex-col">
              <iframe
                src={pageNum ? `${viewUrl}#page=${pageNum}` : viewUrl}
                className="w-full h-full border-none bg-white"
                title={source.title}
              />
              <div className="p-3 bg-[#0b1320] border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>If the file preview does not display inside your browser iframe, use the download link:</span>
                <a
                  href={viewUrl}
                  target="_blank"
                  download
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-[#10b981] text-black font-bold text-xs hover:bg-[#059669] transition-colors"
                >
                  Download / Open Direct File
                </a>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
              <p className="text-xs text-zinc-400">Original file preview unavailable.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
