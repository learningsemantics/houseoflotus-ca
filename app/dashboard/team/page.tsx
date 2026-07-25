"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { UserPlus, Trash2, Shield } from "lucide-react"

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("BUYER_MEMBER")
  const [inviting, setInviting] = useState(false)

  const load = useCallback(() => {
    fetch("/api/team").then(r => r.json()).then(data => { setMembers(data.members); setInvitations(data.invitations) })
  }, [])
  useEffect(load, [load])

  async function invite() {
    setInviting(true)
    try {
      const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: inviteEmail, role: inviteRole }) })
      if (!res.ok) throw new Error()
      toast.success("Invitation sent")
      setInviteOpen(false); setInviteEmail(""); load()
    } catch { toast.error("Failed to send invitation") }
    setInviting(false)
  }

  async function removeMember(id: string) {
    try {
      await fetch(`/api/team/members/${id}`, { method: "DELETE" })
      toast.success("Member removed"); load()
    } catch { toast.error("Failed to remove") }
  }

  async function changeRole(id: string, role: string) {
    try {
      await fetch(`/api/team/members/${id}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) })
      toast.success("Role updated"); load()
    } catch { toast.error("Failed to update role") }
  }

  async function revokeInvitation(id: string) {
    try {
      await fetch(`/api/team/invitations/${id}`, { method: "DELETE" })
      toast.success("Invitation revoked"); load()
    } catch { toast.error("Failed to revoke") }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-[Georgia,serif] text-2xl text-[#151513]">Team</h1>
        <Button className="bg-[#c99743] hover:bg-[#b8893d] text-white" onClick={() => setInviteOpen(true)}><UserPlus className="w-4 h-4 mr-1" />Invite</Button>
      </div>

      <Card><CardHeader><CardTitle className="font-[Georgia,serif] text-lg">Members ({members.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{m.user.firstName} {m.user.lastName}</p>
                <p className="text-xs text-[#8e8579]">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={m.role} onValueChange={v => changeRole(m.id, v)}><SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BUYER_ADMIN">Admin</SelectItem><SelectItem value="BUYER_MEMBER">Member</SelectItem></SelectContent></Select>
                <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove member?</AlertDialogTitle><AlertDialogDescription>This will remove {m.user.firstName} from your organization.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => removeMember(m.id)}>Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card><CardHeader><CardTitle className="font-[Georgia,serif] text-lg">Pending Invitations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div><p className="text-sm">{inv.email}</p><p className="text-xs text-[#8e8579]">Expires {new Date(inv.expiresAt).toLocaleDateString()}</p></div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{inv.role.replace(/_/g, ' ')}</Badge>
                  <Button variant="ghost" size="sm" className="text-red-400" onClick={() => revokeInvitation(inv.id)}>Revoke</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent><DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Email</Label><Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@roastery.ca" /></div>
            <div className="space-y-1.5"><Label>Role</Label><Select value={inviteRole} onValueChange={setInviteRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BUYER_ADMIN">Admin</SelectItem><SelectItem value="BUYER_MEMBER">Member</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button><Button className="bg-[#c99743]" onClick={invite} disabled={inviting || !inviteEmail}>{inviting ? "Sending…" : "Send Invitation"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}