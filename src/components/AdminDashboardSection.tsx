import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Stethoscope, Bell, Shield, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const WIDGETS = [
  { id: "users", icon: Users, label: "Users", desc: "Manage all users & access", route: "/admin/users" },
  { id: "doctors", icon: Stethoscope, label: "Doctors", desc: "Doctor profiles & procedures", route: "/admin/doctors" },
  { id: "notifications", icon: Bell, label: "Notifications", desc: "Send team announcements", route: "/admin/notifications" },
];

const AdminDashboardSection = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchCounts = useCallback(async () => {
    const [usersRes, notifsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("admin_notifications" as any).select("id", { count: "exact", head: true }),
    ]);
    setCounts({
      users: usersRes.count || 0,
      doctors: 0,
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

      <div className="flex flex-col gap-3">
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
              className="group relative flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98] text-left w-full"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon size={20} className="text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-medium text-foreground">{w.label}</p>
                <p className="text-xs text-muted-foreground">{w.desc}</p>
              </div>
              {count !== undefined && count > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-auto mr-6 shrink-0">
                  {count}
                </Badge>
              )}
              <ChevronRight size={16} className="absolute right-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboardSection;
