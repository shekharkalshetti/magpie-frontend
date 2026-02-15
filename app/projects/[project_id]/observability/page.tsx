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
import { Input } from "@/components/ui/input";
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

  // Custom data filter state
  const [filterKey, setFilterKey] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [activeFilterKey, setActiveFilterKey] = useState("");
  const [activeFilterValue, setActiveFilterValue] = useState("");

  useEffect(() => {
    loadData();
  }, [projectId, currentPage, activeFilterKey, activeFilterValue]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, logsData] = await Promise.all([
        getObservabilityStats(projectId, ""),
        getExecutionLogs(
          projectId,
          "",
          (currentPage - 1) * logsPerPage,
          logsPerPage,
          activeFilterKey || undefined,
          activeFilterValue || undefined,
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

  const handleApplyFilter = () => {
    if (filterKey.trim() && filterValue.trim()) {
      setActiveFilterKey(filterKey.trim());
      setActiveFilterValue(filterValue.trim());
      setCurrentPage(1);
    }
  };

  const handleClearFilter = () => {
    setFilterKey("");
    setFilterValue("");
    setActiveFilterKey("");
    setActiveFilterValue("");
    setCurrentPage(1);
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
          <p className="mt-2 text-muted-foreground">
            Monitor LLM performance, cost, and quality.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">
              Total Requests
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">
              {stats?.total_requests || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">
              Success Rate
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">
              {stats?.success_rate.toFixed(1) || 0}%
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Cost</div>
            <div className="text-2xl font-bold text-foreground mt-2">
              ${stats?.total_cost.toFixed(4) || "0.0000"}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Avg Latency</div>
            <div className="text-2xl font-bold text-foreground mt-2">
              {stats?.avg_latency_ms
                ? `${(stats.avg_latency_ms / 1000).toFixed(2)}s`
                : "0s"}
            </div>
          </Card>
        </div>

        {/* Execution Logs Tab Header */}
        <div className="flex gap-2 border-b border-border">
          <span className="px-4 py-2 font-medium text-sm border-b-2 border-foreground text-foreground">
            Execution Logs
          </span>
        </div>

        {/* Custom Data Filter */}
        <div className="flex items-center gap-3">
          <Input
            placeholder="Custom data key"
            value={filterKey}
            onChange={(e) => setFilterKey(e.target.value)}
            className="w-[180px]"
            onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
          />
          <Input
            placeholder="Value"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="w-[180px]"
            onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyFilter}
            disabled={!filterKey.trim() || !filterValue.trim()}
          >
            Apply
          </Button>
          {activeFilterKey && (
            <Button variant="ghost" size="sm" onClick={handleClearFilter}>
              Clear
            </Button>
          )}
          {activeFilterKey && (
            <span className="text-sm text-muted-foreground">
              Filtering: <span className="font-mono">{activeFilterKey}</span> = <span className="font-mono">{activeFilterValue}</span>
            </span>
          )}
        </div>

        {/* Logs Table */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
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
                        className="cursor-pointer hover:bg-muted/50"
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
                <div className="text-sm text-muted-foreground">
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
                    <span className="text-muted-foreground">Trace ID:</span>
                    <p className="font-mono text-xs mt-1">
                      {selectedLog.trace_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Function:</span>
                    <p className="mt-1">{selectedLog.function_name || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="mt-1">
                      {getStatusBadge(selectedLog.status)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Started At:</span>
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
                    <span className="text-muted-foreground">Latency:</span>
                    <p className="mt-1">
                      {formatLatency(selectedLog.total_latency_ms)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Input Tokens:</span>
                    <p className="mt-1">{selectedLog.input_tokens || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Output Tokens:</span>
                    <p className="mt-1">{selectedLog.output_tokens || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Tokens:</span>
                    <p className="mt-1">{selectedLog.total_tokens || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Input Cost:</span>
                    <p className="mt-1">{formatCost(selectedLog.input_cost)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Output Cost:</span>
                    <p className="mt-1">
                      {formatCost(selectedLog.output_cost)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Cost:</span>
                    <p className="mt-1 font-semibold">
                      {formatCost(selectedLog.total_cost)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Context Utilization:</span>
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
                    <span className="text-sm text-muted-foreground">Input:</span>
                    <p className="text-sm bg-muted p-3 rounded mt-1 wrap-break-word">
                      {selectedLog.input}
                    </p>
                  </div>
                )}
                {selectedLog.output && (
                  <div>
                    <span className="text-sm text-muted-foreground">Output:</span>
                    <p className="text-sm bg-muted p-3 rounded mt-1 wrap-break-word">
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
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto">
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
                      <span className="text-sm text-muted-foreground">
                        PII Detection:
                      </span>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(selectedLog.pii_detection, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.content_moderation && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Content Moderation:
                      </span>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
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

              {/* Schema Guard */}
              {selectedLog.schema_validation && (
                <div>
                  <h3 className="font-semibold mb-3">Schema Guard</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={selectedLog.schema_validation.valid ? "default" : "destructive"}>
                        {selectedLog.schema_validation.valid ? "Valid" : "Invalid"}
                      </Badge>
                      {selectedLog.schema_validation.on_fail && (
                        <Badge variant="outline">
                          {selectedLog.schema_validation.on_fail === "block" ? "Blocked" : "Flagged"}
                        </Badge>
                      )}
                    </div>
                    {selectedLog.schema_validation.schema_name && (
                      <div>
                        <span className="text-sm text-muted-foreground">Schema:</span>
                        <span className="text-sm font-mono ml-2">{selectedLog.schema_validation.schema_name}</span>
                      </div>
                    )}
                    {selectedLog.schema_validation.errors && selectedLog.schema_validation.errors.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">Errors:</span>
                        <ul className="mt-1 space-y-1">
                          {selectedLog.schema_validation.errors.map((error: string, i: number) => (
                            <li key={i} className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded font-mono">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Info */}
              {selectedLog.error_message && (
                <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                  <span className="text-sm text-muted-foreground">Error:</span>
                  <p className="text-sm text-destructive mt-1">
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
