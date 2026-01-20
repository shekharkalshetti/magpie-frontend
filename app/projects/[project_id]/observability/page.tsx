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
} from "@/components/ui/dialog";
import {
  getObservabilityStats,
  getExecutionLogs,
  getExecutionLog,
  type ExecutionLog,
  type ObservabilityStats,
} from "@/lib/api";

export default function ObservabilityPage() {
  const params = useParams();
  const projectId = params.project_id as string;

  const [stats, setStats] = useState<ObservabilityStats | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ExecutionLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  useEffect(() => {
    loadData();
  }, [projectId, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Pass empty string for apiKey parameter (will use JWT instead)
      const [statsData, logsData] = await Promise.all([
        getObservabilityStats(projectId, ""),
        getExecutionLogs(
          projectId,
          "",
          (currentPage - 1) * logsPerPage,
          logsPerPage,
        ),
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch (error) {
      console.error("Failed to load observability data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogClick = async (log: ExecutionLog) => {
    try {
      const fullLog = await getExecutionLog(log.id, projectId);
      setSelectedLog(fullLog);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load log details:", error);
    }
  };

  const formatCost = (cost: number | null) => {
    if (cost === null) return "-";
    return `$${cost.toFixed(4)}`;
  };

  const formatLatency = (ms: number | null) => {
    if (ms === null) return "-";
    return `${Math.round(ms)}ms`;
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const variant = status === "success" ? "default" : "destructive";
    return <Badge variant={variant}>{status}</Badge>;
  };

  const totalPages = stats ? Math.ceil(stats.total_requests / logsPerPage) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-bold">Observability</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Track and analyze all LLM conversations with detailed metrics for
            performance, cost, and quality.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600">
              Total Requests
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats?.total_requests || 0}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600">
              Success Rate
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats?.success_rate.toFixed(1) || 0}%
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600">Total Cost</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              ${stats?.total_cost.toFixed(4) || "0.0000"}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600">Avg Latency</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats?.avg_latency_ms
                ? `${(stats.avg_latency_ms / 1000).toFixed(2)}s`
                : "0s"}
            </div>
          </Card>
        </div>

        {/* Logs Table */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Execution Logs</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No execution logs found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Function</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Latency</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead className="w-16">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <TableCell className="text-sm">
                          {formatTimestamp(log.created_at)}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {log.trace_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.function_name || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell className="text-sm">
                          {formatLatency(log.total_latency_ms)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.total_tokens || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatCost(log.total_cost)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogClick(log)}
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
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
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
      </div>

      {/* Log Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Execution Log Details</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Request Info */}
              <div>
                <h3 className="font-semibold mb-3">Request Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Trace ID:</span>
                    <p className="font-mono text-xs mt-1">
                      {selectedLog.trace_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Function:</span>
                    <p className="mt-1">{selectedLog.function_name || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="mt-1">
                      {getStatusBadge(selectedLog.status)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Started At:</span>
                    <p className="mt-1">
                      {formatTimestamp(selectedLog.started_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div>
                <h3 className="font-semibold mb-3">Metrics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Latency:</span>
                    <p className="mt-1">
                      {formatLatency(selectedLog.total_latency_ms)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Input Tokens:</span>
                    <p className="mt-1">{selectedLog.input_tokens || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Output Tokens:</span>
                    <p className="mt-1">{selectedLog.output_tokens || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Tokens:</span>
                    <p className="mt-1">{selectedLog.total_tokens || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Input Cost:</span>
                    <p className="mt-1">{formatCost(selectedLog.input_cost)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Output Cost:</span>
                    <p className="mt-1">
                      {formatCost(selectedLog.output_cost)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Cost:</span>
                    <p className="mt-1 font-semibold">
                      {formatCost(selectedLog.total_cost)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Context Utilization:</span>
                    <p className="mt-1">
                      {selectedLog.context_utilization !== null
                        ? `${selectedLog.context_utilization.toFixed(2)}%`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Input/Output */}
              <div>
                <h3 className="font-semibold mb-3">Content</h3>
                {selectedLog.input && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Input:</span>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1 break-words">
                      {selectedLog.input}
                    </p>
                  </div>
                )}
                {selectedLog.output && (
                  <div>
                    <span className="text-sm text-gray-600">Output:</span>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1 break-words">
                      {selectedLog.output}
                    </p>
                  </div>
                )}
              </div>

              {/* Custom Data */}
              {selectedLog.custom_data &&
                Object.keys(selectedLog.custom_data).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Custom Data</h3>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                      {JSON.stringify(selectedLog.custom_data, null, 2)}
                    </pre>
                  </div>
                )}

              {/* Security Info */}
              {(selectedLog.pii_detection ||
                selectedLog.content_moderation) && (
                <div>
                  <h3 className="font-semibold mb-3">Security</h3>
                  {selectedLog.pii_detection && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600">
                        PII Detection:
                      </span>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(selectedLog.pii_detection, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.content_moderation && (
                    <div>
                      <span className="text-sm text-gray-600">
                        Content Moderation:
                      </span>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(
                          selectedLog.content_moderation,
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Error Info */}
              {selectedLog.error_message && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <span className="text-sm text-gray-600">Error:</span>
                  <p className="text-sm text-red-700 mt-1">
                    {selectedLog.error_message}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
