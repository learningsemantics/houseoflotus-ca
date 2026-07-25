"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Search, Check, XCircle, Info, Ban, Eye } from "lucide-react"

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  NEEDS_INFORMATION: "bg-orange-100 text-orange-800",
  REJECTED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-gray-100 text-gray-800",
  DRAFT: "bg-gray-100 text-gray-800",
}

export default function OpsBuyersPage() {
  const [buyers, setBuyers] = useState<any[]>([])
  const [status, setStatus] = useState("ALL")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const [notesSaving, setNotesSaving] = useState(false)
  const [dialog, setDialog] = useState<{ type: string; orgId: string } | null>(null)
  const [dialogText, setDialogText] = useState("")

  const load = useCallback(() => {
    const params = new URLSearchParams()
    if (status !== "ALL") params.set("status", status)
    if (search) params.set("search", search)
    fetch(`/api/ops/buyers?${params}`).then(r => r.json()).then(data => setBuyers(data.buyers))
  }, [status, search])
  useEffect(load, [load])

  function openDetail(org: any) {
    setSelected(org)
    setNotes(org.internalNotes ?? "")
    setDetailOpen(true)
  }

  async function doAction(type: string, orgId: string) {
    const url = `/api/ops/buyers/${orgId}/${type}`
    const body = type === "request-info" ? { message: dialogText } : type === "reject" ? { reason: dialogText } : {}
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!res.ok) { toast.error("Action failed"); return }
    toast.success(`Organization ${type === "approve" ? "approved" : type === "request-info" ? "updated" : type === "reject" ? "rejected" : "suspended"}`)
    setDialog(null); setDialogText(""); setDetailOpen(false); load()
  }

  async function saveNotes() {
    if (!selected) return
    setNotesSaving(true)
    await fetch(`/api/ops/buyers/${selected.id}/notes`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) })
    toast.success("Notes saved")
    setNotesSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or city…" className="pl-9" /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All Statuses</SelectItem><SelectItem value="SUBMITTED">Submitted</SelectItem><SelectItem value="UNDER_REVIEW">Under Review</SelectItem><SelectItem value="APPROVED">Approved</SelectItem><SelectItem value="NEEDS_INFORMATION">Needs Info</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem><SelectItem value="SUSPENDED">Suspended</SelectItem></SelectContent></Select>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left"><th className="px-4 py-3 font-medium text-gray-500">Organization</th><th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Location</th><th className="px-4 py-3 font-medium text-gray-500">Status</th><th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Submitted</th><th className="px-4 py-3 font-medium text-gray-500">Actions</th></tr></thead>
            <tbody>{buyers.map(org => (
              <tr key={org.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3"><p className="font-medium">{org.legalName}</p><p className="text-xs text-gray-400">{org.createdBy.email}</p></td>
                <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{org.city}{org.province ? `, ${org.province}` : ""}</td>
                <td className="px-4 py-3"><Badge className={statusColors[org.status] ?? ""}>{org.status.replace(/_/g, " ")}</Badge></td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">{org.submittedAt ? new Date(org.submittedAt).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openDetail(org)}><Eye className="w-4 h-4" /></Button>
                  {(org.status === "SUBMITTED" || org.status === "UNDER_REVIEW" || org.status === "NEEDS_INFORMATION") && <><Button variant="ghost" size="sm" className="text-green-600" onClick={() => setDialog({ type: "approve", orgId: org.id })}><Check className="w-4 h-4" /></Button><Button variant="ghost" size="sm" className="text-orange-500" onClick={() => setDialog({ type: "request-info", orgId: org.id })}><Info className="w-4 h-4" /></Button><Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDialog({ type: "reject", orgId: org.id })}><XCircle className="w-4 h-4" /></Button></>}
                  {org.status === "APPROVED" && <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => setDialog({ type: "suspend", orgId: org.id })}><Ban className="w-4 h-4" /></Button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {buyers.length === 0 && <p className="text-center text-gray-400 py-12">No buyer organizations found</p>}
      </div>

      {/* Detail Sheet */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>{selected?.legalName}</DialogTitle></DialogHeader>
          {selected && <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-gray-400 text-xs">Status</p><Badge className={statusColors[selected.status]}>{selected.status.replace(/_/g, " ")}</Badge></div><div><p className="text-gray-400 text-xs">Business Type</p><p>{selected.businessType || "—"}</p></div><div><p className="text-gray-400 text-xs">City</p><p>{selected.city}, {selected.province}</p></div><div><p className="text-gray-400 text-xs">Members</p><p>{selected._count?.members ?? 0}</p></div><div><p className="text-gray-400 text-xs">Created By</p><p>{selected.createdBy?.firstName} {selected.createdBy?.lastName}</p></div><div><p className="text-gray-400 text-xs">Submitted</p><p>{selected.submittedAt ? new Date(selected.submittedAt).toLocaleDateString() : "—"}</p></div></div>
            {selected.rejectionReason && <div className="bg-red-50 p-3 rounded"><p className="text-xs text-red-400">Rejection / Info Note:</p><p className="text-sm text-red-700">{selected.rejectionReason}</p></div>}
            <div><p className="text-xs text-gray-400 mb-1">Internal Notes</p><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} /><Button size="sm" className="mt-1" onClick={saveNotes} disabled={notesSaving}>Save Notes</Button></div>
          </div>}
        </DialogContent>
      </Dialog>

      {/* Action Confirm Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent><DialogHeader><DialogTitle>{dialog?.type === "approve" ? "Approve Organization?" : dialog?.type === "request-info" ? "Request Additional Information?" : dialog?.type === "reject" ? "Reject Organization?" : "Suspend Organization?"}</DialogTitle></DialogHeader>
          {(dialog?.type === "request-info" || dialog?.type === "reject") && <Textarea value={dialogText} onChange={e => setDialogText(e.target.value)} rows={3} placeholder={dialog?.type === "request-info" ? "What information do you need?" : "Reason for rejection"} />}
          <DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button className={dialog?.type === "approve" ? "bg-green-600" : dialog?.type === "reject" ? "bg-red-600" : "bg-[#c99743]"} onClick={() => dialog && doAction(dialog.type, dialog.orgId)}>Confirm</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}