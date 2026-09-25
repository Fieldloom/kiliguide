"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Printer, 
  BookOpen, 
  GraduationCap, 
  Tag, 
  Calendar, 
  User, 
  CheckCircle2, 
  Share2, 
  Maximize2,
  FileIcon,
  AlertCircle
} from "lucide-react";
import { AcademicResource } from "./academic-resources-module";

interface AcademicResourceViewerModalProps {
  resource: AcademicResource | null;
  onClose: () => void;
  onDownload?: (resource: AcademicResource) => void;
}

export function AcademicResourceViewerModal({
  resource,
  onClose,
  onDownload
}: AcademicResourceViewerModalProps) {
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (resource) {
      setLoading(true);
      setZoomLevel(100);
      setIframeError(false);
      
      // Auto-focus ESC key handler
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [resource]);

  if (!resource) return null;

  const isPdf = resource.file_type === "pdf" || resource.file_url.toLowerCase().includes(".pdf") || resource.file_name.toLowerCase().endsWith(".pdf");
  const isImage = ["png", "jpg", "jpeg", "webp", "svg"].some(ext => resource.file_type === ext || resource.file_url.toLowerCase().includes(`.${ext}`) || resource.file_name.toLowerCase().endsWith(`.${ext}`));

  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(resource.file_url)}&embedded=true`;

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload(resource);
    } else {
      const link = document.createElement("a");
      link.href = resource.file_url;
      link.download = resource.file_name || `${resource.course_code}_${resource.title}.${resource.file_type || "pdf"}`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(resource.file_url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Document File";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative flex flex-col bg-gray-900 text-white rounded-3xl shadow-2xl border border-gray-800 overflow-hidden transition-all duration-300 ${
            isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[92vh]"
          }`}
        >
          {/* Top Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 bg-gray-950/90 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {resource.course_code}
                  </span>
                  <span className="text-xs text-gray-400 uppercase font-semibold">
                    {resource.resource_type.replace("_", " ")}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xl">
                  {resource.title}
                </h2>
              </div>
            </div>

            {/* Viewer Toolbar Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Zoom controls for PDFs or Images */}
              {(isPdf || isImage) && (
                <div className="hidden sm:flex items-center gap-1 bg-gray-800/80 p-1 rounded-xl border border-gray-700">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(prev - 25, 50))}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono px-2 text-gray-300">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(prev + 25, 200))}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors"
                title="Copy Resource Link"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>

              <a
                href={resource.file_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors"
                title="Open in New Window"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={handleDownloadClick}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all"
                title="Download file to device"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-gray-800 hover:bg-red-950/80 hover:text-red-400 text-gray-400 border border-gray-700 transition-colors"
                title="Close viewer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Viewer Body */}
          <div className="relative flex-1 bg-gray-950 overflow-hidden flex items-center justify-center p-2 sm:p-4">
            {loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950/90 gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs text-gray-400">Loading document viewer...</p>
              </div>
            )}

            <div 
              className="w-full h-full flex items-center justify-center overflow-auto rounded-2xl bg-gray-900 border border-gray-800 transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
            >
              {isImage ? (
                <img
                  src={resource.file_url}
                  alt={resource.title}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setIframeError(true);
                  }}
                  className="max-w-full max-h-full object-contain rounded-xl p-2"
                />
              ) : isPdf ? (
                <iframe
                  src={`${resource.file_url}#toolbar=1&navpanes=1`}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setIframeError(true);
                  }}
                  className="w-full h-full border-none rounded-2xl"
                  title={resource.title}
                />
              ) : (
                /* Fallback for Word DOCX, PPTX slides, text files using Google Docs Viewer */
                <iframe
                  src={googleDocsViewerUrl}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setIframeError(true);
                  }}
                  className="w-full h-full border-none rounded-2xl"
                  title={resource.title}
                />
              )}

              {/* If iframe preview fails or blocked */}
              {iframeError && (
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-md gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Preview Unavailable</h3>
                    <p className="text-xs text-gray-400">
                      Your browser blocks inline preview for this file type, or the document requires direct download.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadClick}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition-all"
                  >
                    <Download className="w-4 h-4" /> Download File Directly ({formatFileSize(resource.file_size)})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Information Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5 bg-gray-950 border-t border-gray-800 shrink-0 text-xs text-gray-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-gray-300">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                {resource.academic_year} • {resource.semester}
              </span>
              <span className="flex items-center gap-1.5">
                <FileIcon className="w-3.5 h-3.5 text-gray-500" />
                {formatFileSize(resource.file_size)}
              </span>
              {resource.uploader_name && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  Uploaded by {resource.uploader_name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span>{resource.download_count || 0} total downloads</span>
              <button
                onClick={handleDownloadClick}
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
              >
                Save Copy
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
