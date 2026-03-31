import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import NavHeader from "@/components/NavHeader";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  specialty: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin) {
      supabase.from("profiles").select("*").order("created_at", { ascending: false })
        .then(({ data }) => { if (data) setUsers(data as UserProfile[]); });
    }
  }, [isAdmin, loading]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const filtered = users.filter(u =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground transition-colors p-1"><ArrowLeft size={20} /></button>
          <Users size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">User Management</h1>
          <Badge variant="secondary" className="ml-auto text-xs">{users.length} users</Badge>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-2">
          {filtered.map(u => (
            <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 rounded-xl bg-card border border-border p-4">
              <Avatar className="h-10 w-10 border border-border">
                {u.avatar_url ? <AvatarImage src={u.avatar_url} /> : null}
                <AvatarFallback className="bg-secondary text-foreground text-sm">{(u.display_name || "U").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{u.display_name || "Unnamed"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px]">{u.role || "No role"}</Badge>
                  {u.specialty && <span className="text-[10px] text-primary">{u.specialty}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-muted-foreground">Joined</p>
                <p className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</p>
              </div>
              <Badge variant={u.onboarding_completed ? "default" : "secondary"} className="text-[10px]">
                {u.onboarding_completed ? "Active" : "Pending"}
              </Badge>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No users found</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminUsers;
