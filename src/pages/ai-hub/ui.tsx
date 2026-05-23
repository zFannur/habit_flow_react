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
  type AiMessageModel
} from '@/entities/ai';
import { useJournalEntryCountQuery } from '@/entities/journal';
import { OpenRouterClient } from '@/shared/api';
import { supabase } from '@/shared/api';
import { Button, Input, BottomSheet, EmptyState } from '@/shared/ui';
import { MessageSquare, Sparkles, FileText, Send, Plus, Trash2, Edit3, AlertCircle } from 'lucide-react';

export default function AiHubPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state: session } = useSessionStore();
  const userId = session.status === 'authenticated' ? session.user.id : undefined;

  // Tabs: 'chat' | 'summaries' | 'prompts'
  const [activeTab, setActiveTab] = useState<'chat' | 'summaries' | 'prompts'>('chat');

  // OpenRouter Key
  const [openRouterKey, setOpenRouterKey] = useState<string | null>(null);

  // Load OpenRouter Key from LocalStorage
  useEffect(() => {
    const key = localStorage.getItem('openrouter_key');
    setOpenRouterKey(key);
  }, []);

  // Queries
  const { data: chats } = useAiChatsQuery(userId);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Auto-select first chat or handle selection
  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      const first = chats[0];
      if (first) {
        setSelectedChatId(first.id);
      }
    }
  }, [chats, selectedChatId]);


  const activeChat = chats?.find((c) => c.id === selectedChatId);

  // Messages Query
  const { data: dbMessages } = useAiMessagesQuery(selectedChatId || undefined, userId);

  // Journal entry count for Summaries
  const { data: journalCount = 0 } = useJournalEntryCountQuery(userId);

  // AI Style / Coach State
  const [aiStyle, setAiStyle] = useState<AiStyleType>('coach');
  const [isSupporter, setIsSupporter] = useState(false);

  // Fetch users metadata for ai_style and supporter flag
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('users')
      .select('ai_style, is_supporter')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.ai_style) setAiStyle(data.ai_style as AiStyleType);
          if (data.is_supporter) setIsSupporter(data.is_supporter);
        }
      });
  }, [userId]);

  const handleStyleChange = async (style: AiStyleType) => {
    if (style === 'poet' && !isSupporter) {
      alert('Poet style is locked for supporters. Please support the project!');
      return;
    }
    setAiStyle(style);
    if (userId) {
      await supabase.from('users').update({ ai_style: style }).eq('id', userId);
    }
  };

  // Chat Actions
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
        if (selectedChatId === chatId) {
          setSelectedChatId(null);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Chat Message Input and Streaming State
  const [inputText, setInputText] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Combine database messages with any active streaming chunk
  const messages: (AiMessageModel | { id: string; role: 'assistant'; content: string })[] = useMemo(() => {
    const list: (AiMessageModel | { id: string; role: 'assistant'; content: string })[] = dbMessages ? [...dbMessages] : [];
    if (streamingText || isStreaming) {
      list.push({
        id: 'streaming-temp',
        role: 'assistant',
        content: streamingText || '...',
      });
    }
    return list;
  }, [dbMessages, streamingText, isStreaming]);

  // Scroll to bottom when messages list changes
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

    if (!textToSend) {
      setInputText('');
    }

    setIsStreaming(true);
    setStreamingText('');

    try {
      // 1. Insert user message to database
      await insertMessageMutation.mutateAsync({
        role: 'user',
        content: text,
      });

      // 2. Prepare conversation history for the model
      const history: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];

      // Add system prompt based on chosen style
      history.push({
        role: 'system',
        content: getSystemPrompt(aiStyle, t('languageEnglish') === 'English' ? 'en' : 'ru'),
      });

      // Add last few messages for context
      const contextMsgs = dbMessages || [];
      contextMsgs.slice(-10).forEach((m) => {
        history.push({
          role: m.role,
          content: m.content,
        });
      });

      // Add current user message
      history.push({
        role: 'user',
        content: text,
      });

      // 3. Request completion from OpenRouter
      const client = new OpenRouterClient(openRouterKey);
      let fullReply = '';

      await client.chatCompletionStream(
        history,
        'google/gemini-2.5-flash',
        (chunk) => {
          fullReply += chunk;
          setStreamingText(fullReply);
        }
      );

      // 4. Save completed assistant message to database
      await insertMessageMutation.mutateAsync({
        role: 'assistant',
        content: fullReply,
      });
    } catch (e) {
      console.error(e);
      alert(t('aiChatErrorGeneric'));
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }
  };

  // Summaries List
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

  // Prompts Grid list
  const systemPrompts = [
    { title: t('aiPromptSystem1Title'), desc: t('aiPromptSystem1Desc'), emoji: '📊' },
    { title: t('aiPromptSystem2Title'), desc: t('aiPromptSystem2Desc'), emoji: '🔍' },
    { title: t('aiPromptSystem3Title'), desc: t('aiPromptSystem3Desc'), emoji: '🛡️' },
    { title: t('aiPromptSystem4Title'), desc: t('aiPromptSystem4Desc'), emoji: '🌱' },
    { title: t('aiPromptSystem5Title'), desc: t('aiPromptSystem5Desc'), emoji: '🗺️' },
    { title: t('aiPromptSystem6Title'), desc: t('aiPromptSystem6Desc'), emoji: '🧬' },
    { title: t('aiPromptSystem7Title'), desc: t('aiPromptSystem7Desc'), emoji: '📈' },
    { title: t('aiPromptSystem8Title'), desc: t('aiPromptSystem8Desc'), emoji: '🎯' },
    { title: t('aiPromptSystem9Title'), desc: t('aiPromptSystem9Desc'), emoji: '⏰' },
    { title: t('aiPromptSystem10Title'), desc: t('aiPromptSystem10Desc'), emoji: '👑' },
  ];

  const handlePromptClick = async (title: string, desc: string) => {
    // Start a new chat named after the prompt
    try {
      const newChat = await createChatMutation.mutateAsync(title);
      setSelectedChatId(newChat.id);
      setActiveTab('chat');
      // Send the query automatically
      setTimeout(() => {
        handleSend(desc);
      }, 500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-tg-bg text-tg-text pb-tg-safe-bottom overflow-hidden">
      {/* Tabs Header */}
      <div className="flex bg-tg-secondary-bg border-b border-tg-hint/10 p-2 shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-[13px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'chat' ? 'bg-tg-bg text-tg-accent shadow-sm' : 'text-tg-hint'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {t('aiChatTab')}
        </button>
        <button
          onClick={() => setActiveTab('summaries')}
          className={`flex-1 py-2 text-[13px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'summaries' ? 'bg-tg-bg text-tg-accent shadow-sm' : 'text-tg-hint'
          }`}
        >
          <FileText className="w-4 h-4" />
          {t('aiSummariesTab')}
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex-1 py-2 text-[13px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'prompts' ? 'bg-tg-bg text-tg-accent shadow-sm' : 'text-tg-hint'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {t('aiPromptsTab')}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* API Key Missing Alert */}
            {!openRouterKey && (
              <div className="bg-red-500/10 border-b border-red-500/20 p-3 flex items-center justify-between text-[12px] text-red-500 font-semibold shrink-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t('aiChatNoKeyText')}</span>
                </div>
                <button
                  onClick={() => navigate('/profile/ai-settings')}
                  className="px-2.5 py-1 bg-red-500 text-white rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  {t('emptyNoKeyCta')}
                </button>
              </div>
            )}

            {/* Chat List Top Bar selector */}
            <div className="p-3 bg-tg-secondary-bg/30 border-b border-tg-hint/10 flex justify-between items-center gap-2 shrink-0">
              <button
                onClick={() => setIsManageChatsOpen(true)}
                className="bg-tg-secondary-bg hover:opacity-95 px-3 py-1.5 rounded-xl text-[13px] font-semibold text-tg-text truncate max-w-[65%]"
              >
                💬 {activeChat?.title || 'Select Chat'}
              </button>
              <div className="flex gap-2">
                {selectedChatId && (
                  <>
                    <button
                      onClick={() => {
                        setChatRenameTitle(activeChat?.title || '');
                        setIsRenameOpen(true);
                      }}
                      className="p-2 bg-tg-secondary-bg hover:opacity-90 rounded-xl text-tg-hint"
                      title={t('aiChatRename')}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteChat(selectedChatId)}
                      className="p-2 bg-tg-secondary-bg hover:bg-red-500/10 rounded-xl text-red-500"
                      title={t('aiChatDelete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleCreateChat()}
                  className="p-2 bg-tg-accent hover:opacity-90 rounded-xl text-white"
                  title={t('aiChatNew')}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* AI Style Coach Selector */}
            <div className="px-4 py-2 border-b border-tg-hint/5 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
              <span className="text-[11px] font-bold text-tg-hint uppercase shrink-0">AI Coach:</span>
              {[
                { type: 'coach' as AiStyleType, label: t('aiStyleCoachName') },
                { type: 'sergeant' as AiStyleType, label: t('aiStyleSergeantName') },
                { type: 'buddy' as AiStyleType, label: t('aiStyleBuddyName') },
                { type: 'sage' as AiStyleType, label: t('aiStyleSageName') },
                { type: 'poet' as AiStyleType, label: `${t('aiStylePoetName')} 💎` },
              ].map((style) => (
                <button
                  key={style.type}
                  onClick={() => handleStyleChange(style.type)}
                  className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all shrink-0 ${
                    aiStyle === style.type
                      ? 'bg-tg-accent text-white'
                      : 'bg-tg-secondary-bg text-tg-text'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
                  <div className="w-16 h-16 rounded-full bg-tg-accent/8 flex items-center justify-center text-tg-accent text-3xl">
                    🧠
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">HabitFlow AI Hub</h3>
                    <p className="text-[13px] text-tg-hint mt-1.5 max-w-[240px]">
                      {t('aiChatDisclaimerText')}
                    </p>
                  </div>

                  {/* Suggestions Chips */}
                  <div className="flex flex-col gap-2 w-full max-w-sm mt-4">
                    <span className="text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1">
                      Suggestions
                    </span>
                    {[
                      t('aiChatSuggestion1'),
                      t('aiChatSuggestion2'),
                      t('aiChatSuggestion3'),
                      t('aiChatSuggestion4'),
                    ].map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="w-full text-left p-3 bg-tg-secondary-bg/50 border border-tg-hint/10 rounded-xl text-[13px] font-semibold hover:bg-tg-secondary-bg active:scale-[0.99] transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? 'bg-tg-accent text-white rounded-tr-none'
                            : 'bg-tg-secondary-bg border border-tg-hint/10 text-tg-text rounded-tl-none'
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="text-[10px] text-tg-hint mt-1 mx-1.5">
                        {isUser ? 'You' : `${t('aiStyleCoachName')} (${aiStyle})`}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-tg-hint/10 bg-tg-bg flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder={isStreaming ? 'Streaming...' : t('aiChatInputPlaceholder')}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isStreaming || !selectedChatId}
                className="flex-1 bg-tg-secondary-bg border border-tg-hint/15 rounded-xl px-4 py-3 text-[14px] outline-none text-tg-text placeholder-tg-hint disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={isStreaming || !inputText.trim() || !selectedChatId}
                className="w-12 h-12 rounded-xl bg-tg-accent text-white flex items-center justify-center hover:opacity-90 active:scale-[0.95] transition-all disabled:opacity-40"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* SUMMARIES TAB */}
        {activeTab === 'summaries' && (
          <div className="p-4 flex flex-col gap-4">
            {/* Info Banner */}
            <div className="bg-tg-secondary-bg border border-tg-hint/15 rounded-2xl p-4 flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-tg-accent shrink-0 mt-0.5" />
              <p className="text-[13px] leading-relaxed text-tg-hint">
                {t('aiSummariesInfoBanner', {
                  interval: 30,
                  count: journalCount,
                  remaining: Math.max(0, 30 - journalCount),
                })}
              </p>
            </div>

            {/* Summaries list */}
            {isLoadingSummaries ? (
              <div className="h-20 bg-tg-secondary-bg animate-pulse rounded-2xl" />
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
                {summaries.map((summary) => (
                  <div
                    key={summary.id}
                    onClick={() => navigate(`/summary/${summary.id}`)}
                    className="bg-tg-section border border-tg-hint/10 rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:opacity-[0.98] active:scale-[0.99] transition-all"
                  >
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1 mr-3">
                      <span className="text-[14px] font-bold leading-snug truncate text-tg-text">
                        {t('aiSummaryTitle', {
                          from: summary.range_start_date,
                          to: summary.range_end_date,
                        })}
                      </span>
                      <span className="text-[11px] text-tg-hint">
                        Entries range: {summary.range_start_n} - {summary.range_end_n} · Model: {summary.model_used}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSummary(e, summary.id)}
                      className="p-2 text-tg-hint hover:text-red-500 transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROMPTS TAB */}
        {activeTab === 'prompts' && (
          <div className="p-4 flex flex-col gap-4">
            <p className="text-[13px] text-tg-hint ml-1">
              {t('aiPromptsIntro')}
            </p>

            <div className="grid grid-cols-1 gap-3">
              {systemPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(p.title, p.desc)}
                  className="w-full text-left p-4 bg-tg-section border border-tg-hint/10 rounded-2xl flex gap-3.5 items-start hover:bg-tg-secondary-bg/30 active:scale-[0.99] transition-all shadow-sm"
                >
                  <span className="text-2xl mt-0.5 shrink-0">{p.emoji}</span>
                  <div>
                    <h4 className="font-bold text-[14px] text-tg-text">{p.title}</h4>
                    <p className="text-[12px] text-tg-hint mt-1.5 leading-relaxed">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet to Manage/Select chats */}
      <BottomSheet
        isOpen={isManageChatsOpen}
        onClose={() => setIsManageChatsOpen(false)}
        title={t('aiChatHistoryTitle')}
      >
        <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto">
          {chats?.map((c) => (
            <div
              key={c.id}
              className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                selectedChatId === c.id ? 'bg-tg-accent/8 border border-tg-accent/20' : 'bg-tg-secondary-bg hover:opacity-95'
              }`}
              onClick={() => {
                setSelectedChatId(c.id);
                setIsManageChatsOpen(false);
              }}
            >
              <span className={`text-[14px] font-semibold truncate max-w-[70%] ${
                selectedChatId === c.id ? 'text-tg-accent' : 'text-tg-text'
              }`}>
                💬 {c.title}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(c.id);
                }}
                className="p-1 text-tg-hint hover:text-red-500 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => handleCreateChat()}
          className="w-full mt-4 py-3.5 rounded-xl bg-tg-accent text-white font-bold text-[14px] flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          {t('aiChatNew')}
        </button>
      </BottomSheet>

      {/* Rename Chat Dialog */}
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
              className="flex-1 py-3 rounded-xl bg-tg-secondary-bg font-semibold text-[14px]"
            >
              {t('commonCancel')}
            </button>
            <button
              onClick={handleRenameChat}
              className="flex-1 py-3 rounded-xl bg-tg-accent text-white font-semibold text-[14px]"
            >
              {t('commonSave')}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
