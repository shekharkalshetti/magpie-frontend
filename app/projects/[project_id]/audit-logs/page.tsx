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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAuditLogs, type AuditLog } from "@/lib/api";
import { format } from "date-fns";

interface AuditLogWithEmail extends AuditLog {
  user_email?: string;
}

export default function AuditLogsPage() {
  const params = useParams();
  const projectId = params.project_id as string;

  const [auditLogs, setAuditLogs] = useState<AuditLogWithEmail[]>([]);
  const [allUsers, setAllUsers] = useState<
    Array<{ id: string; email: string }>
  >([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogWithEmail | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);

  const logsPerPage = 20;

  useEffect(() => {
    loadAuditLogs();
  }, [projectId, currentPage, actionFilter, userFilter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await getAuditLogs(
        projectId,
        (currentPage - 1) * logsPerPage,
        logsPerPage,
        actionFilter || undefined,
        userFilter || undefined
      );
      setAuditLogs(data);

      // Extract unique users for filter dropdown
      const users = new Map<string, string>();
      data.forEach((log: AuditLogWithEmail) => {
        if (log.user_email) {
          users.set(log.user_id, log.user_email);
        }
      });
      setAllUsers(
        Array.from(users.entries()).map(([id, email]) => ({
          id,
          email,
        }))
      );
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log: AuditLogWithEmail) => {
    setSelectedLog(log);
    setIsDialogOpen(true);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800";
      case "update":
        return "bg-blue-100 text-blue-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "reset":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-gray-600">Track all policy changes and actions.</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium">Action</label>
            <Select
              value={actionFilter || "all"}
              onValueChange={(value) => {
                setActionFilter(value === "all" ? null : value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="reset">Reset</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium">User</label>
            <Select
              value={userFilter || "all"}
              onValueChange={(value) => {
                setUserFilter(value === "all" ? null : value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {allUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading audit logs...
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No audit logs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User Email</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm font-mono">
                      {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user_email || log.user_id}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Time
                </label>
                <p className="mt-1 font-mono">
                  {format(
                    new Date(selectedLog.created_at),
                    "yyyy-MM-dd HH:mm:ss"
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  User Email
                </label>
                <p className="mt-1">
                  {selectedLog.user_email || selectedLog.user_id}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  User ID
                </label>
                <p className="mt-1 font-mono text-sm">{selectedLog.user_id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Action
                </label>
                <div className="mt-1">
                  <Badge className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Description
                </label>
                <p className="mt-1 text-sm">
                  {selectedLog.description || "No description"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="flex items-center px-4">Page {currentPage}</span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={auditLogs.length < logsPerPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
