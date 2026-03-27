import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, MessageSquare, Eye, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SharePreferenceCardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedureId: string;
  procedureName: string;
}

const SharePreferenceCardDrawer = ({
  open,
  onOpenChange,
  procedureId,
  procedureName,
}: SharePreferenceCardDrawerProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [permission, setPermission] = useState<"view" | "edit">("view");

  const shareUrl = `${window.location.origin}/shared/procedure/${procedureId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleTextLink = () => {
    const action = permission === "edit" ? "edit" : "view";
    if (navigator.share) {
      navigator.share({
        title: `${procedureName} — Preference Card`,
        text: `You've been invited to ${action} my preference card for ${procedureName}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      window.open(`sms:?body=${encodeURIComponent(`You've been invited to ${action} my preference card for ${procedureName}: ${shareUrl}`)}`);
    }
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${procedureName} — Preference Card`,
        text: `View my preference card for ${procedureName}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[70vh] bg-background">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-base font-semibold text-foreground">
            Share Preference Card
          </DrawerTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Share <span className="text-foreground font-medium">{procedureName}</span> with your team
          </p>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-3">
          {/* Permission toggle */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-2">Access level</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPermission("view")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                  permission === "view"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye size={14} />
                View Only
              </button>
              <button
                onClick={() => setPermission("edit")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                  permission === "edit"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Pencil size={14} />
                Can Suggest Edits
              </button>
            </div>
            {permission === "edit" && (
              <p className="text-[10px] text-primary/70 mt-1.5">
                Edits require your approval before going live
              </p>
            )}
          </div>

          {/* Share URL preview */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
            <p className="text-xs text-muted-foreground truncate flex-1 font-mono">{shareUrl}</p>
          </div>

          {/* Copy Link */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-xl border-border bg-card h-12 text-sm hover:border-primary/50"
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check size={18} className="text-green-500" />
            ) : (
              <Copy size={18} className="text-primary" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </Button>

          {/* Text Link */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-xl border-border bg-card h-12 text-sm hover:border-primary/50"
            onClick={handleTextLink}
          >
            <MessageSquare size={18} className="text-primary" />
            Text Link
          </Button>

          {/* Native Share */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-xl border-border bg-card h-12 text-sm hover:border-primary/50"
            onClick={handleNativeShare}
          >
            <Share2 size={18} className="text-primary" />
            More Sharing Options
          </Button>

          <p className="text-[10px] text-muted-foreground/60 text-center pt-2">
            Recipients must have an account to view shared preference cards
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SharePreferenceCardDrawer;
