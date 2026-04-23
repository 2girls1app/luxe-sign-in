import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, MapPin, Pencil, Trash2, Home, ChevronDown, ChevronRight,
  Plus, UserPlus, Search, User, Stethoscope, X, Check, Loader2,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import CreateSurgeonDialog from "@/components/CreateSurgeonDialog";

interface Facility {
  id: string;
  name: string;
  location: string | null;
}

interface DoctorRecord {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  specialty: string | null;
}

interface ProcedureRecord {
  id: string;
  name: string;
  category: string | null;
  facility_id: string | null;
  user_id: string;
}

interface FacilityCardExpandedProps {
  facility: Facility;
  isHome: boolean;
  onSetHome: (id: string) => void;
  onEdit: () => void;
  onRemove: () => void;
  expanded?: boolean;
  onToggleExpand?: (id: string) => void;
}

const FacilityCardExpanded = ({
  facility, isHome, onSetHome, onEdit, onRemove,
  expanded: controlledExpanded, onToggleExpand,
}: FacilityCardExpandedProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;
  const toggleExpanded = () => {
    if (isControlled) onToggleExpand?.(facility.id);
    else setInternalExpanded(e => !e);
  };
  const [linkedDoctors, setLinkedDoctors] = useState<DoctorRecord[]>([]);
  const [doctorProcedures, setDoctorProcedures] = useState<Record<string, ProcedureRecord[]>>({});
  const [expandedDoctorId, setExpandedDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [doctorPickerOpen, setDoctorPickerOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [allOwnedDoctors, setAllOwnedDoctors] = useState<DoctorRecord[]>([]);

  const [procDialogOpen, setProcDialogOpen] = useState(false);
  const [procDialogDoctor, setProcDialogDoctor] = useState<DoctorRecord | null>(null);
  const [doctorAllProcedures, setDoctorAllProcedures] = useState<ProcedureRecord[]>([]);
  const [selectedProcIds, setSelectedProcIds] = useState<Set<string>>(new Set());
  const [procSearch, setProcSearch] = useState("");
  const [newProcName, setNewProcName] = useState("");
  const [showNewProcInput, setShowNewProcInput] = useState(false);
  const [attaching, setAttaching] = useState(false);

  const fetchLinkedDoctors = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: links } = await supabase
      .from("doctor_facilities")
      .select("user_id")
      .eq("facility_id", facility.id);
    const ids = (links || []).map((l: any) => l.user_id).filter((id: string) => id !== user.id);
    if (ids.length === 0) {
      setLinkedDoctors([]);
      setDoctorProcedures({});
      setLoading(false);
      return;
    }
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, specialty")
      .in("user_id", ids);
    const sortedProfs = (profs || []).sort((a, b) =>
      (a.display_name || "").localeCompare(b.display_name || "")
    );
    setLinkedDoctors(sortedProfs);

    const { data: procs } = await supabase
      .from("procedures")
      .select("id, name, category, facility_id, user_id")
      .in("user_id", ids)
      .eq("facility_id", facility.id);
    const grouped: Record<string, ProcedureRecord[]> = {};
    (procs || []).forEach((p: any) => {
      if (!grouped[p.user_id]) grouped[p.user_id] = [];
      grouped[p.user_id].push(p);
    });
    Object.keys(grouped).forEach(k => grouped[k].sort((a, b) => a.name.localeCompare(b.name)));
    setDoctorProcedures(grouped);
    setLoading(false);
  }, [user, facility.id]);

  const fetchAllOwnedDoctors = useCallback(async () => {
    if (!user) return;
    const { data: ownedFacs } = await supabase
      .from("facilities")
      .select("id")
      .eq("user_id", user.id);
    const facIds = (ownedFacs || []).map((f: any) => f.id);
    if (facIds.length === 0) {
      setAllOwnedDoctors([]);
      return;
    }
    const { data: links } = await supabase
      .from("doctor_facilities")
      .select("user_id")
      .in("facility_id", facIds);
    const docIds = Array.from(new Set((links || []).map((l: any) => l.user_id))).filter(
      (id: string) => id !== user.id
    );
    if (docIds.length === 0) {
      setAllOwnedDoctors([]);
      return;
    }
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, specialty")
      .in("user_id", docIds);
    setAllOwnedDoctors(
      (profs || []).sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""))
    );
  }, [user]);

  useEffect(() => {
    if (expanded) {
      fetchLinkedDoctors();
    }
  }, [expanded, fetchLinkedDoctors]);

  const linkExistingDoctor = async (doctor: DoctorRecord) => {
    if (!user) return;
    const { error } = await supabase
      .from("doctor_facilities")
      .insert({ user_id: doctor.user_id, facility_id: facility.id });
    if (error && error.code !== "23505") {
      toast({ title: "Error linking doctor", description: error.message, variant: "destructive" });
      return;
    }
    setDoctorPickerOpen(false);
    setDoctorSearch("");
    await fetchLinkedDoctors();
    toast({ title: "Doctor added to facility" });

    openAttachProcedures(doctor);
  };

  const openAttachProcedures = async (doctor: DoctorRecord) => {
    setProcDialogDoctor(doctor);
    setProcDialogOpen(true);
    setSelectedProcIds(new Set());
    setProcSearch("");
    setNewProcName("");
    setShowNewProcInput(false);
    const { data } = await supabase
      .from("procedures")
      .select("id, name, category, facility_id, user_id")
      .eq("user_id", doctor.user_id)
      .order("name");
    const existingAtThisFacility = new Set(
      (doctorProcedures[doctor.user_id] || []).map(p => p.name.toLowerCase())
    );
    setDoctorAllProcedures(
      (data || []).filter(
        (p: any) =>
          p.facility_id !== facility.id &&
          !existingAtThisFacility.has(p.name.toLowerCase())
      )
    );
  };

  const toggleProcSelection = (id: string) => {
    setSelectedProcIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const attachProcedures = async () => {
    if (!user || !procDialogDoctor) return;
    setAttaching(true);
    try {
      for (const procId of selectedProcIds) {
        const source = doctorAllProcedures.find(p => p.id === procId);
        if (!source) continue;
        const { data: newProc, error: procErr } = await supabase
          .from("procedures")
          .insert({
            user_id: procDialogDoctor.user_id,
            name: source.name,
            category: source.category,
            facility_id: facility.id,
          })
          .select("id")
          .single();
        if (procErr || !newProc) continue;

        const { data: prefs } = await supabase
          .from("procedure_preferences")
          .select("category, value")
          .eq("procedure_id", source.id);
        if (prefs && prefs.length > 0) {
          await supabase.from("procedure_preferences").insert(
            prefs.map(p => ({
              procedure_id: newProc.id,
              user_id: procDialogDoctor.user_id,
              category: p.category,
              value: p.value,
            }))
          );
        }
      }

      if (newProcName.trim()) {
        await supabase.from("procedures").insert({
          user_id: procDialogDoctor.user_id,
          name: newProcName.trim(),
          category: procDialogDoctor.specialty,
          facility_id: facility.id,
        });
      }

      toast({ title: "Procedures attached" });
      setProcDialogOpen(false);
      setProcDialogDoctor(null);
      setSelectedProcIds(new Set());
      setNewProcName("");
      await fetchLinkedDoctors();
    } catch (err: any) {
      toast({ title: "Error attaching procedures", description: err.message, variant: "destructive" });
    } finally {
      setAttaching(false);
    }
  };

  const removeDoctorLink = async (doctorUserId: string) => {
    if (!user) return;
    if (!confirm("Remove this doctor from the facility? The doctor record itself stays in your workspace.")) return;
    await supabase
      .from("doctor_facilities")
      .delete()
      .eq("user_id", doctorUserId)
      .eq("facility_id", facility.id);
    await fetchLinkedDoctors();
    toast({ title: "Doctor removed from facility" });
  };

  const removeProcedureLink = async (procId: string) => {
    if (!confirm("Remove this procedure from the doctor at this facility?")) return;
    await supabase.from("procedure_preferences").delete().eq("procedure_id", procId);
    await supabase.from("procedure_files").delete().eq("procedure_id", procId);
    await supabase.from("procedure_favorites").delete().eq("procedure_id", procId);
    await supabase.from("procedures").delete().eq("id", procId);
    await fetchLinkedDoctors();
    toast({ title: "Procedure removed" });
  };

  const handleDoctorPickerOpenChange = (open: boolean) => {
    setDoctorPickerOpen(open);
    if (open) fetchAllOwnedDoctors();
    else setDoctorSearch("");
  };

  const linkedDoctorIds = new Set(linkedDoctors.map(d => d.user_id));
  const filteredOwnedDoctors = allOwnedDoctors.filter(d => {
    if (linkedDoctorIds.has(d.user_id)) return false;
    const q = doctorSearch.toLowerCase();
    return (d.display_name || "").toLowerCase().includes(q) ||
           (d.specialty || "").toLowerCase().includes(q);
  });

  const filteredAttachable = doctorAllProcedures.filter(p =>
    p.name.toLowerCase().includes(procSearch.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(procSearch.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-xl bg-card border ${isHome ? "border-primary/60 ring-1 ring-primary/30" : "border-border"} overflow-hidden`}
    >
      <div className="flex items-center justify-between p-4 hover:border-primary/40 transition-all">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {expanded ? (
            <ChevronDown size={16} className="text-primary shrink-0" />
          ) : (
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-foreground font-medium text-sm truncate">{facility.name}</p>
              {isHome && (
                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5 shrink-0">
                  Home
                </span>
              )}
            </div>
            {facility.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                <MapPin size={12} className="text-primary shrink-0" /> {facility.location}
              </p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); onSetHome(facility.id); }}
            className={`transition-colors p-1 ${isHome ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            aria-label={isHome ? "Unset home" : "Set as home"}
            title={isHome ? "Home facility" : "Set as home"}
          >
            <Home size={14} fill={isHome ? "currentColor" : "none"} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
            aria-label="Edit facility"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            aria-label="Remove facility"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/60 bg-secondary/20"
          >
            <div className="p-4 flex flex-col gap-3">
              <Popover open={doctorPickerOpen} onOpenChange={handleDoctorPickerOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 rounded-lg border-dashed border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <UserPlus size={14} /> Add Doctor
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 bg-card border-border" align="start">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        autoFocus
                        placeholder="Search your doctors..."
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                        className="pl-8 h-9 text-sm bg-secondary border-border"
                      />
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {filteredOwnedDoctors.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-center text-muted-foreground">
                        {allOwnedDoctors.length === 0
                          ? "No doctors yet"
                          : doctorSearch
                            ? "No matches"
                            : "All your doctors are already linked here"}
                      </p>
                    ) : (
                      filteredOwnedDoctors.map(doc => (
                        <button
                          key={doc.user_id}
                          onClick={() => linkExistingDoctor(doc)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-primary/10 transition-colors"
                        >
                          <Avatar className="h-7 w-7 shrink-0">
                            {doc.avatar_url ? <AvatarImage src={doc.avatar_url} /> : null}
                            <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                              {(doc.display_name || "?").split(" ").map(n => n.charAt(0).toUpperCase()).slice(0, 2).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{doc.display_name}</p>
                            {doc.specialty && (
                              <p className="text-[10px] text-primary truncate">{doc.specialty}</p>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="border-t border-border p-2">
                    <div onClick={() => setDoctorPickerOpen(false)}>
                      <CreateSurgeonDialog
                        onCreated={() => { fetchLinkedDoctors(); fetchAllOwnedDoctors(); }}
                        facilityId={facility.id}
                        isIndividual
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {loading ? (
                <div className="flex justify-center py-3">
                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                </div>
              ) : linkedDoctors.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <User size={20} className="mx-auto text-muted-foreground mb-1.5" />
                  <p className="text-xs text-muted-foreground">No doctors linked yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {linkedDoctors.map(doc => {
                    const procs = doctorProcedures[doc.user_id] || [];
                    const isDocExpanded = expandedDoctorId === doc.user_id;
                    return (
                      <div
                        key={doc.user_id}
                        className="rounded-lg bg-card border border-border overflow-hidden"
                      >
                        <div className="flex items-center gap-2 p-2.5">
                          <button
                            onClick={() => setExpandedDoctorId(isDocExpanded ? null : doc.user_id)}
                            className="flex items-center gap-2 flex-1 min-w-0 text-left"
                          >
                            {isDocExpanded ? (
                              <ChevronDown size={14} className="text-primary shrink-0" />
                            ) : (
                              <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                            )}
                            <Avatar className="h-7 w-7 border border-border shrink-0">
                              {doc.avatar_url ? <AvatarImage src={doc.avatar_url} /> : null}
                              <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                                {(doc.display_name || "?").split(" ").map(n => n.charAt(0).toUpperCase()).slice(0, 2).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{doc.display_name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {procs.length} procedure{procs.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() => openAttachProcedures(doc)}
                            className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors"
                            aria-label="Attach procedures"
                            title="Attach procedures"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => removeDoctorLink(doc.user_id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Remove doctor link"
                            title="Remove from facility"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <AnimatePresence initial={false}>
                          {isDocExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="border-t border-border/60 bg-secondary/30"
                            >
                              <div className="p-2 flex flex-col gap-1">
                                {procs.length === 0 ? (
                                  <p className="text-[11px] text-muted-foreground text-center py-2">
                                    No procedures attached. Tap + to add.
                                  </p>
                                ) : (
                                  procs.map(p => (
                                    <div
                                      key={p.id}
                                      className="flex items-center gap-2 rounded-md bg-background/50 px-2.5 py-1.5 group"
                                    >
                                      <Stethoscope size={12} className="text-primary shrink-0" />
                                      <button
                                        onClick={() => navigate(`/procedure/${p.id}/preferences`)}
                                        className="flex-1 min-w-0 text-left text-xs text-foreground hover:text-primary truncate transition-colors"
                                      >
                                        {p.name}
                                      </button>
                                      <button
                                        onClick={() => removeProcedureLink(p.id)}
                                        className="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                        aria-label="Remove procedure"
                                        title="Remove procedure"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={procDialogOpen} onOpenChange={setProcDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Attach Procedures
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              {procDialogDoctor?.display_name} at {facility.name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                From this doctor's other procedures
              </p>
              {doctorAllProcedures.length > 3 && (
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={procSearch}
                    onChange={(e) => setProcSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-secondary border-border"
                  />
                </div>
              )}
              <div className="max-h-44 overflow-y-auto flex flex-col gap-1">
                {doctorAllProcedures.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-2">
                    No other procedures available to attach.
                  </p>
                ) : filteredAttachable.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-2">No matches.</p>
                ) : (
                  filteredAttachable.map(p => {
                    const sel = selectedProcIds.has(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleProcSelection(p.id)}
                        className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-all ${
                          sel
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary hover:border-primary/40"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center shrink-0 ${
                            sel ? "border-primary bg-primary" : "border-muted-foreground/40"
                          }`}
                        >
                          {sel && <Check size={10} className="text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                          {p.category && (
                            <p className="text-[10px] text-primary truncate">{p.category}</p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="border-t border-border pt-3">
              {!showNewProcInput ? (
                <button
                  onClick={() => setShowNewProcInput(true)}
                  className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus size={14} /> Add New Procedure
                </button>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    New procedure
                  </p>
                  <Input
                    autoFocus
                    placeholder="Procedure name"
                    value={newProcName}
                    onChange={(e) => setNewProcName(e.target.value)}
                    className="h-9 text-sm bg-secondary border-border"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={attachProcedures}
              disabled={
                attaching ||
                (selectedProcIds.size === 0 && !newProcName.trim())
              }
              className="rounded-full mt-1"
            >
              {attaching
                ? "Attaching..."
                : `Attach ${selectedProcIds.size + (newProcName.trim() ? 1 : 0) || ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default FacilityCardExpanded;
