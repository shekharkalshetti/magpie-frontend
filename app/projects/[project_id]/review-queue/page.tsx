"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getReviewQueueItems,
  getReviewQueueStats,
  getReviewQueueItem,
  updateReviewQueueItem,
  type ReviewQueueItem,
  type ReviewQueueStats,
} from "@/lib/api";

export default function ReviewQueuePage() {
  const params = useParams();
  const projectId = params.project_id as string;

  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [stats, setStats] = useState<ReviewQueueStats | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, [projectId, activeStatus, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, statsData] = await Promise.all([
        getReviewQueueItems(
          projectId,
          activeStatus,
          (currentPage - 1) * itemsPerPage,
          itemsPerPage
        ),
        getReviewQueueStats(projectId),
      ]);
      setItems(itemsData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load review queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (item: ReviewQueueItem) => {
    try {
      const fullItem = await getReviewQueueItem(item.id);
      setSelectedItem(fullItem);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load item details:", error);
    }
  };

  const handleStatusUpdate = async (
    status: "approved" | "rejected",
    notes?: string
  ) => {
    if (!selectedItem) return;
    try {
      await updateReviewQueueItem(selectedItem.id, status, notes);
      setIsDialogOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline" | "critical" | "high" | "medium" | "low"
    > = {
      low: "low",
      medium: "medium",
      high: "high",
      critical: "critical",
    };
    return <Badge variant={variants[severity] || "default"}>{severity}</Badge>;
  };

  const getContentTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "user_input" ? "outline" : "secondary"}>
        {type === "user_input" ? "Input" : "Output"}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      pending: "default",
      approved: "secondary",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const totalPages = stats ? Math.ceil(stats.total / itemsPerPage) : 1;
  const statuses: Array<"pending" | "approved" | "rejected"> = [
    "pending",
    "approved",
    "rejected",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-bold">Review Queue</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Audit and decide on flagged content.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Items</div>
            <div className="text-2xl font-bold text-foreground mt-2">
              {stats?.total || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-foreground mt-2">
              {stats?.pending || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Approved</div>
            <div className="text-2xl font-bold text-foreground mt-2">
              {stats?.approved || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Rejected</div>
            <div className="text-2xl font-bold text-foreground mt-2">
              {stats?.rejected || 0}
            </div>
          </Card>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 border-b border-border">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => {
                setActiveStatus(status);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeStatus === status
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Review Queue Table */}
      <Card className="p-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {activeStatus} items found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="text-sm max-w-xs truncate">
                        {item.content_text.substring(0, 50)}...
                      </TableCell>
                      <TableCell>
                        {getContentTypeBadge(item.content_type)}
                      </TableCell>
                      <TableCell>{getSeverityBadge(item.severity)}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-sm">
                        {formatTimestamp(item.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleItemClick(item)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Queue Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-5">
              {/* Header bar: key metadata inline */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {getContentTypeBadge(selectedItem.content_type)}
                {getSeverityBadge(selectedItem.severity)}
                {getStatusBadge(selectedItem.status)}
                <span className="text-muted-foreground ml-auto">
                  {formatTimestamp(selectedItem.created_at)}
                </span>
              </div>

              {/* Flagged content */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Flagged Content</h3>
                <div className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto wrap-break-word">
                  {selectedItem.content_text}
                </div>
              </div>

              {/* Violations */}
              {selectedItem.violation_reasons &&
                Object.keys(selectedItem.violation_reasons).length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground">Violations</h3>
                      <div className="flex items-center gap-2">
                        {selectedItem.violation_reasons.action && (
                          <Badge
                            variant={selectedItem.violation_reasons.action === "allow" ? "outline" : "critical"}
                            className="text-xs"
                          >
                            Action: {selectedItem.violation_reasons.action}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Policies */}
                    {selectedItem.flagged_policies &&
                      selectedItem.flagged_policies.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">Policies:</span>
                          {selectedItem.flagged_policies.map((policy) => (
                            <Badge key={policy} variant="outline" className="text-xs">
                              {policy}
                            </Badge>
                          ))}
                        </div>
                      )}

                    {/* Individual violation entries */}
                    {Array.isArray(selectedItem.violation_reasons.violations) &&
                      selectedItem.violation_reasons.violations.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedItem.violation_reasons.violations.map(
                            (v: Record<string, any>, i: number) => (
                              <div
                                key={i}
                                className="flex items-start gap-3 border border-border rounded-md p-3"
                              >
                                <Badge
                                  variant={
                                    v.severity === "critical" ? "critical" :
                                    v.severity === "high" ? "high" :
                                    v.severity === "medium" ? "medium" : "low"
                                  }
                                  className="text-xs shrink-0 mt-0.5"
                                >
                                  {v.severity || "unknown"}
                                </Badge>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">
                                    {v.category || "Unknown Category"}
                                  </p>
                                  {v.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {v.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                  </div>
                )}

              {/* Review Notes */}
              {selectedItem.review_notes && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Review Notes</h3>
                  <p className="text-sm">{selectedItem.review_notes}</p>
                </div>
              )}

              {selectedItem.status === "pending" && (
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusUpdate("rejected")}
                  >
                    Reject
                  </Button>
                  <Button onClick={() => handleStatusUpdate("approved")}>
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
