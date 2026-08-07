import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { getMyAccount, updateTeacherAvatar } from "@/lib/account.functions";
import { TEACHER_AVATARS, TeacherAvatar, type AvatarVariant } from "@/components/teacher-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Reads the current user's chosen teacher avatar (falls back to "nova"). */
export function useTeacherAvatar() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["account", user?.id],
    queryFn: async () => await getMyAccount(),
    enabled: !!user,
  });
  return (data?.profile?.teacher_avatar as AvatarVariant | undefined) ?? "nova";
}

export function TeacherAvatarPicker({ trigger }: { trigger?: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateFn = useServerFn(updateTeacherAvatar);
  const current = useTeacherAvatar();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const handlePick = async (avatar: AvatarVariant) => {
    if (avatar === current) {
      setOpen(false);
      return;
    }
    setSaving(avatar);
    try {
      await updateFn({ data: { avatar } });
      await queryClient.invalidateQueries({ queryKey: ["account", user?.id] });
      toast.success("Teacher avatar updated");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save avatar");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="soft" size="sm">
            <Pencil className="h-4 w-4" /> Change avatar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose your AI teacher</DialogTitle>
          <DialogDescription>
            Pick the character who guides your lessons. They blink, bob and move their mouth while
            speaking.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          {TEACHER_AVATARS.map((a) => {
            const isActive = a.id === current;
            return (
              <button
                key={a.id}
                type="button"
                disabled={!!saving}
                onClick={() => handlePick(a.id)}
                className={cn(
                  "group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-all hover:-translate-y-0.5",
                  isActive
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {isActive && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <TeacherAvatar
                  variant={a.id}
                  speaking={saving === a.id}
                  animated={false}
                  className="w-16"
                />
                <span className="text-sm font-semibold">{a.name}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{a.tagline}</span>
                {saving === a.id && (
                  <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
