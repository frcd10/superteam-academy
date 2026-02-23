"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { AdminRoute } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  ShieldCheck,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  FileText,
} from "lucide-react";

interface CourseSummary {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: number;
  trackId: number;
  lessonCount: number;
  status: string;
  submittedAt: string | null;
  creator: string;
  thumbnailUrl: string | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  pending_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function AdminPage() {
  const [pending, setPending] = useState<CourseSummary[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [pendingRes, allRes] = await Promise.all([
        fetch("/api/admin/courses?status=pending_review", { headers }),
        fetch("/api/admin/courses?status=all", { headers }),
      ]);

      if (pendingRes.ok) {
        const { courses } = await pendingRes.json();
        setPending(courses ?? []);
      }

      if (allRes.ok) {
        const { courses } = await allRes.json();
        const all = courses ?? [];
        setStats({
          pending: all.filter((c: CourseSummary) => c.status === "pending_review").length,
          approved: all.filter((c: CourseSummary) => c.status === "approved").length,
          rejected: all.filter((c: CourseSummary) => c.status === "rejected").length,
          total: all.length,
        });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AdminRoute>
      <PlatformLayout>
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage courses and platform content</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[
              { label: "Total Courses", value: stats.total, icon: BookOpen, color: "text-primary" },
              { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-amber-500" },
              { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-500" },
              { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-500" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{s.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex gap-3 mb-8">
            <Button asChild>
              <Link href="/admin/courses">
                <FileText className="h-4 w-4 mr-2" />
                Review Queue
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/courses?status=all">
                <BookOpen className="h-4 w-4 mr-2" />
                All Courses
              </Link>
            </Button>
          </div>

          {/* Pending courses */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Review</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : pending.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                No courses pending review
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((course) => (
                  <Link
                    key={course._id}
                    href={`/admin/courses/${course._id}`}
                    className="flex items-center justify-between rounded-xl border bg-card p-5 hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{course.title}</h3>
                        <Badge className={statusColors[course.status] ?? ""}>
                          {statusLabels[course.status] ?? course.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {course.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {course.creator?.slice(0, 8)}...
                        {course.submittedAt && ` · Submitted ${new Date(course.submittedAt).toLocaleDateString()}`}
                        {` · ${course.lessonCount ?? 0} lessons`}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </PlatformLayout>
    </AdminRoute>
  );
}
