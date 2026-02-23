"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { AdminRoute } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { difficultyLabels, trackLabels } from "@/lib/constants";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Layers,
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

const statusIcons: Record<string, typeof Clock> = {
  draft: Layers,
  pending_review: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

const tabs = [
  { value: "pending_review", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export default function AdminCoursesPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "pending_review";
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/courses?status=${status}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const { courses: data } = await res.json();
        setCourses(data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses(activeTab);
  }, [activeTab, fetchCourses]);

  return (
    <AdminRoute>
      <PlatformLayout>
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Admin
              </Link>
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Course Review</h1>
            <p className="text-muted-foreground mt-1">Review and manage submitted courses</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {tabs.map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "default" : "outline"}
                size="sm"
                className="h-9"
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Course list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No courses found</p>
              <p className="text-sm">No courses with status &quot;{statusLabels[activeTab] ?? activeTab}&quot;</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                const Icon = statusIcons[course.status] ?? Clock;
                return (
                  <Link
                    key={course._id}
                    href={`/admin/courses/${course._id}`}
                    className="flex items-center justify-between rounded-xl border bg-card p-5 hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <h3 className="font-semibold truncate">{course.title}</h3>
                        <Badge className={statusColors[course.status] ?? ""}>
                          {statusLabels[course.status] ?? course.status}
                        </Badge>
                        {course.difficulty && (
                          <Badge variant="outline" className="text-xs">
                            {difficultyLabels[course.difficulty] ?? `Level ${course.difficulty}`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {course.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>By {course.creator?.slice(0, 8)}...</span>
                        {course.trackId && <span>{trackLabels[course.trackId] ?? `Track ${course.trackId}`}</span>}
                        <span>{course.lessonCount ?? 0} lessons</span>
                        {course.submittedAt && (
                          <span>Submitted {new Date(course.submittedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 ml-4" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </PlatformLayout>
    </AdminRoute>
  );
}
