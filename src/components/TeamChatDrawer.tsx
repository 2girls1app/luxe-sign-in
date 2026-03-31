import { useState, useEffect, useRef, useCallback } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, MessageSquare, Clock, Lock, Eye, ChevronDown, ChevronUp } from "lucide-react";

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string | null;
  message: string;
  created_at: string;
  views?: { viewer_id: string; viewer_name: string; viewed_at: string }[];
}

interface TeamChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedureId: string;
  procedureName: string;
}

const TeamChatDrawer = ({ open, onOpenChange, procedureId, procedureName }: TeamChatDrawerProps) => {
  const { user } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [profile, setProfile] = useState<{ name: string; role: string | null }>({ name: "", role: null });
  const [expandedViews, setExpandedViews] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch user profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, role").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) setProfile({ name: data.display_name || "Unknown", role: data.role });
      });
  }, [user]);

  // Fetch or create chat
  const initChat = useCallback(async () => {
    if (!procedureId || !user) return;

    // Find active chat
    const { data: existing } = await supabase
      .from("procedure_chats")
      .select("*")
      .eq("procedure_id", procedureId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      const chat = existing[0];
      const expiry = new Date(chat.expires_at);
      if (expiry > new Date()) {
        setChatId(chat.id);
        setExpiresAt(expiry);
        setIsExpired(false);
        return;
      } else {
        // Mark expired
        await supabase.from("procedure_chats").update({ is_active: false }).eq("id", chat.id);
        setChatId(chat.id);
        setExpiresAt(expiry);
        setIsExpired(true);
      }
    } else {
      setChatId(null);
      setExpiresAt(null);
      setIsExpired(false);
    }
  }, [procedureId, user]);

  useEffect(() => {
    if (open) initChat();
  }, [open, initChat]);

  // Fetch messages
  useEffect(() => {
    if (!chatId) return;
    const fetchMessages = async () => {
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (!msgs) return;

      // Fetch views for all messages
      const msgIds = msgs.map(m => m.id);
      const { data: views } = await supabase
        .from("chat_message_views")
        .select("*")
        .in("message_id", msgIds.length > 0 ? msgIds : ["__none__"]);

      const viewMap: Record<string, { viewer_id: string; viewer_name: string; viewed_at: string }[]> = {};
      views?.forEach(v => {
        if (!viewMap[v.message_id]) viewMap[v.message_id] = [];
        viewMap[v.message_id].push({ viewer_id: v.viewer_id, viewer_name: v.viewer_name, viewed_at: v.viewed_at });
      });

      setMessages(msgs.map(m => ({ ...m, views: viewMap[m.id] || [] })));
    };
    fetchMessages();
  }, [chatId]);

  // Mark messages as viewed
  useEffect(() => {
    if (!chatId || !user || !profile.name || messages.length === 0) return;
    const unviewedIds = messages
      .filter(m => m.sender_id !== user.id && !(m.views || []).some(v => v.viewer_id === user.id))
      .map(m => m.id);

    if (unviewedIds.length === 0) return;

    const markViewed = async () => {
      for (const msgId of unviewedIds) {
        await supabase.from("chat_message_views").upsert({
          message_id: msgId,
          viewer_id: user.id,
          viewer_name: profile.name,
          viewed_at: new Date().toISOString(),
        }, { onConflict: "message_id,viewer_id" });
      }
    };
    markViewed();
  }, [chatId, user, messages, profile.name]);

  // Realtime subscriptions
  useEffect(() => {
    if (!chatId) return;

    const msgChannel = supabase
      .channel(`chat-messages-${chatId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, views: [] }];
          });
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    const viewChannel = supabase
      .channel(`chat-views-${chatId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_message_views" },
        (payload) => {
          const newView = payload.new as any;
          setMessages(prev => prev.map(m =>
            m.id === newView.message_id
              ? { ...m, views: [...(m.views || []), { viewer_id: newView.viewer_id, viewer_name: newView.viewer_name, viewed_at: newView.viewed_at }] }
              : m
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(viewChannel);
    };
  }, [chatId]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("Expired");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m remaining`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => { setTimeout(scrollToBottom, 200); }, [messages]);

  const startChat = async () => {
    if (!user || !procedureId) return;
    const { data, error } = await supabase.from("procedure_chats").insert({
      procedure_id: procedureId,
      created_by: user.id,
    }).select().single();

    if (data && !error) {
      setChatId(data.id);
      setExpiresAt(new Date(data.expires_at));
      setIsExpired(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || !user || isExpired || sending) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      sender_name: profile.name,
      sender_role: profile.role,
      message: newMessage.trim(),
    });
    setNewMessage("");
    setSending(false);
    inputRef.current?.focus();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const toggleViews = (msgId: string) => {
    setExpandedViews(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border max-h-[85vh]">
        <DrawerHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
            <MessageSquare size={24} className="text-primary" />
          </div>
          <DrawerTitle className="text-foreground text-base">Team Chat</DrawerTitle>
          <DrawerDescription className="text-muted-foreground text-xs">
            {procedureName}
          </DrawerDescription>
          {expiresAt && (
            <div className="flex items-center justify-center gap-1.5 mt-1">
              {isExpired ? (
                <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">
                  <Lock size={10} className="mr-1" /> Chat Expired
                </Badge>
              ) : (
                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">
                  <Clock size={10} className="mr-1" /> {timeLeft}
                </Badge>
              )}
            </div>
          )}
        </DrawerHeader>

        <div className="flex flex-col flex-1 min-h-0 px-4">
          {!chatId && !isExpired ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <p className="text-sm text-muted-foreground text-center">
                Start a 12-hour team chat for this case
              </p>
              <Button onClick={startChat} className="gap-2">
                <MessageSquare size={16} /> Start Team Chat
              </Button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pb-3 max-h-[45vh]">
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
                )}
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  const viewsList = (msg.views || []).filter(v => v.viewer_id !== msg.sender_id);
                  const showViews = expandedViews[msg.id];

                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary border border-border rounded-bl-sm"
                      }`}>
                        {!isOwn && (
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-semibold text-primary">{msg.sender_name}</span>
                            {msg.sender_role && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/30">{msg.sender_role}</Badge>
                            )}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className={`text-[9px] mt-0.5 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>

                      {/* Viewed by */}
                      {viewsList.length > 0 && (
                        <button
                          onClick={() => toggleViews(msg.id)}
                          className={`flex items-center gap-1 mt-0.5 px-1 ${isOwn ? "mr-1" : "ml-1"}`}
                        >
                          <Eye size={10} className="text-muted-foreground/60" />
                          <span className="text-[9px] text-muted-foreground/60">
                            Viewed by {viewsList.length}
                          </span>
                          {showViews
                            ? <ChevronUp size={8} className="text-muted-foreground/60" />
                            : <ChevronDown size={8} className="text-muted-foreground/60" />
                          }
                        </button>
                      )}
                      {showViews && viewsList.length > 0 && (
                        <div className={`mt-0.5 px-2 py-1 rounded-lg bg-secondary/50 ${isOwn ? "mr-1" : "ml-1"}`}>
                          {viewsList.map(v => (
                            <p key={v.viewer_id} className="text-[9px] text-muted-foreground/70">
                              {v.viewer_name} · {formatTime(v.viewed_at)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {isExpired ? (
                <div className="flex items-center justify-center gap-2 py-4 border-t border-border">
                  <Lock size={14} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">This chat has expired</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-3 border-t border-border">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                    placeholder="Type a message..."
                    className="flex-1 bg-secondary border border-border rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="rounded-full h-9 w-9 shrink-0"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TeamChatDrawer;
