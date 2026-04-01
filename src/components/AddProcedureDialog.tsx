import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Facility {
  id: string;
  name: string;
}

interface AddProcedureDialogProps {
  facilities: Facility[];
  onAdded: () => void;
  preselectedFacilityId?: string;
  triggerVariant?: "default" | "prominent";
  forUserId?: string;
}

const AddProcedureDialog = ({ facilities, onAdded, preselectedFacilityId, triggerVariant = "default", forUserId }: AddProcedureDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [facilityId, setFacilityId] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [facilityError, setFacilityError] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && preselectedFacilityId) {
      setFacilityId(preselectedFacilityId);
    }
  }, [open, preselectedFacilityId]);

  const handleSubmit = async () => {
    if (!name.trim() || !user) return;
    if (!facilityId) {
      setFacilityError(true);
      return;
    }
    setFacilityError(false);
    setLoading(true);
    const { error } = await supabase.from("procedures").insert({
      user_id: forUserId || user.id,
      name: name.trim(),
      category: category || null,
      facility_id: facilityId,
      notes: notes.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error adding procedure", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Procedure added" });
      setName(""); setFacilityId(""); setNotes(""); setFacilityError(false);
      setOpen(false);
      onAdded();
    }
  };

  const triggerButton = triggerVariant === "prominent" ? (
    <Button className="w-full gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 py-3">
      <Plus size={18} /> Add Procedure
    </Button>
  ) : (
    <Button size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
      <Plus size={16} /> Add Procedure
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setFacilityError(false); } }}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Procedure</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <Input placeholder="Procedure name *" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
          <div>
            <Select value={facilityId} onValueChange={(v) => { setFacilityId(v); setFacilityError(false); }}>
              <SelectTrigger className={`bg-secondary border-border text-foreground ${facilityError ? "border-destructive ring-1 ring-destructive" : ""}`}>
                <SelectValue placeholder="Associate with facility *" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {[...facilities].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })).map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {facilityError && (
              <p className="text-xs text-destructive mt-1">Please select a facility</p>
            )}
            {facilities.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">Add a facility first to create a procedure</p>
            )}
          </div>
          <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none" rows={3} />
          <Button onClick={handleSubmit} disabled={!name.trim() || facilities.length === 0 || loading} className="rounded-full">
            {loading ? "Adding..." : "Save Procedure"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProcedureDialog;
