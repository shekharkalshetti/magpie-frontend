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
      "default" | "secondary" | "destructive" | "outline"
    > = {
      low: "secondary",
      medium: "default",
      high: "destructive",
      critical: "destructive",
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
            <div className="text-sm font-medium text-gray-600">Total Items</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {stats?.total || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {stats?.pending || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-gray-600">Approved</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {stats?.approved || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-gray-600">Rejected</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {stats?.rejected || 0}
            </div>
          </Card>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 border-b">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => {
                setActiveStatus(status);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeStatus === status
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
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
          <div className="text-center py-8 text-gray-500">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
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
                      className="cursor-pointer hover:bg-gray-50"
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
              <div className="text-sm text-gray-600">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Queue Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Content Type
                  </label>
                  <div className="mt-1">
                    {getContentTypeBadge(selectedItem.content_type)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Severity
                  </label>
                  <div className="mt-1">
                    {getSeverityBadge(selectedItem.severity)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedItem.status)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Created At
                  </label>
                  <div className="text-sm mt-1">
                    {formatTimestamp(selectedItem.created_at)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Content
                </label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {selectedItem.content_text}
                </div>
              </div>

              {selectedItem.flagged_policies &&
                selectedItem.flagged_policies.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Flagged Policies
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedItem.flagged_policies.map((policy) => (
                        <Badge key={policy} variant="outline">
                          {policy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {selectedItem.violation_reasons &&
                Object.keys(selectedItem.violation_reasons).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Violation Reasons
                    </label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm max-h-48 overflow-y-auto">
                      {JSON.stringify(selectedItem.violation_reasons, null, 2)}
                    </div>
                  </div>
                )}

              {selectedItem.review_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Review Notes
                  </label>
                  <div className="text-sm mt-1">
                    {selectedItem.review_notes}
                  </div>
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
