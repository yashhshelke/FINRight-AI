import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/finexa/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff, Check, Loader2, LogOut, Download } from "lucide-react";
import { useState } from "react";
import { SettingsAPI } from "@/lib/api/settings";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-full"],
    queryFn: () => SettingsAPI.getFullProfile(),
    staleTime: 5 * 60 * 1000,
  });

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [income, setIncome] = useState(user?.income ? String(user.income) : "");
  const [profileSaving, setProfileSaving] = useState(false);

  async function handleSaveProfile() {
    setProfileSaving(true);
    try {
      const { AuthAPI } = await import("@/lib/api/auth");
      await AuthAPI.updateProfile({ first_name: firstName, last_name: lastName, income: +income });
      await refreshUser();
    } catch { /* silent */ }
    finally { setProfileSaving(false); }
  }

  async function handleChangePassword() {
    if (!oldPw || !newPw) return;
    setPwLoading(true);
    setPwMsg(null);
    try {
      await SettingsAPI.changePassword({ old_password: oldPw, new_password: newPw, new_password_confirm: newPw });
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setOldPw(""); setNewPw("");
    } catch (e: any) {
      setPwMsg({ type: "error", text: e.message || "Failed to change password." });
    } finally {
      setPwLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const data = await SettingsAPI.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "finexa-data.json"; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    finally { setExporting(false); }
  }

  function handleLogout() { logout(); navigate({ to: "/auth/login" }); }

  const displayName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "User" : "User";
  const initials = displayName.charAt(0).toUpperCase();
  const credits = profile?.financial_summary?.ai_credits ?? user?.ai_credits ?? 0;

  return (
    <>
      <PageHeader title="Settings" subtitle="Make Finexa yours." />

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i}><Skeleton className="h-48 w-full" /></Card>)}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Profile */}
          <Card>
            <div className="text-display text-lg mb-4">Profile</div>
            <div className="flex items-center gap-4 mb-5">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-light to-brand grid place-items-center text-background text-2xl font-bold">
                {initials}
              </div>
              <div>
                <div className="font-medium">{displayName}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
                <div className="text-xs text-brand-light mt-0.5">{credits.toLocaleString()} AI credits</div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">First name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Monthly income (₹)</label>
                <input
                  type="number"
                  value={income}
                  min={0}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <input
                  value={user?.email || ""}
                  readOnly
                  className="w-full rounded-lg border border-border bg-surface/30 px-3 py-2 text-sm outline-none text-muted-foreground"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="w-full rounded-lg bg-cta py-2 text-sm font-medium text-cta-foreground disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {profileSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Save profile</>}
              </button>
            </div>
          </Card>

          {/* Security */}
          <Card>
            <div className="text-display text-lg mb-4">Security</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Current password</label>
                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPw}
                    onChange={(e) => setOldPw(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 pr-9 text-sm outline-none"
                  />
                  <button onClick={() => setShowOld(!showOld)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">New password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2 pr-9 text-sm outline-none"
                  />
                  <button onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {pwMsg && (
                <div className={`rounded-lg px-3 py-2 text-xs border ${pwMsg.type === "success" ? "border-success/30 bg-success/10 text-success" : "border-error/30 bg-error/10 text-error"}`}>
                  {pwMsg.text}
                </div>
              )}
              <button
                onClick={handleChangePassword}
                disabled={pwLoading || !oldPw || !newPw}
                className="w-full rounded-lg bg-foreground py-2 text-sm font-medium text-background disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pwLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Update password"}
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-border space-y-3">
              <div className="text-display text-lg mb-3">Data & privacy</div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3 text-sm text-left hover:bg-surface/60 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting…" : "Export all data (JSON)"}
              </button>
            </div>
          </Card>

          {/* Account */}
          <Card>
            <div className="text-display text-lg mb-4">Account</div>
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-surface/40 p-3 text-sm">
                <div className="text-xs text-muted-foreground mb-0.5">Username</div>
                <div>{user?.username || "—"}</div>
              </div>
              <div className="rounded-lg border border-border bg-surface/40 p-3 text-sm">
                <div className="text-xs text-muted-foreground mb-0.5">Account ID</div>
                <div className="font-mono text-xs">{user?.id || "—"}</div>
              </div>
              <div className="rounded-lg border border-border bg-surface/40 p-3 text-sm">
                <div className="text-xs text-muted-foreground mb-0.5">AI Credits</div>
                <div className="text-brand-light font-medium">{credits.toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-error/30 bg-error/10 py-2.5 text-sm text-error hover:bg-error/20 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
