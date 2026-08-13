"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Pencil, Save, Camera } from "lucide-react";


interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function getInitials(first: string, last: string) {
  return `${(first || "?")[0]}${(last || "?")[0]}`.toUpperCase();
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const fetchProfile = useCallback(() => {
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
          return;
        }
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load profile");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const startEdit = () => {
    if (!profile) return;
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      jobTitle: profile.jobTitle || "",
      phone: profile.phone || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success("Profile updated");
      setEditing(false);
      fetchProfile();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Avatar + Name Section */}
      <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-[#c99743]/30">
                <AvatarFallback className="bg-[#c99743]/10 text-[#c99743] text-xl font-medium font-['Georgia',serif]">
                  {getInitials(profile.firstName, profile.lastName)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#c99743] text-white flex items-center justify-center hover:bg-[#b8882e] transition-colors shadow-sm">
                <Camera className="h-3.5 w-3.5" />
                <span className="sr-only">Change avatar</span>
              </button>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-['Georgia',serif] text-lg text-[#151513]">
                {profile.firstName} {profile.lastName}
              </h3>
              <p className="text-sm text-[#756e62]">{profile.email}</p>
              {profile.jobTitle && (
                <p className="text-sm text-[#524c43] mt-1">{profile.jobTitle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-['Georgia',serif] text-base text-[#151513]">
              Personal Details
            </h3>
            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={startEdit}
                className="text-[10px] uppercase tracking-[0.12em] border-[#c99743]/30 text-[#c99743] hover:bg-[#c99743]/5"
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(false)}
                  className="text-[10px] uppercase tracking-[0.12em]"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="text-[10px] uppercase tracking-[0.12em] bg-[#c99743] text-[#14110d] hover:bg-[#b8882e]"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {editing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="h-11 border-[rgba(21,21,19,.17)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="h-11 border-[rgba(21,21,19,.17)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    className="h-11 border-[rgba(21,21,19,.17)]"
                    placeholder="e.g. Head of Coffee"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="h-11 border-[rgba(21,21,19,.17)]"
                    placeholder="+1 (416) 555-0000"
                  />
                </div>
              </>
            ) : (
              <>
                <DetailField label="First Name" value={profile.firstName} />
                <DetailField label="Last Name" value={profile.lastName} />
                <DetailField label="Job Title" value={profile.jobTitle} />
                <DetailField label="Phone" value={profile.phone} />
                <div className="md:col-span-2">
                  <DetailField label="Email" value={profile.email} />
                </div>
              </>
            )}
          </div>

          {!editing && (
            <p className="text-[10px] text-[#b5ad9e] mt-6">
              Last updated: {new Date(profile.updatedAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#756e62] mb-1">{label}</p>
      <p className="text-sm text-[#151513]">
        {value || <span className="text-[#b5ad9e] italic">Not set</span>}
      </p>
    </div>
  );
}
