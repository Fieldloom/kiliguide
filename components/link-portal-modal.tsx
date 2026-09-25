"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, CheckCircle2, X, Loader2, Building2, ExternalLink, RefreshCw, KeyRound, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { encryptPortalPassword } from "../lib/encryption";

interface LinkPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  institutionId?: string;
  institutionName?: string;
  onSuccess?: () => void;
}

export function LinkPortalModal({
  isOpen,
  onClose,
  userId,
  institutionId,
  institutionName = "DeKUT Student Portal",
  onSuccess
}: LinkPortalModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [updatedUsername, setUpdatedUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [linkedAccount, setLinkedAccount] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen || !supabase || !userId) return;
    const client = supabase;

    const fetchLinked = async () => {
      const { data } = await client
        .from("linked_student_accounts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setLinkedAccount(data);
        setUsername(data.portal_username || "");
        setUpdatedUsername(data.portal_username || "");
      } else {
        setLinkedAccount(null);
      }
    };

    fetchLinked();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !userId || !username.trim() || !password.trim()) {
      setErrorMsg("Please enter both your Student Registration Number/Email and Portal Password.");
      return;
    }
    const client = supabase;

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Encrypt password client-side using AES-256-GCM
      const { cipherText, iv } = await encryptPortalPassword(password.trim());

      const targetInstId = institutionId || "00000000-0000-0000-0000-000000000001";

      const payload = {
        user_id: userId,
        institution_id: targetInstId,
        portal_username: username.trim(),
        encrypted_password: cipherText,
        encryption_iv: iv,
        is_verified: true,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await client
        .from("linked_student_accounts")
        .upsert(payload, { onConflict: "user_id,institution_id" })
        .select()
        .single();

      if (error) throw error;

      setLinkedAccount(data);
      setSuccessMsg("✓ Student portal credentials linked & encrypted successfully!");
      setPassword("");
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error("Error linking portal account:", err);
      setErrorMsg("Failed to link portal account: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !userId || !newPassword.trim()) {
      setErrorMsg("Please enter a new password to update.");
      return;
    }
    const client = supabase;

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { cipherText, iv } = await encryptPortalPassword(newPassword.trim());
      const targetInstId = institutionId || "00000000-0000-0000-0000-000000000001";

      const payload = {
        user_id: userId,
        institution_id: targetInstId,
        portal_username: (updatedUsername || username).trim(),
        encrypted_password: cipherText,
        encryption_iv: iv,
        encrypted_session_cookies: null, // Invalidate old session cache
        session_expires_at: null,
        is_verified: true,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await client
        .from("linked_student_accounts")
        .upsert(payload, { onConflict: "user_id,institution_id" })
        .select()
        .single();

      if (error) throw error;

      setLinkedAccount(data);
      setUsername(data.portal_username);
      setSuccessMsg("✓ Student portal password updated & re-encrypted successfully!");
      setNewPassword("");
      setIsUpdatingPassword(false);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error("Error updating portal password:", err);
      setErrorMsg("Failed to update password: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async () => {
    if (!supabase || !linkedAccount) return;
    const client = supabase;
    if (!confirm("Are you sure you want to unlink your university portal account? KiliGuide will no longer be able to fetch live fee statements or unit registration data for you.")) return;

    setUnlinking(true);
    try {
      await client.from("linked_student_accounts").delete().eq("id", linkedAccount.id);
      setLinkedAccount(null);
      setUsername("");
      setPassword("");
      setIsUpdatingPassword(false);
      setSuccessMsg("Portal account unlinked.");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg("Failed to unlink: " + err.message);
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 max-w-lg w-full bg-zinc-950/95 shadow-2xl relative overflow-hidden"
        >
          {/* Top Decorative Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 grid place-items-center text-[#10b981]">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white m-0">Link University Account</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-400 block">{institutionName}</span>
                  <a
                    href="https://portal.dkut.ac.ke/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#10b981] hover:underline flex items-center gap-0.5 font-mono"
                  >
                    https://portal.dkut.ac.ke/ <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-white bg-transparent border-none cursor-pointer p-1">
              <X size={20} />
            </button>
          </div>

          {/* Security Trust Badge */}
          <div className="bg-[#10b981]/10 border border-[#10b981]/25 p-3.5 rounded-2xl mb-6 flex items-start gap-3 text-xs text-zinc-300">
            <ShieldCheck size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">AES-256 Military-Grade Vault Security</span>
              <span>
                Your portal password is encrypted client-side with AES-256-GCM before storage. Plaintext credentials are never readable by staff or administrators.
              </span>
            </div>
          </div>

          {linkedAccount ? (
            <div className="flex flex-col gap-4">
              <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-zinc-400 block">Linked Student Reg / Email</span>
                  <span className="text-sm font-bold text-white block mt-0.5">{linkedAccount.portal_username}</span>
                  <span className="text-[10px] text-[#10b981] flex items-center gap-1 mt-1 font-semibold">
                    <CheckCircle2 size={12} /> Active Sync Ready
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpdatingPassword(!isUpdatingPassword);
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <KeyRound size={13} className="text-[#10b981]" />
                    {isUpdatingPassword ? "Cancel" : "Update Password"}
                  </button>
                  <button
                    onClick={handleUnlink}
                    disabled={unlinking}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {unlinking ? <Loader2 size={14} className="animate-spin" /> : "Unlink"}
                  </button>
                </div>
              </div>

              {isUpdatingPassword ? (
                <form onSubmit={handleUpdateCredentials} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <KeyRound size={15} className="text-[#10b981]" />
                    <span>Update Student Portal Password</span>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-[11px] text-amber-200/90 flex items-start gap-2">
                    <Lock size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Existing passwords are vault-encrypted and cannot be previewed. Enter your new password below to update your saved credentials.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-semibold mb-1 block">
                      Student Reg Number / Portal Email
                    </label>
                    <input
                      type="text"
                      value={updatedUsername}
                      onChange={(e) => setUpdatedUsername(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none focus:border-[#10b981]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-semibold mb-1 block">
                      New Portal Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new portal password..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none focus:border-[#10b981]"
                    />
                  </div>

                  {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="bg-[#10b981]/15 border border-[#10b981]/30 p-2.5 rounded-xl text-[#10b981] text-xs flex items-center gap-2 font-semibold">
                      <CheckCircle2 size={14} />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsUpdatingPassword(false)}
                      className="px-3 py-2 rounded-xl border border-white/10 text-zinc-400 text-xs font-semibold hover:bg-white/5 cursor-pointer bg-transparent"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !newPassword.trim()}
                      className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors border-none"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                      <span>{saving ? "Encrypting..." : "Save New Password"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle size={15} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="bg-[#10b981]/15 border border-[#10b981]/30 p-3 rounded-xl text-[#10b981] text-xs flex items-center gap-2 font-semibold">
                      <CheckCircle2 size={15} />
                      <span>{successMsg}</span>
                    </div>
                  )}
                </>
              )}

              <div className="pt-2 border-t border-white/5 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#10b981] text-black font-bold text-xs cursor-pointer hover:bg-[#059669] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-zinc-400 font-semibold mb-1.5 block">
                  REG NO / Student Registration Number
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. A000-00-0000/2026 or C025-01-0987/2023"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs sm:text-sm outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold mb-1.5 block flex items-center gap-1">
                  <KeyRound size={13} className="text-[#10b981]" /> Portal Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your student portal password..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs sm:text-sm outline-none focus:border-[#10b981]"
                />
              </div>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-[#10b981]/15 border border-[#10b981]/30 p-3 rounded-xl text-[#10b981] text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle2 size={15} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-xs font-semibold hover:bg-white/5 cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !username.trim() || !password.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg transition-colors border-none"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                  <span>{saving ? "Encrypting & Linking..." : "Encrypt & Link Account"}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
