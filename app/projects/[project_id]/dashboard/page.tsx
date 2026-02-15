"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getObservabilityStats,
  getReviewQueueStats,
  getAuditLogs,
  type ObservabilityStats,
  type ReviewQueueStats,
  type AuditLog,
} from "@/lib/api";
import { format } from "date-fns";

export default function DashboardPage() {
  const params = useParams();
  const projectId = params.project_id as string;

  const [obsStats, setObsStats] = useState<ObservabilityStats | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewQueueStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [obs, review, activity] = await Promise.all([
        getObservabilityStats(projectId, ""),
        getReviewQueueStats(projectId),
        getAuditLogs(projectId, 0, 5),
      ]);
      setObsStats(obs);
      setReviewStats(review);
      setRecentActivity(activity);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Overview of your project&apos;s key metrics.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Total Requests
          </div>
          <div className="text-4xl font-bold text-foreground mt-3">
            {obsStats?.total_requests ?? 0}
          </div>
        </Card>

        <Card className="p-8">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Success Rate
          </div>
          <div className="text-4xl font-bold text-foreground mt-3">
            {obsStats?.success_rate?.toFixed(1) ?? 0}%
          </div>
        </Card>

        <Card className="p-8">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Total Cost
          </div>
          <div className="text-4xl font-bold text-foreground mt-3">
            ${obsStats?.total_cost?.toFixed(4) ?? "0.0000"}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-8">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Avg Latency
          </div>
          <div className="text-4xl font-bold text-foreground mt-3">
            {obsStats?.avg_latency_ms
              ? `${(obsStats.avg_latency_ms / 1000).toFixed(2)}s`
              : "0s"}
          </div>
        </Card>

        <Card className="p-8">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Pending Reviews
          </div>
          <div className="text-4xl font-bold text-foreground mt-3">
            {reviewStats?.pending ?? 0}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No recent activity
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm font-mono whitespace-nowrap">
                    {format(new Date(log.created_at), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.user_email || log.user_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {log.description || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
