import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { useSessionStore } from '@/entities/session';
import {
  useAiChatsQuery,
  useCreateAiChatMutation,
  useRenameAiChatMutation,
  useDeleteAiChatMutation,
  useAiMessagesQuery,
  useInsertAiMessageMutation,
  useAiSummariesQuery,
  useDeleteSummaryMutation,
  getSystemPrompt,
  type AiStyleType,
  type AiMessageModel,
} from '@/entities/ai';
import { useJournalEntryCountQuery } from '@/entities/journal';
import { OpenRouterClient } from '@/shared/api';
import { supabase } from '@/shared/api';
import { Button, Input, BottomSheet, EmptyState } from '@/shared/ui';
import { MessageSquare, Sparkles, FileText, Send, Plus, Trash2, Edit3, AlertCircle, Settings, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabId = 'chat' | 'summaries' | 'prompts';
type PromptCategory = 'analysis' | 'emotions' | 'growth' | 'relapse';

const CATEGORY_INFO: Record<PromptCategory, { color: string; bg: string }> = {
  analysis: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
  emotions: { color: 'text-pink-500', bg: 'bg-pink-500/10' },
  growth: { color: 'text-green-500', bg: 'bg-green-500/10' },
  relapse: { color: 'text-amber-500', bg: 'bg-amber-500/10' },
};

const CATEGORY_LABEL_KEYS: Record<PromptCategory, string> = {
  analysis: 'aiPromptsFilterAnalysis',
  emotions: 'aiPromptsFilterEmotions',
  growth: 'aiPromptsFilterGrowth',
  relapse: 'aiPromptsFilterRelapse',
};

interface SystemPromptMeta {
  titleKey: string;
  descKey: string;
  emoji: string;
  category: PromptCategory;
}

const SYSTEM_PROMPTS_META: SystemPromptMeta[] = [
  { titleKey: 'aiPromptSystem1Title', descKey: 'aiPromptSystem1Desc', emoji: '📊', category: 'analysis' },
  { titleKey: 'aiPromptSystem2Title', descKey: 'aiPromptSystem2Desc', emoji: '🔍', category: 'analysis' },
  { titleKey: 'aiPromptSystem3Title', descKey: 'aiPromptSystem3Desc', emoji: '🛡️', category: 'relapse' },
  { titleKey: 'aiPromptSystem4Title', descKey: 'aiPromptSystem4Desc', emoji: '🌱', category: 'growth' },
  { titleKey: 'aiPromptSystem5Title', descKey: 'aiPromptSystem5Desc', emoji: '🗺️', category: 'emotions' },
  { titleKey: 'aiPromptSystem6Title', descKey: 'aiPromptSystem6Desc', emoji: '🧬', category: 'analysis' },
  { titleKey: 'aiPromptSystem7Title', descKey: 'aiPromptSystem7Desc', emoji: '📈', category: 'growth' },
  { titleKey: 'aiPromptSystem8Title', descKey: 'aiPromptSystem8Desc', emoji: '🎯', category: 'analysis' },
  { titleKey: 'aiPromptSystem9Title', descKey: 'aiPromptSystem9Desc', emoji: '⏰', category: 'growth' },
  { titleKey: 'aiPromptSystem10Title', descKey: 'aiPromptSystem10Desc', emoji: '👑', category: 'growth' },
  { titleKey: 'aiPromptSystem11Title', descKey: 'aiPromptSystem11Desc', emoji: '🔥', category: 'growth' },
  { titleKey: 'aiPromptSystem12Title', descKey: 'aiPromptSystem12Desc', emoji: '🧨', category: 'relapse' },
  { titleKey: 'aiPromptSystem13Title', descKey: 'aiPromptSystem13Desc', emoji: '🏛️', category: 'growth' },
  { titleKey: 'aiPromptSystem14Title', descKey: 'aiPromptSystem14Desc', emoji: '💌', category: 'emotions' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      <span className="w-1.5 h-1.5 rounded-full bg-hf-text-secondary animate-pulse" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-hf-text-secondary animate-pulse" style={{ animationDelay: '200ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-hf-text-secondary animate-pulse" style={{ animationDelay: '400ms' }} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AiHubPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  const [activeTab, setActiveTab] = useState<TabId>('chat');

  // OpenRouter Key
  const [openRouterKey, setOpenRouterKey] = useState<string | null>(null);
  useEffect(() => {
    const key = localStorage.getItem('openrouter_key');
    setOpenRouterKey(key);
  }, []);

  // Chats
  const { data: chats } = useAiChatsQuery(userId);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      const first = chats[0];
      if (first) setSelectedChatId(first.id);
    }
  }, [chats, selectedChatId]);

  const activeChat = chats?.find((c) => c.id === selectedChatId);

  // Messages
  const { data: dbMessages } = useAiMessagesQuery(selectedChatId || undefined, userId);

  // Journal count
  const { data: journalCount = 0 } = useJournalEntryCountQuery(userId);

  // AI Style
  const [aiStyle, setAiStyle] = useState<AiStyleType>('coach');

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('users')
      .select('ai_style')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.ai_style) setAiStyle(data.ai_style as AiStyleType);
      });
  }, [userId]);

  // Chat mutations
  const createChatMutation = useCreateAiChatMutation(userId || '');
  const renameChatMutation = useRenameAiChatMutation(userId || '');
  const deleteChatMutation = useDeleteAiChatMutation(userId || '');
  const insertMessageMutation = useInsertAiMessageMutation(userId || '', selectedChatId || '');

  const [chatRenameTitle, setChatRenameTitle] = useState('');
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isManageChatsOpen, setIsManageChatsOpen] = useState(false);

  const handleCreateChat = async (title?: string) => {
    try {
      const newChat = await createChatMutation.mutateAsync(title || t('aiChatNew'));
      setSelectedChatId(newChat.id);
      setIsManageChatsOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameChat = async () => {
    if (!selectedChatId || !chatRenameTitle.trim()) return;
    try {
      await renameChatMutation.mutateAsync({ chatId: selectedChatId, title: chatRenameTitle });
      setIsRenameOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (confirm(t('aiChatDeleteConfirmText'))) {
      try {
        await deleteChatMutation.mutateAsync(chatId);
        if (selectedChatId === chatId) setSelectedChatId(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Streaming
  const [inputText, setInputText] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const messages: (AiMessageModel | { id: string; role: 'assistant'; content: string })[] = useMemo(() => {
    const list: (AiMessageModel | { id: string; role: 'assistant'; content: string })[] = dbMessages ? [...dbMessages] : [];
    if (streamingText || isStreaming) {
      list.push({ id: 'streaming-temp', role: 'assistant', content: streamingText || '...' });
    }
    return list;
  }, [dbMessages, streamingText, isStreaming]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !selectedChatId || !userId) return;

    if (!openRouterKey) {
      alert(t('aiChatNoKeyText'));
      return;
    }

    if (!textToSend) setInputText('');

    setIsStreaming(true);
    setStreamingText('');

    try {
      await insertMessageMutation.mutateAsync({ role: 'user', content: text });

      const history: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];
      history.push({ role: 'system', content: getSystemPrompt(aiStyle, t('languageEnglish') === 'English' ? 'en' : 'ru') });

      const contextMsgs = dbMessages || [];
      contextMsgs.slice(-10).forEach((m) => {
        history.push({ role: m.role, content: m.content });
      });
      history.push({ role: 'user', content: text });

      const client = new OpenRouterClient(openRouterKey);
      let fullReply = '';

      await client.chatCompletionStream(history, 'google/gemini-2.5-flash', (chunk) => {
        fullReply += chunk;
        setStreamingText(fullReply);
      });

      await insertMessageMutation.mutateAsync({ role: 'assistant', content: fullReply });
    } catch (e) {
      console.error(e);
      alert(t('aiChatErrorGeneric'));
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }
  };

  // Summaries
  const { data: summaries, isLoading: isLoadingSummaries } = useAiSummariesQuery(userId);
  const deleteSummaryMutation = useDeleteSummaryMutation(userId || '');

  const handleDeleteSummary = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(t('aiPromptDeleteConfirmText'))) {
      try {
        await deleteSummaryMutation.mutateAsync(id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Prompts
  const [promptFilter, setPromptFilter] = useState<PromptCategory | 'all'>('all');

  const filteredPrompts = useMemo(() => {
    if (promptFilter === 'all') return SYSTEM_PROMPTS_META;
    return SYSTEM_PROMPTS_META.filter((p) => p.category === promptFilter);
  }, [promptFilter]);

  const handlePromptClick = async (titleKey: string, descKey: string) => {
    try {
      const title = t(titleKey);
      const desc = t(descKey);
      const newChat = await createChatMutation.mutateAsync(title);
      setSelectedChatId(newChat.id);
      setActiveTab('chat');
      setTimeout(() => {
        handleSend(desc);
      }, 500);
    } catch (e) {
      console.error(e);
    }
  };

  // Group messages by date for time separators
  const groupedMessages = useMemo(() => {
    const groups: { date: string; msgs: typeof messages }[] = [];
    for (const m of messages) {
      let dateStr: string;
      try {
        const dt = 'created_at' in m ? new Date((m as AiMessageModel).created_at) : new Date();
        dateStr = dt.toLocaleDateString();
      } catch {
        dateStr = 'Today';
      }
      const last = groups[groups.length - 1];
      if (last && last.date === dateStr) {
        last.msgs.push(m);
      } else {
        groups.push({ date: dateStr, msgs: [m] });
      }
    }
    return groups;
  }, [messages]);

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary pt-tg-safe-top text-hf-text-primary pb-tg-safe-bottom overflow-hidden">
      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <h1 className="text-hf-headline-md text-hf-text-primary">{t('aiScreenTitle')}</h1>
        <button
          onClick={() => navigate('/profile/ai-settings')}
          className="w-9 h-9 rounded-hf-md bg-hf-bg-secondary flex items-center justify-center text-hf-text-secondary hover:opacity-80 active:scale-95 transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Tab chips */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto shrink-0 scrollbar-none">
        {([
          { id: 'chat' as TabId, icon: MessageSquare, label: t('aiChatTab') },
          { id: 'summaries' as TabId, icon: FileText, label: t('aiSummariesTab') },
          { id: 'prompts' as TabId, icon: Sparkles, label: t('aiPromptsTab') },
        ] as const).map((tab) => {
          const selected = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-hf-full text-hf-label-sm shrink-0 transition-all ${
                selected
                  ? 'bg-hf-accent text-white'
                  : 'bg-hf-bg-secondary text-hf-text-secondary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* ============================================================== */}
        {/* CHAT TAB */}
        {/* ============================================================== */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat selector + new chat */}
            <div className="px-4 py-2 flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsManageChatsOpen(true)}
                className="flex-1 flex items-center justify-between bg-hf-bg-secondary border border-hf-border/10 rounded-hf-lg px-3 py-2 text-hf-body-sm text-hf-text-primary truncate"
              >
                <span className="truncate">
                  {activeChat?.title || t('aiChatNew')}
                </span>
                <ChevronDown className="w-4 h-4 text-hf-text-secondary shrink-0 ml-1" />
              </button>
              <button
                onClick={() => handleCreateChat()}
                className="w-10 h-10 rounded-full bg-hf-accent flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* API Key warning */}
            {!openRouterKey && (
              <div className="mx-4 my-2 bg-hf-danger/10 border border-hf-danger/20 rounded-hf-lg p-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-hf-danger shrink-0" />
                  <span className="text-hf-body-sm text-hf-danger">{t('aiChatNoKeyText')}</span>
                </div>
                <button
                  onClick={() => navigate('/profile/ai-settings')}
                  className="px-3 py-1.5 bg-hf-danger text-white rounded-hf-md text-hf-label-sm hover:opacity-90 active:scale-95 transition-all shrink-0"
                >
                  {t('emptyNoKeyCta')}
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
              {messages.length === 0 ? (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 gap-4">
                  <span className="text-[72px] leading-none select-none">🧠</span>
                  <div>
                    <h3 className="text-hf-headline-sm text-hf-text-primary">HabitFlow AI Hub</h3>
                    <p className="text-hf-body-sm text-hf-text-secondary mt-1.5 max-w-[260px]">
                      {t('aiChatDisclaimerText')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
                    {[
                      t('aiChatSuggestion1'),
                      t('aiChatSuggestion2'),
                      t('aiChatSuggestion3'),
                      t('aiChatSuggestion4'),
                    ].map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="w-full text-left p-3 bg-hf-bg-secondary/60 border border-hf-border/10 rounded-hf-lg text-hf-body-sm text-hf-text-primary hover:bg-hf-bg-secondary active:scale-[0.99] transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Message groups with time separators */
                groupedMessages.map((group, gi) => (
                  <div key={gi} className="flex flex-col gap-2">
                    {/* Time separator */}
                    <div className="flex items-center justify-center my-2">
                      <span className="text-hf-label-sm text-hf-text-tertiary px-3 py-0.5 rounded-hf-full bg-hf-bg-secondary/50">
                        {group.date}
                      </span>
                    </div>
                    {group.msgs.map((m) => {
                      const isUser = m.role === 'user';
                      const isStreamingMsg = m.id === 'streaming-temp';
                      const content = m.content || '';
                      const isEmptyStreaming = isStreamingMsg && !content;

                      if (isEmptyStreaming) {
                        return (
                          <div key={m.id} className="flex flex-col max-w-[85%] self-start items-start">
                            <div className="p-3.5 rounded-hf-lg rounded-tl-none bg-hf-card border border-hf-border text-hf-text-primary">
                              <TypingDots />
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
                        >
                          <div
                            className={`p-3.5 text-hf-body-md leading-relaxed whitespace-pre-wrap ${
                              isUser
                                ? 'bg-hf-accent text-white rounded-hf-lg rounded-tr-none'
                                : 'bg-hf-card border border-hf-border rounded-hf-lg rounded-tl-none text-hf-text-primary'
                            }`}
                          >
                            {content}
                            {isStreamingMsg && content && <TypingDots />}
                          </div>
                          {!isUser && !isStreamingMsg && (
                            <span className="text-hf-label-sm text-hf-text-tertiary mt-1 mx-1.5">
                              {t('aiStyleCoachName')} (google/gemini-2.5-flash)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="p-3 border-t border-hf-border/10 bg-hf-bg-primary flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder={isStreaming ? '...' : t('aiChatInputPlaceholder')}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isStreaming || !selectedChatId}
                className="flex-1 bg-hf-bg-secondary border border-hf-border rounded-hf-md px-4 py-3 text-hf-body-md outline-none text-hf-text-primary placeholder:text-hf-text-tertiary disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={isStreaming || !inputText.trim() || !selectedChatId}
                className="w-12 h-12 rounded-full bg-hf-accent text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUMMARIES TAB */}
        {/* ============================================================== */}
        {activeTab === 'summaries' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Info banner */}
            <div className="bg-hf-bg-secondary border border-hf-border/15 rounded-hf-lg p-4 flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-hf-accent shrink-0 mt-0.5" />
              <p className="text-hf-body-sm text-hf-text-secondary">
                {t('aiSummariesInfoBanner', {
                  interval: 30,
                  count: journalCount,
                  remaining: Math.max(0, 30 - journalCount),
                })}
              </p>
            </div>

            {/* Summary cards */}
            {isLoadingSummaries ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-hf-bg-secondary animate-pulse rounded-hf-lg" />
                ))}
              </div>
            ) : !summaries || summaries.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  emoji="🔮"
                  title={t('emptyTitleNoSummaries')}
                  description={t('emptyDescNoSummaries', { count: journalCount })}
                  action={
                    <Button
                      label={t('emptyActionNoSummaries')}
                      onClick={() => navigate('/journal/new')}
                    />
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {summaries.map((summary, idx) => (
                  <div
                    key={summary.id}
                    onClick={() => navigate(`/summary/${summary.id}`)}
                    className="bg-hf-card border border-hf-border/10 rounded-hf-lg p-4 shadow-sm flex items-center justify-between cursor-pointer hover:opacity-[0.98] active:scale-[0.99] transition-all"
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1 mr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-hf-title-md text-hf-text-primary truncate">
                          {t('aiSummaryTitle', {
                            from: summary.range_start_date,
                            to: summary.range_end_date,
                          })}
                        </span>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 rounded-hf-full bg-hf-accent/10 text-hf-accent text-hf-label-sm font-semibold shrink-0">
                            {t('aiSummariesBadgeNew')}
                          </span>
                        )}
                      </div>
                      <span className="text-hf-label-sm text-hf-text-secondary">
                        {summary.range_start_date} – {summary.range_end_date} · {summary.model_used}
                      </span>
                      <p className="text-hf-body-sm text-hf-text-secondary line-clamp-2">
                        {summary.content.slice(0, 120)}...
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSummary(e, summary.id)}
                      className="p-2 text-hf-text-secondary hover:text-hf-danger transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Ghost card: entries until next summary */}
                <div className="bg-hf-bg-secondary/30 border border-dashed border-hf-border/20 rounded-hf-lg p-4 flex items-center justify-center">
                  <p className="text-hf-body-sm text-hf-text-tertiary text-center">
                    {t('aiSummariesInfoBanner', {
                      interval: 30,
                      count: journalCount,
                      remaining: Math.max(0, 30 - (journalCount % 30)),
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* PROMPTS TAB */}
        {/* ============================================================== */}
        {activeTab === 'prompts' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Category filter chips */}
            <div className="flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
              {([
                { id: 'all' as const, label: t('aiPromptsFilterAll') },
                { id: 'analysis' as const, label: t('aiPromptsFilterAnalysis'), color: 'text-blue-500' },
                { id: 'emotions' as const, label: t('aiPromptsFilterEmotions'), color: 'text-pink-500' },
                { id: 'growth' as const, label: t('aiPromptsFilterGrowth'), color: 'text-green-500' },
                { id: 'relapse' as const, label: t('aiPromptsFilterRelapse'), color: 'text-amber-500' },
              ] as const).map((cat) => {
                const selected = promptFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setPromptFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-hf-full text-hf-label-sm whitespace-nowrap transition-all shrink-0 ${
                      selected
                        ? 'bg-hf-accent text-white'
                        : 'bg-hf-bg-secondary text-hf-text-secondary'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredPrompts.map((p, idx) => {
                const catInfo = CATEGORY_INFO[p.category];
                return (
                  <button
                    key={idx}
                    onClick={() => handlePromptClick(p.titleKey, p.descKey)}
                    className="w-full text-left p-3.5 bg-hf-card border border-hf-border/10 rounded-hf-lg flex flex-col gap-2 min-h-[150px] hover:bg-hf-bg-secondary/30 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-2xl leading-none select-none">{p.emoji}</span>
                      <span className={`text-hf-label-sm font-semibold px-2 py-0.5 rounded-hf-full ${catInfo.bg} ${catInfo.color}`}>
                        {t(CATEGORY_LABEL_KEYS[p.category])}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-hf-title-sm text-hf-text-primary line-clamp-2">{t(p.titleKey)}</h4>
                      <p className="text-hf-label-sm text-hf-text-secondary line-clamp-3">{t(p.descKey)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* FAB: create custom prompt */}
            <button
              onClick={() => {
                alert('Custom prompt creation — coming soon');
              }}
              className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-hf-accent text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all z-10"
              style={{ marginBottom: 'var(--tg-viewport-safe-area-inset-bottom, 0px)' }}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* BOTTOM SHEET: Manage / Select Chats */}
      {/* ================================================================ */}
      <BottomSheet
        isOpen={isManageChatsOpen}
        onClose={() => setIsManageChatsOpen(false)}
        title={t('aiChatHistoryTitle')}
      >
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          {chats?.map((c) => (
            <div
              key={c.id}
              className={`w-full flex items-center justify-between p-3 rounded-hf-lg cursor-pointer transition-all ${
                selectedChatId === c.id ? 'bg-hf-accent/8 border border-hf-accent/20' : 'bg-hf-bg-secondary hover:opacity-95'
              }`}
            >
              <span
                className={`text-hf-body-sm font-semibold truncate flex-1 mr-2 ${
                  selectedChatId === c.id ? 'text-hf-accent' : 'text-hf-text-primary'
                }`}
                onClick={() => {
                  setSelectedChatId(c.id);
                  setIsManageChatsOpen(false);
                }}
              >
                {c.title}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatRenameTitle(c.title);
                    setIsRenameOpen(true);
                    setIsManageChatsOpen(false);
                  }}
                  className="p-1.5 text-hf-text-secondary hover:text-hf-accent rounded-hf-md"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(c.id);
                  }}
                  className="p-1.5 text-hf-text-secondary hover:text-hf-danger rounded-hf-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => handleCreateChat()}
          className="w-full mt-4 py-3.5 rounded-hf-lg bg-hf-accent text-white font-bold text-hf-body-md flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          {t('aiChatNew')}
        </button>
      </BottomSheet>

      {/* ================================================================ */}
      {/* BOTTOM SHEET: Rename Chat */}
      {/* ================================================================ */}
      <BottomSheet
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        title={t('aiChatRenameTitle')}
      >
        <div className="flex flex-col gap-4">
          <Input
            value={chatRenameTitle}
            onChange={(e) => setChatRenameTitle(e.target.value)}
            placeholder={t('aiChatRenameHint')}
          />
          <div className="flex gap-3">
            <button
              onClick={() => setIsRenameOpen(false)}
              className="flex-1 py-3 rounded-hf-lg bg-hf-bg-secondary font-semibold text-hf-body-md"
            >
              {t('commonCancel')}
            </button>
            <button
              onClick={handleRenameChat}
              className="flex-1 py-3 rounded-hf-lg bg-hf-accent text-white font-semibold text-hf-body-md"
            >
              {t('commonSave')}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
