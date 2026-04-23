'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Send, Search, Phone, Video, MoreVertical, Smile } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Conversation {
  id: string;
  other_user_id: string;
  other_name: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })
        .limit(30);
      
      // Map to our interface
      const convos: Conversation[] = ((data as unknown as Array<Record<string, unknown>>) || []).map((c) => ({
        id: c.id as string,
        other_user_id: (c.user1_id === user.id ? c.user2_id : c.user1_id) as string,
        other_name: (c.user1_id === user.id ? c.user2_name : c.user1_name) as string || 'User',
        last_message: c.last_message as string | null,
        last_message_at: c.updated_at as string | null,
        unread_count: 0,
      }));
      setConversations(convos);
      setLoading(false);
    };
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!activeConversation) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('conversation_id', activeConversation)
        .order('created_at', { ascending: true })
        .limit(100);
      setMessages((data as unknown as Message[]) || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return;
    const content = newMessage.trim();
    setNewMessage('');
    
    // Optimistic update
    const tempMsg: Message = {
      id: Date.now().toString(),
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    await supabase.from('messages').insert({
      conversation_id: activeConversation,
      sender_id: user.id,
      content,
    });
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex gap-6 h-[calc(100vh-10rem)]">
        {/* Sidebar */}
        <div className="w-80 shrink-0 flex flex-col glass-card overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border-light)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Messages</h2>
              <span className="text-xs font-bold text-white bg-[var(--color-brand-pink)] px-2 py-0.5 rounded-full">
                {conversations.length}
              </span>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--color-surface-light)] rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand-pink)]/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-surface-light)] shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-[var(--color-surface-light)] rounded w-2/3 mb-2" />
                      <div className="h-3 bg-[var(--color-surface-light)] rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare size={32} className="mx-auto text-[var(--color-text-muted)] mb-2" />
                <p className="text-sm text-[var(--color-text-muted)]">No conversations yet</p>
              </div>
            ) : (
              conversations
                .filter((c) => !search || c.other_name.toLowerCase().includes(search.toLowerCase()))
                .map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setActiveConversation(convo.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-light)] transition-colors cursor-pointer text-left ${
                      activeConversation === convo.id ? 'bg-[var(--color-surface-light)]' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-brand-pink)] to-[var(--color-secondary)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {convo.other_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{convo.other_name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{convo.last_message || 'No messages yet'}</p>
                    </div>
                    {convo.last_message_at && (
                      <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">{formatTime(convo.last_message_at)}</span>
                    )}
                  </button>
                ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col glass-card overflow-hidden">
          {!activeConversation ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare size={56} className="mx-auto text-[var(--color-text-muted)] mb-4" />
                <h3 className="text-lg font-semibold text-[var(--color-text-secondary)]">Select a Conversation</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">Choose a conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-16 px-5 flex items-center justify-between border-b border-[var(--color-border-light)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-brand-pink)] to-[var(--color-secondary)] flex items-center justify-center text-white font-semibold text-sm">
                    {conversations.find((c) => c.id === activeConversation)?.other_name.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[var(--color-text-primary)]">
                      {conversations.find((c) => c.id === activeConversation)?.other_name || 'User'}
                    </p>
                    <p className="text-xs text-emerald-500">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => showToast('Voice calls are not available on web', 'info')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-text-muted)] cursor-pointer">
                    <Phone size={16} />
                  </button>
                  <button onClick={() => showToast('Video calls are not available on web', 'info')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-text-muted)] cursor-pointer">
                    <Video size={16} />
                  </button>
                  <button onClick={() => showToast('More options coming soon', 'info')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-text-muted)] cursor-pointer">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-[var(--color-primary)] text-white rounded-br-md'
                            : 'bg-[var(--color-surface-light)] text-[var(--color-text-primary)] rounded-bl-md'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-[var(--color-text-muted)]'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[var(--color-border-light)]">
                <div className="flex items-center gap-2">
                  <button onClick={() => showToast('Emoji picker coming soon', 'info')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] transition-colors text-[var(--color-text-muted)] cursor-pointer">
                    <Smile size={20} />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 bg-[var(--color-surface-light)] rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand-pink)]/20"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
