"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { UserPlus, Shield, Trash2, Clock, Mail, X } from "lucide-react";

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isPrimary: boolean;
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
}

interface TeamData {
  members: TeamMember[];
  invitations: Invitation[];
  currentUserId: string;
}

function getInitials(first: string, last: string) {
  return `${(first || "?")[0]}${(last || "?")[0]}`.toUpperCase();
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("BUYER_MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Remove dialog
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const fetchTeam = useCallback(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (session.user?.organization) {
          setRole(session.user.organization.role);
        }
      });

    fetch("/api/team")
      .then((res) => res.json())
      .then((teamData) => {
        if (teamData.error) {
          toast.error(teamData.error);
          return;
        }
        setData(teamData);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load team");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to send invitation");
        return;
      }
      toast.success("Invitation sent");
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("BUYER_MEMBER");
      fetchTeam();
    } catch {
      toast.error("Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/team/members/${removeTarget.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to remove member");
        return;
      }
      toast.success("Member removed");
      setRemoveTarget(null);
      fetchTeam();
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/team/members/${memberId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to change role");
        return;
      }
      toast.success("Role updated");
      fetchTeam();
    } catch {
      toast.error("Failed to change role");
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    try {
      const res = await fetch(`/api/team/invitations/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to revoke invitation");
        return;
      }
      toast.success("Invitation revoked");
      fetchTeam();
    } catch {
      toast.error("Failed to revoke invitation");
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const isAdmin = role === "BUYER_ADMIN";

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-['Georgia',serif] text-xl text-[#151513]">Team Members</h2>
          <p className="text-sm text-[#756e62]">{data.members.length} member{data.members.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setInviteOpen(true)}
            className="text-[10px] uppercase tracking-[0.12em] bg-[#c99743] text-[#14110d] hover:bg-[#b8882e]"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Invite Team Member
          </Button>
        )}
      </div>

      {/* Members List */}
      <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
        <CardContent className="p-0">
          <div className="divide-y divide-[rgba(21,21,19,.08)]">
            {data.members.map((member) => {
              const isCurrentUser = member.userId === data.currentUserId;
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    isCurrentUser ? "bg-[#c99743]/5" : ""
                  }`}
                >
                  <Avatar className="h-9 w-9 border border-[#c99743]/20 flex-shrink-0">
                    <AvatarFallback className="bg-[#c99743]/10 text-[#c99743] text-xs font-medium font-['Georgia',serif]">
                      {getInitials(member.firstName, member.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#151513] truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[9px] uppercase tracking-[0.12em] text-[#c99743] font-medium">
                          (You)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#756e62] truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {isAdmin && !isCurrentUser ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 text-[#756e62] hover:text-[#151513]">
                            <Badge
                              className={`text-[9px] uppercase tracking-[0.08em] ${
                                member.role === "BUYER_ADMIN"
                                  ? "bg-[#c99743]/10 text-[#c99743] border-[#c99743]/20"
                                  : "bg-[#68715e]/10 text-[#68715e] border-[#68715e]/20"
                              }`}
                            >
                              {member.role.replace("_", " ")}
                            </Badge>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleChangeRole(member.id, "BUYER_ADMIN")}
                            disabled={member.role === "BUYER_ADMIN"}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleChangeRole(member.id, "BUYER_MEMBER")}
                            disabled={member.role === "BUYER_MEMBER"}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setRemoveTarget(member)}
                            className="text-[#c76331]"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge
                        className={`text-[9px] uppercase tracking-[0.08em] ${
                          member.role === "BUYER_ADMIN"
                            ? "bg-[#c99743]/10 text-[#c99743] border-[#c99743]/20"
                            : "bg-[#68715e]/10 text-[#68715e] border-[#68715e]/20"
                        }`}
                      >
                        {member.role.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {data.invitations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[#756e62] mb-3 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Pending Invitations ({data.invitations.length})
          </h3>
          <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
            <CardContent className="p-0">
              <div className="divide-y divide-[rgba(21,21,19,.08)]">
                {data.invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="h-9 w-9 rounded-full bg-[#b5ad9e]/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 text-[#b5ad9e]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#151513] truncate">{inv.email}</p>
                      <p className="text-xs text-[#b5ad9e]">
                        Invited by {inv.invitedByName} ·{" "}
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-[#c99743]/10 text-[#c99743] border-[#c99743]/20 text-[9px] uppercase tracking-[0.08em] flex-shrink-0">
                      {inv.role.replace("_", " ")}
                    </Badge>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[#c76331] hover:text-[#c76331] hover:bg-[#c76331]/5"
                        onClick={() => handleRevokeInvitation(inv.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span className="sr-only">Revoke</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-['Georgia',serif] text-lg text-[#151513]">
              Invite Team Member
            </DialogTitle>
            <DialogDescription className="text-sm text-[#756e62]">
              Send an invitation to join your organization. They&apos;ll receive an email with a link to sign up.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-11 border-[rgba(21,21,19,.17)]"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUYER_ADMIN">Buyer Admin</SelectItem>
                  <SelectItem value="BUYER_MEMBER">Buyer Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
              className="text-[10px] uppercase tracking-[0.12em]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviteLoading || !inviteEmail}
              className="text-[10px] uppercase tracking-[0.12em] bg-[#c99743] text-[#14110d] hover:bg-[#b8882e]"
            >
              {inviteLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-['Georgia',serif] text-lg text-[#151513]">
              Remove Team Member
            </DialogTitle>
            <DialogDescription className="text-sm text-[#756e62]">
              Are you sure you want to remove{" "}
              <strong className="text-[#151513]">
                {removeTarget?.firstName} {removeTarget?.lastName}
              </strong>{" "}
              from your organization? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveTarget(null)}
              className="text-[10px] uppercase tracking-[0.12em]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeLoading}
              className="text-[10px] uppercase tracking-[0.12em]"
            >
              {removeLoading ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
