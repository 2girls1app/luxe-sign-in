import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Stethoscope, ClipboardList, Bell, Shield, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const WIDGETS = [
  { id: "users", icon: Users, label: "Users", desc: "Manage all users & access", route: "/admin/users" },
  { id: "doctors", icon: Stethoscope, label: "Doctors", desc: "Doctor profiles & procedures", route: "/admin/doctors" },
  { id: "prefcards", icon: ClipboardList, label: "Preference Cards", desc: "View & manage pref cards", route: "/admin/preference-cards" },
  { id: "notifications", icon: Bell, label: "Notifications", desc: "Send team announcements", route: "/admin/notifications" },
];

const AdminDashboardSection = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchCounts = useCallback(async () => {
    const [usersRes, procsRes, notifsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("procedures").select("id", { count: "exact", head: true }),
      supabase.from("admin_notifications" as any).select("id", { count: "exact", head: true }),
    ]);
    setCounts({
      users: usersRes.count || 0,
      doctors: 0,
      prefcards: procsRes.count || 0,
      notifications: notifsRes.count || 0,
    });
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-primary" />
        <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Admin Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {WIDGETS.map((w, i) => {
          const Icon = w.icon;
          const count = counts[w.id];
          return (
            <motion.button
              key={w.id}
              onClick={() => navigate(w.route)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-4 transition-all text-center hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.97]"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon size={18} className="text-primary" />
              </div>
              <p className="text-xs font-medium text-foreground">{w.label}</p>
              {count !== undefined && count > 0 && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 absolute top-2 right-2">
                  {count}
                </Badge>
              )}
              <p className="text-[10px] text-muted-foreground leading-tight">{w.desc}</p>
              <ChevronRight size={12} className="absolute right-2 bottom-2 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboardSection;
