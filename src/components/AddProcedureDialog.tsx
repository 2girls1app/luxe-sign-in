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
}

const AddProcedureDialog = ({ facilities, onAdded }: AddProcedureDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [facilityId, setFacilityId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase.from("procedures").insert({
      user_id: user.id,
      name: name.trim(),
      category: category.trim() || null,
      facility_id: facilityId || null,
      notes: notes.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error adding procedure", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Procedure added" });
      setName(""); setCategory(""); setFacilityId(""); setNotes("");
      setOpen(false);
      onAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} /> Add Procedure
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Procedure</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <Input placeholder="Procedure name *" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
          <Input placeholder="Category / Specialty" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
          {facilities.length > 0 && (
            <Select value={facilityId} onValueChange={setFacilityId}>
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue placeholder="Associate with facility" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none" rows={3} />
          <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="rounded-full">
            {loading ? "Adding..." : "Save Procedure"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProcedureDialog;
