import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bell, Settings, Heart, MapPin, Plus, FileText, Trash2, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationsDrawer from "@/components/NotificationsDrawer";

interface Facility {
  id: string;
  name: string;
  location: string | null;
}

interface FacilityDocument {
  id: string;
  title: string;
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  target_role: string | null;
  is_favorite: boolean;
  created_at: string;
}

const ROLES = [
  { value: "all", label: "All Roles" },
  { value: "physician-assistant", label: "Physician Assistant" },
  { value: "first-assist", label: "First Assist" },
  { value: "nurse", label: "Nurse" },
  { value: "anesthesia", label: "Anesthesia" },
];

const FacilityDetail = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [documents, setDocuments] = useState<FacilityDocument[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [showFavorites, setShowFavorites] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocRole, setNewDocRole] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchFacility = useCallback(async () => {
    if (!facilityId || !user) return;
    const { data } = await supabase
      .from("facilities")
      .select("id, name, location")
      .eq("id", facilityId)
      .eq("user_id", user.id)
      .single();
    if (data) setFacility(data);
  }, [facilityId, user]);

  const fetchDocuments = useCallback(async () => {
    if (!facilityId || !user) return;
    const { data } = await supabase
      .from("facility_documents")
      .select("id, title, description, file_path, file_name, target_role, is_favorite, created_at")
      .eq("facility_id", facilityId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setDocuments(data as FacilityDocument[]);
  }, [facilityId, user]);

  const fetchPendingCount = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("pending_preference_changes")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingCount(count ?? 0);
  }, [user]);

  useEffect(() => {
    fetchFacility();
    fetchDocuments();
    fetchPendingCount();
  }, [fetchFacility, fetchDocuments, fetchPendingCount]);

  const toggleFavorite = async (docId: string, current: boolean) => {
    const { error } = await supabase
      .from("facility_documents")
      .update({ is_favorite: !current } as any)
      .eq("id", docId);
    if (!error) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, is_favorite: !current } : d))
      );
    }
  };

  const deleteDocument = async (docId: string) => {
    const { error } = await supabase.from("facility_documents").delete().eq("id", docId);
    if (!error) fetchDocuments();
    else toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const handleAddDocument = async () => {
    if (!newDocTitle.trim() || !user || !facilityId) return;
    setUploading(true);

    let filePath = null;
    let fileName = null;
    let mimeType = null;
    let fileSize = null;

    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop();
      const path = `facility-docs/${user.id}/${facilityId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("procedure-files")
        .upload(path, selectedFile);
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        setUploading(false);
        return;
      }
      filePath = path;
      fileName = selectedFile.name;
      mimeType = selectedFile.type;
      fileSize = selectedFile.size;
    }

    const { error } = await supabase.from("facility_documents").insert({
      facility_id: facilityId,
      user_id: user.id,
      title: newDocTitle.trim(),
      target_role: newDocRole || null,
      file_path: filePath,
      file_name: fileName,
      mime_type: mimeType,
      file_size: fileSize,
    } as any);

    setUploading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document added" });
      setNewDocTitle("");
      setNewDocRole("");
      setSelectedFile(null);
      setAddDocOpen(false);
      fetchDocuments();
    }
  };

  const filteredDocs = documents
    .filter((d) => {
      if (roleFilter !== "all" && d.target_role && d.target_role !== roleFilter) return false;
      if (showFavorites && !d.is_favorite) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return 0;
    });

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-xs font-medium">BACK</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell size={20} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1">
                {pendingCount}
              </span>
            )}
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm mx-auto flex flex-col gap-6"
      >
        {/* Facility Info */}
        {facility && (
          <div>
            <h1 className="text-xl font-semibold text-foreground">{facility.name}</h1>
            {facility.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin size={14} className="text-primary" />
                {facility.location}
              </p>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Documents Repository Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
            <FileText size={16} className="text-primary" /> Documents Repository
          </h2>
          <Dialog open={addDocOpen} onOpenChange={setAddDocOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus size={16} /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-sm">
              <DialogHeader>
                <DialogTitle>Add Document</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <Input
                  placeholder="Document title *"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                <Select value={newDocRole} onValueChange={setNewDocRole}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Assign to role (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.slice(1).map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Upload size={16} />
                  {selectedFile ? selectedFile.name : "Attach file (optional)"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </label>
                <Button
                  onClick={handleAddDocument}
                  disabled={!newDocTitle.trim() || uploading}
                  className="rounded-full"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {uploading ? "Uploading..." : "Save Document"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-auto min-w-[140px] rounded-xl border-border bg-card text-foreground h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              showFavorites
                ? "bg-primary/15 border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart size={12} className={showFavorites ? "fill-primary" : ""} />
            Your Favorites
          </button>
        </div>

        {/* Role pills */}
        <div className="flex flex-wrap gap-2">
          {ROLES.slice(1).map((r) => (
            <button
              key={r.value}
              onClick={() => setRoleFilter(roleFilter === r.value ? "all" : r.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                roleFilter === r.value
                  ? "bg-primary/15 border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Document Grid */}
        {filteredDocs.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-10 text-center">
            <FileText size={36} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {documents.length === 0 ? "No documents added yet" : "No documents match filters"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {filteredDocs.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative rounded-xl bg-card border border-border p-4 flex flex-col items-center gap-3 group"
                >
                  {/* Favorite */}
                  <button
                    onClick={() => toggleFavorite(doc.id, doc.is_favorite)}
                    className="absolute top-3 right-3 transition-colors"
                  >
                    <Heart
                      size={14}
                      className={
                        doc.is_favorite
                          ? "fill-primary text-primary"
                          : "text-muted-foreground hover:text-primary"
                      }
                    />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={12} />
                  </button>

                  {/* Doc icon */}
                  <div className="w-12 h-14 rounded-lg bg-secondary border border-border flex items-center justify-center mt-2">
                    <FileText size={20} className="text-muted-foreground" />
                  </div>

                  {/* Title */}
                  <p className="text-xs font-medium text-foreground text-center line-clamp-2">
                    {doc.title}
                  </p>

                  {/* Role badge */}
                  {doc.target_role && (
                    <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {ROLES.find((r) => r.value === doc.target_role)?.label || doc.target_role}
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <NotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        onCountChange={setPendingCount}
      />
    </div>
  );
};

export default FacilityDetail;
