"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  UploadCloud, 
  Plus, 
  X, 
  FileCode, 
  CheckCircle2, 
  Clock, 
  User, 
  Building2, 
  Sparkles, 
  Trash2, 
  AlertCircle, 
  File as FileIcon, 
  Loader2, 
  Check, 
  Tag, 
  Calendar, 
  BookMarked,
  ArrowDownToLine
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { AcademicResourceViewerModal } from "./academic-resource-viewer-modal";
import { getTranslation } from "../lib/translations";

export interface AcademicResource {
  id: string;
  institution_id?: string | null;
  department_id?: string | null;
  title: string;
  course_code: string;
  course_name?: string;
  academic_year: string; // e.g. "Year 1", "Year 2", "Year 3", "Year 4", "Postgraduate"
  semester: string; // e.g. "Semester 1", "Semester 2"
  resource_type: "past_paper" | "lecture_note" | "course_material" | "study_guide" | "syllabus";
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  description?: string;
  download_count?: number;
  uploaded_by?: string | null;
  uploader_name?: string;
  created_at: string;
}

const DEFAULT_SAMPLE_RESOURCES: AcademicResource[] = [];

interface AcademicResourcesModuleProps {
  userRole?: string;
  userInstitutionId?: string;
  userName?: string;
  language?: string;
}

