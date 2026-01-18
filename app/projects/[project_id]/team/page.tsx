"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import {
  listTeamMembers,
  listPendingInvitations,
  removeMember,
  cancelInvitation,
  TeamMember,
  PendingInvitation,
} from "@/lib/api";
import { format } from "date-fns";

interface TeamMemberRow {
  id: string;
  email: string;
  name: string;
  role: string;
  status: "joined" | "invited";
  joinedAt: string;
  expiresAt?: string;
}

export default function TeamPage() {
  const params = useParams();
  const projectId = params.project_id as string;
  const { user } = useAuth();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [allRows, setAllRows] = useState<TeamMemberRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<TeamMemberRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [removingItemType, setRemovingItemType] = useState<
    "member" | "invitation" | null
  >(null);

  // Get current user email from auth context
  const currentUserEmail = user?.email || "";

  // Determine if current user is admin
  const isCurrentUserAdmin = members.some(
    (m) => m.email === currentUserEmail && m.role.toLowerCase() === "admin"
  );

  const loadData = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Always load members
      const membersData = await listTeamMembers(projectId);
      setMembers(membersData);

      // Try to load invitations, but don't fail if user is not admin
      let invitationsData: PendingInvitation[] = [];
      try {
        invitationsData = await listPendingInvitations(projectId);
        setInvitations(invitationsData);
      } catch (invErr) {
        // Non-admins can't view invitations, so just skip it
        console.log("Cannot view invitations (non-admin user)");
        setInvitations([]);
      }

      // Combine members and invitations into a single table
      const rows: TeamMemberRow[] = [
        ...membersData.map((m) => ({
          id: m.user_id,
          email: m.email,
          name: m.name,
          role: m.role,
          status: "joined" as const,
          joinedAt: m.joined_at,
        })),
        ...invitationsData.map((i) => ({
          id: i.id,
          email: i.invited_email,
          name: i.invited_email.split("@")[0], // Use part of email as name
          role: i.role,
          status: "invited" as const,
          joinedAt: i.created_at,
          expiresAt: i.expires_at,
        })),
      ];

      setAllRows(rows);
      filterRows(rows, searchQuery);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load team";
      setError(message);
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
      console.error("Error loading team:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRows = (rows: TeamMemberRow[], query: string) => {
    if (!query.trim()) {
      setFilteredRows(rows);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = rows.filter(
      (row) =>
        row.email.toLowerCase().includes(lowerQuery) ||
        row.name.toLowerCase().includes(lowerQuery) ||
        row.role.toLowerCase().includes(lowerQuery)
    );
    setFilteredRows(filtered);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    filterRows(allRows, query);
  };

  const handleRemove = async () => {
    if (!removingItemId || !removingItemType) return;

    try {
      if (removingItemType === "member") {
        await removeMember(projectId, removingItemId);
      } else {
        await cancelInvitation(projectId, removingItemId);
      }
      setRemovingItemId(null);
      setRemovingItemType(null);
      await loadData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to remove";
      setError(errorMsg);
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember(projectId, userId);
      setRemovingItemId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation(projectId, invitationId);
      setRemovingItemId(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel invitation"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-muted-foreground">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage project team and member invitations
          </p>
        </div>
        {isCurrentUserAdmin && (
          <Button onClick={() => setIsDialogOpen(true)}>Invite Member</Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
          <div className="font-medium">Error</div>
          <div className="text-sm opacity-90">{error}</div>
        </div>
      )}

      {/* Card Container */}
      <Card className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <Input
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Table */}
        {filteredRows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery
              ? "No members match your search."
              : "No team members yet. Invite someone to get started."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => {
                  const isCurrentUser = row.email === currentUserEmail;
                  const isJoined = row.status === "joined";

                  return (
                    <TableRow key={`${row.status}-${row.id}`}>
                      <TableCell className="font-medium">{row.email}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {row.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isJoined ? "default" : "outline"}
                          className="capitalize"
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(row.joinedAt), "MMM d, yyyy")}
                        {row.expiresAt && (
                          <div className="text-xs">
                            Expires: {format(new Date(row.expiresAt), "MMM d")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isCurrentUser || !isCurrentUserAdmin ? (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setRemovingItemId(row.id);
                              setRemovingItemType(
                                isJoined ? "member" : "invitation"
                              );
                            }}
                          >
                            {isJoined ? "Remove" : "Cancel"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 text-sm text-muted-foreground border-t pt-4">
          Showing {filteredRows.length} of {allRows.length} members
          {searchQuery && ` (filtered by "${searchQuery}")`}
        </div>
      </Card>

      {/* Dialogs */}
      {isCurrentUserAdmin && (
        <InviteMemberDialog
          projectId={projectId}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={loadData}
        />
      )}

      <AlertDialog
        open={removingItemId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemovingItemId(null);
            setRemovingItemType(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removingItemType === "member"
                ? "Remove Team Member"
                : "Cancel Invitation"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removingItemType === "member"
                ? "Are you sure you want to remove this member from the project? They will no longer have access."
                : "Are you sure you want to cancel this invitation? The invited user will no longer be able to accept it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleRemove}
            >
              {removingItemType === "member" ? "Remove" : "Cancel Invitation"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