export function AcademicResourcesModule({
  userRole = "student",
  userInstitutionId,
  userName = "User",
  language = "en"
}: AcademicResourcesModuleProps) {
  const tr = getTranslation(language);
  const resourceTypesList = [
    { id: "all", label: tr.all_categories, icon: BookOpen, color: "from-blue-500 to-indigo-600" },
    { id: "past_paper", label: tr.cat_past_papers, icon: GraduationCap, color: "from-purple-500 to-pink-600" },
    { id: "lecture_note", label: tr.cat_lecture_notes, icon: FileText, color: "from-emerald-500 to-teal-600" },
    { id: "course_material", label: tr.cat_course_outlines, icon: BookMarked, color: "from-amber-500 to-orange-600" },
    { id: "study_guide", label: tr.cat_revision_guides, icon: Sparkles, color: "from-sky-500 to-cyan-600" },
  ];
  const canUpload = userRole === "lecturer" || userRole === "administrator" || userRole === "department" || userRole === "super_admin";
  
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  
  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewResource, setPreviewResource] = useState<AcademicResource | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCourseCode, setUploadCourseCode] = useState("");
  const [uploadCourseName, setUploadCourseName] = useState("");
  const [uploadType, setUploadType] = useState<AcademicResource["resource_type"]>("lecture_note");
  const [uploadYear, setUploadYear] = useState("Year 1");
  const [uploadSemester, setUploadSemester] = useState("Semester 1");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [uploadErrorMsg, setUploadErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResources();
  }, [userInstitutionId]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      if (supabase) {
        // Fetch all published academic resources (uploaded by dept admins, lecturers, and admins)
        const { data: resData, error: resErr } = await supabase
          .from("academic_resources")
          .select("*")
          .order("created_at", { ascending: false });

        if (!resErr && resData) {
          // Filter out any invalid blob URLs from display
          const validData = resData.filter(r => r && r.file_url && !r.file_url.startsWith("blob:"));
          setResources(validData);
          try {
            localStorage.setItem("kiliguide_academic_resources_cache", JSON.stringify(validData));
          } catch (_) {}
          setLoading(false);
          return;
        } else if (resErr) {
          console.error("Error fetching academic resources from Supabase:", resErr);
        }
      }
    } catch (err) {
      console.warn("Could not fetch academic resources from Supabase:", err);
    }

    // Fallback to cached data if Supabase connection fails
    try {
      const cached = localStorage.getItem("kiliguide_academic_resources_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter((r: any) => r && r.id && !String(r.id).startsWith("sample-") && !String(r.file_url).startsWith("blob:"));
          setResources(realOnly);
          setLoading(false);
          return;
        }
      }
    } catch (_) {}

    setResources([]);
    setLoading(false);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadCourseCode.trim() || !uploadFile) {
      setUploadErrorMsg("Please provide title, course code, and select a file.");
      return;
    }

    setIsSubmitting(true);
    setUploadErrorMsg("");
    setUploadSuccessMsg("");

    let fileUrl = "";
    let fileName = uploadFile.name;
    let fileSize = uploadFile.size;
    let fileType = uploadFile.name.split(".").pop() || "pdf";

    try {
      if (!supabase) {
        setIsSubmitting(false);
        setUploadErrorMsg("Supabase client is not available.");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      const fileExt = uploadFile.name.split(".").pop();
      const filePath = `${uploadCourseCode.replace(/\s+/g, "_")}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // 1. Upload file to Supabase Storage
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("academic_resources")
        .upload(filePath, uploadFile, {
          cacheControl: "3600",
          upsert: true
        });

      if (uploadErr) {
        console.error("Storage upload error:", uploadErr);
        setIsSubmitting(false);
        setUploadErrorMsg(`Storage Upload Failed: ${uploadErr.message || "Permission denied or storage error."}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("academic_resources")
        .getPublicUrl(filePath);

      fileUrl = publicUrlData.publicUrl;

      if (!fileUrl || fileUrl.startsWith("blob:")) {
        setIsSubmitting(false);
        setUploadErrorMsg("Failed to obtain a public URL for the uploaded document.");
        return;
      }

      // 2. Insert record into database table
      const { data: inserted, error: insertErr } = await supabase
        .from("academic_resources")
        .insert([
          {
            institution_id: userInstitutionId || null,
            title: uploadTitle.trim(),
            course_code: uploadCourseCode.trim().toUpperCase(),
            course_name: uploadCourseName.trim(),
            academic_year: uploadYear,
            semester: uploadSemester,
            resource_type: uploadType,
            file_url: fileUrl,
            file_name: fileName,
            file_size: fileSize,
            file_type: fileType,
            description: uploadDescription.trim(),
            uploader_name: userName,
            uploaded_by: userId
          }
        ])
        .select();

      if (insertErr) {
        console.error("Database insert error:", insertErr);
        setIsSubmitting(false);
        setUploadErrorMsg(`Database Error: ${insertErr.message || "Failed to save resource info to database."}`);
        return;
      }

      // 3. Re-fetch from database to ensure fresh state across all clients
      await fetchResources();

      setIsSubmitting(false);
      setUploadSuccessMsg("Academic resource uploaded and published successfully!");
      
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadTitle("");
        setUploadCourseCode("");
        setUploadCourseName("");
        setUploadDescription("");
        setUploadFile(null);
        setUploadSuccessMsg("");
      }, 1200);

    } catch (err: any) {
      console.error("Unexpected upload error:", err);
      setIsSubmitting(false);
      setUploadErrorMsg(`Upload Error: ${err.message || "An unexpected error occurred."}`);
    }
  };

  const handleDownload = async (resource: AcademicResource) => {
    // Increment download count locally & in DB
    const updated = resources.map(r => r.id === resource.id ? { ...r, download_count: (r.download_count || 0) + 1 } : r);
    setResources(updated);
    try {
      localStorage.setItem("kiliguide_academic_resources_cache", JSON.stringify(updated));
      if (supabase && !resource.id.startsWith("sample-")) {
        await supabase
          .from("academic_resources")
          .update({ download_count: (resource.download_count || 0) + 1 })
          .eq("id", resource.id);
      }
    } catch (_) {}

    // Trigger file download
    const link = document.createElement("a");
    link.href = resource.file_url;
    link.download = resource.file_name || `${resource.course_code}_${resource.title}.${resource.file_type || "pdf"}`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to remove this academic resource?")) return;

    const filtered = resources.filter(r => r.id !== id);
    setResources(filtered);
    try {
      localStorage.setItem("kiliguide_academic_resources_cache", JSON.stringify(filtered));
      if (supabase && !id.startsWith("sample-")) {
        await supabase.from("academic_resources").delete().eq("id", id);
      }
    } catch (_) {}
  };

  // Filtered resources calculation
  const filteredResources = resources.filter(res => {
    const matchesSearch = 
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.course_name && res.course_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (res.description && res.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === "all" || res.resource_type === selectedType;
    const matchesYear = selectedYear === "all" || res.academic_year === selectedYear;
    const matchesSemester = selectedSemester === "all" || res.semester === selectedSemester;

    return matchesSearch && matchesType && matchesYear && matchesSemester;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "PDF Doc";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getResourceTypeBadge = (type: AcademicResource["resource_type"]) => {
    switch (type) {
      case "past_paper":
        return { label: "Past Paper", bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" };
      case "lecture_note":
        return { label: "Lecture Note", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
      case "course_material":
        return { label: "Course Material", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
      case "study_guide":
        return { label: "Study Guide", bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" };
      case "syllabus":
        return { label: "Syllabus", bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" };
      default:
        return { label: "Document", bg: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide text-blue-100 uppercase">
              <GraduationCap className="w-4 h-4" /> {tr.academic_resources_title}
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              {tr.academic_resources_title}
            </h1>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed">
              {tr.academic_resources_subtitle}
            </p>
          </div>

          {canUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-700 font-bold shadow-lg hover:bg-blue-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm shrink-0"
            >
              <Plus className="w-5 h-5" />
              {tr.upload_resource}
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-4 bg-white dark:bg-gray-900 p-4 md:p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
        {/* Search input */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr.search_resources}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Resource Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {resourceTypesList.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Sub-Filters: Year & Semester */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs md:text-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
            <Filter className="w-4 h-4" /> Filter by:
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Academic Years</option>
            <option value="Year 1">Year 1</option>
            <option value="Year 2">Year 2</option>
            <option value="Year 3">Year 3</option>
            <option value="Year 4">Year 4</option>
            <option value="Postgraduate">Postgraduate</option>
          </select>

          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Semesters</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
            <option value="Trimester 3">Trimester 3</option>
          </select>

          {(selectedType !== "all" || selectedYear !== "all" || selectedSemester !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedType("all");
                setSelectedYear("all");
                setSelectedSemester("all");
                setSearchQuery("");
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Resource Count Summary */}
      <div className="flex items-center justify-between px-1 text-sm text-gray-500 dark:text-gray-400">
        <div>
          Showing <span className="font-bold text-gray-800 dark:text-gray-200">{filteredResources.length}</span> {filteredResources.length === 1 ? "resource" : "resources"}
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" /> Syncing library...
          </div>
        )}
      </div>

      {/* Resource Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((res) => {
            const badge = getResourceTypeBadge(res.resource_type);
            return (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative flex flex-col justify-between bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all duration-300"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {res.course_code}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                    {res.title}
                  </h3>

                  {res.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                      {res.description}
                    </p>
                  )}

                  {/* Details metadata */}
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-gray-500 dark:text-gray-400 mb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-gray-400" /> {res.academic_year} • {res.semester}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileIcon className="w-3.5 h-3.5 text-gray-400" /> {formatFileSize(res.file_size)}
                    </span>
                    {res.uploader_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" /> {res.uploader_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>{res.download_count || 0} downloads</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewResource(res)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>

                    <button
                      onClick={() => handleDownload(res)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      title="Download Resource"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>

                    {canUpload && (
                      <button
                        onClick={() => handleDeleteResource(res.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                        title="Delete resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Academic Resources Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
            We couldn't find any course materials matching your current filters or search terms.
          </p>
          {canUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Upload First Resource
            </button>
          )}
        </div>
      )}

      {/* Upload Resource Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-200 dark:border-gray-800 overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Academic Resource</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Share course notes, past papers, or study materials for students.</p>
                </div>
              </div>

              {uploadErrorMsg && (
                <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {uploadErrorMsg}
                </div>
              )}

              {uploadSuccessMsg && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {uploadSuccessMsg}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Resource Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. CCS 3105 Main Exam Past Paper 2024"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Course Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadCourseCode}
                      onChange={(e) => setUploadCourseCode(e.target.value)}
                      placeholder="e.g. CCS 3105"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Course Name
                    </label>
                    <input
                      type="text"
                      value={uploadCourseName}
                      onChange={(e) => setUploadCourseName(e.target.value)}
                      placeholder="e.g. Data Structures & Algorithms"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Category *
                    </label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="past_paper">Past Paper</option>
                      <option value="lecture_note">Lecture Note</option>
                      <option value="course_material">Course Material</option>
                      <option value="study_guide">Study Guide</option>
                      <option value="syllabus">Syllabus</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Academic Year
                    </label>
                    <select
                      value={uploadYear}
                      onChange={(e) => setUploadYear(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Year 1">Year 1</option>
                      <option value="Year 2">Year 2</option>
                      <option value="Year 3">Year 3</option>
                      <option value="Year 4">Year 4</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Semester
                    </label>
                    <select
                      value={uploadSemester}
                      onChange={(e) => setUploadSemester(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Trimester 3">Trimester 3</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Description / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Brief summary of what this document covers..."
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* File Dropzone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Document File (PDF, DOCX, PPTX) *
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      uploadFile
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : "border-gray-300 dark:border-gray-700 hover:border-blue-500 bg-gray-50 dark:bg-gray-800/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-3 text-emerald-600 dark:text-emerald-400">
                        <FileText className="w-8 h-8 shrink-0" />
                        <div className="text-left">
                          <p className="font-bold text-sm truncate max-w-xs">{uploadFile.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(uploadFile.size)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <UploadCloud className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Click to upload file
                        </p>
                        <p className="text-xs text-gray-400">Supports PDF, DOCX, PPTX up to 50MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                      </>
                    ) : (
                      "Publish Resource"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Viewer Modal */}
      {previewResource && (
        <AcademicResourceViewerModal
          resource={previewResource}
          onClose={() => setPreviewResource(null)}
          onDownload={(res) => handleDownload(res)}
        />
      )}
    </div>
  );
}
