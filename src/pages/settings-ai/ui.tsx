import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, translate } from '@/shared/lib/i18n';
import { dateOnly } from '@/entities/habit';
import { BottomSheet } from '@/shared/ui';
import { OpenRouterClient } from '@/shared/api';
import { supabase } from '@/shared/api';
import { useSessionStore } from '@/entities/session';
import { hapticFeedback } from '@telegram-apps/sdk-react';
import {
  Search,
  X,
  Eye,
  EyeOff,
  XCircle,
  RefreshCw,
  Lock,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const STATIC_MODELS = [
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT-OSS 120B',
    provider: 'OpenAI',
    free: true,
    context: '131K',
    rpm: 20,
  },
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder',
    provider: 'Qwen / Alibaba',
    free: true,
    context: '32K',
    rpm: 20,
  },
  {
    id: 'anthropic/claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    free: false,
    context: '200K',
    rpm: 50,
    price: '$0.08 / $0.25',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google DeepMind',
    free: false,
    context: '1M',
    rpm: 60,
    price: '$0.00 / $0.00',
  },
  {
    id: 'meta-llama/llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'Meta',
    free: false,
    context: '512K',
    rpm: 30,
    price: '$0.10 / $0.28',
  },
];

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  free: boolean;
  context: string;
  rpm?: number;
  price?: string;
}

const AI_STYLES = [
  { id: 'coach', emoji: '🎓', nameKey: 'aiStyleCoachName', descKey: 'aiStyleCoachDesc', previewKey: 'aiStyleCoachPreview', locked: false },
  { id: 'sergeant', emoji: '💪', nameKey: 'aiStyleSergeantName', descKey: 'aiStyleSergeantDesc', previewKey: 'aiStyleSergeantPreview', locked: false },
  { id: 'buddy', emoji: '🤗', nameKey: 'aiStyleBuddyName', descKey: 'aiStyleBuddyDesc', previewKey: 'aiStyleBuddyPreview', locked: false },
  { id: 'sage', emoji: '🧘', nameKey: 'aiStyleSageName', descKey: 'aiStyleSageDesc', previewKey: 'aiStyleSagePreview', locked: false },
  { id: 'poet', emoji: '✍️', nameKey: 'aiStylePoetName', descKey: 'aiStylePoetDesc', previewKey: 'aiStylePoetPreview', locked: true },
];

function maskKey(key: string): string {
  if (key.length <= 13) return key;
  return key.substring(0, 9) + '•••••••••••••••••' + key.substring(key.length - 4);
}

type KeyStatus = 'unchecked' | 'checking' | 'ok' | 'error';

function RadioDot({ selected, locked }: { selected: boolean; locked?: boolean }) {
  return (
    <div className="pt-0.5 shrink-0">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center ${
          locked
            ? 'border-[1.5px] border-hf-bg-tertiary'
            : selected
              ? 'bg-hf-accent border-2 border-hf-accent'
              : 'border-[1.5px] border-hf-border'
        }`}
      >
        {selected && !locked && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
      </div>
    </div>
  );
}

function StatusDot({ status, t }: { status: KeyStatus; t: (k: string) => string }) {
  switch (status) {
    case 'unchecked':
      return (
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-hf-text-tertiary">
          <div className="w-2 h-2 rounded-full bg-[#D1D5DB]" />
          {t('aiSettingsStatusUnchecked')}
        </span>
      );
    case 'checking':
      return (
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-hf-accent">
          <RefreshCw className="w-3 h-3 animate-spin" />
          {t('aiSettingsStatusChecking')}
        </span>
      );
    case 'ok':
      return (
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#16A34A]">
          <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
          {t('aiSettingsStatusOk')}
        </span>
      );
    case 'error':
      return (
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-hf-danger">
          <XCircle className="w-3 h-3" />
          {t('aiSettingsStatusError')}
        </span>
      );
  }
}

function StepItem({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-[38px] h-[38px] rounded-hf-md bg-hf-bg-secondary flex items-center justify-center text-lg shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-semibold text-hf-text-primary">{title}</p>
        <p className="text-[12px] text-hf-text-secondary leading-relaxed mt-0.5">{text}</p>
      </div>
    </div>
  );
}

export default function AiSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [status, setStatus] = useState<KeyStatus>('unchecked');

  const [model, setModel] = useState('google/gemini-2.5-flash');
  const [style, setStyle] = useState('coach');
  const [searchQuery, setSearchQuery] = useState('');
  const [howItWorksSheetOpen, setHowItWorksSheetOpen] = useState(false);

  const [models, setModels] = useState<ModelItem[]>(STATIC_MODELS);
  const [modelsLoading, setModelsLoading] = useState(false);

  const [todayCount, setTodayCount] = useState(0);
  const [dailyLimit] = useState(200);

  useEffect(() => {
    const savedKey = localStorage.getItem('openrouter_key') || '';
    setApiKey(savedKey);
    if (savedKey) {
      setEditing(false);
      setStatus('unchecked');
    } else {
      setEditing(true);
    }
    const savedModel = localStorage.getItem('openrouter_model') || 'google/gemini-2.5-flash';
    setModel(savedModel);
    const savedStyle = localStorage.getItem('ai_style') || 'coach';
    setStyle(savedStyle);
  }, []);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { state } = useSessionStore.getState();
        const userId = state.status === 'authenticated' ? state.user.id : null;
        if (userId) {
          const { data } = await supabase
            .from('ai_daily_usage')
            .select('count')
            .eq('user_id', userId)
            .eq('date', dateOnly(new Date()))
            .maybeSingle();
          if (data?.count) {
            setTodayCount(data.count);
            return;
          }
        }
      } catch {
        // fallback to localStorage
      }
      const local = localStorage.getItem('ai_usage_today');
      if (local) {
        const parsed = JSON.parse(local);
        const today = dateOnly(new Date());
        if (parsed.date === today) {
          setTodayCount(parsed.count || 0);
        }
      }
    };
    fetchUsage();
  }, []);

  const fetchModels = useCallback(async () => {
    const key = apiKey || inputKey;
    if (!key.trim()) return;
    setModelsLoading(true);
    try {
      const client = new OpenRouterClient(key);
      const fetched = await client.fetchModels();
      const mapped: ModelItem[] = fetched.map((m) => ({
        id: m.id,
        name: m.name,
        provider: m.id.split('/')[0] || translate('commonUnknown'),
        free: m.id.includes(':free'),
        context: m.contextLength ? `${Math.round(m.contextLength / 1024)}K` : '—',
        price:
          m.promptPrice && m.completionPrice
            ? `$${Number(m.promptPrice).toFixed(2)} / $${Number(m.completionPrice).toFixed(2)}`
            : undefined,
      }));
      const freeModels = mapped.filter((m) => m.free).slice(0, 10);
      const paidModels = mapped.filter((m) => !m.free).slice(0, 20);
      setModels([...freeModels, ...paidModels]);
    } catch {
      // keep static fallback
    } finally {
      setModelsLoading(false);
    }
  }, [apiKey, inputKey]);

  useEffect(() => {
    if (apiKey) {
      fetchModels();
    }
  }, [apiKey, fetchModels]);

  const handleBack = () => {
    hapticFeedback.impactOccurred.ifAvailable('light');
    navigate(-1);
  };

  const handleTestKey = async () => {
    const key = apiKey || inputKey;
    if (!key.trim()) {
      setStatus('error');
      return;
    }
    setStatus('checking');
    try {
      const client = new OpenRouterClient(key);
      const isValid = await client.testKey();
      setStatus(isValid ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const handleSaveKey = () => {
    const cleanKey = inputKey.trim();
    if (cleanKey.length < 10) return;
    localStorage.setItem('openrouter_key', cleanKey);
    setApiKey(cleanKey);
    setInputKey('');
    setEditing(false);
    setStatus('unchecked');
    // 7.4 — notify ai-hub to reload key/model without a full page reload
    window.dispatchEvent(new Event('openrouter-settings-changed'));
  };

  const handleSelectModel = (id: string) => {
    setModel(id);
    localStorage.setItem('openrouter_model', id);
    // 7.4 — notify ai-hub to reload key/model without a full page reload
    window.dispatchEvent(new Event('openrouter-settings-changed'));
  };

  const handleSelectStyle = (id: string) => {
    const s = AI_STYLES.find((s) => s.id === id);
    if (s?.locked) return;
    setStyle(id);
    localStorage.setItem('ai_style', id);
  };

  const filteredModels = models.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q)
    );
  });

  const currentStyle = AI_STYLES.find((s) => s.id === style) ?? AI_STYLES[0]!;

  const todayPercent = Math.min((todayCount / dailyLimit) * 100, 100);

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-secondary">
      {/* Custom header */}
      <header className="w-full bg-hf-bg-primary border-b border-hf-border flex items-center px-5 pt-tg-safe-top py-3.5 gap-1">
        <button
          onClick={handleBack}
          className="w-9 h-9 flex items-center justify-center bg-hf-card rounded-[10px] border-[1.5px] border-hf-border text-hf-text-secondary shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-[17px] font-bold text-hf-text-primary tracking-[-0.02em] truncate">
          {t('aiSettingsTitle')}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-tg-safe-bottom">
        <div className="py-4 px-4 flex flex-col gap-4 max-w-md mx-auto w-full">
          {/* Section 1: API Key */}
          <p className="text-hf-label-sm uppercase tracking-[0.08em] text-hf-text-tertiary font-semibold mb-1.5">
            {t('aiSettingsApiKeySection')}
          </p>

          <div className="bg-hf-card rounded-hf-lg border border-hf-border overflow-hidden">
            <div className="px-4 py-3.5">
              <p className="text-hf-label-lg text-hf-text-primary font-semibold mb-2.5">
                {t('aiSettingsApiKeyLabel')}
              </p>

              {editing || !apiKey ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="sk-or-v1-..."
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="flex-1 bg-hf-bg-secondary rounded-[10px] border-[1.5px] border-hf-border px-3.5 py-2.5 text-hf-body-sm text-hf-text-primary outline-none placeholder:text-hf-text-tertiary"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveKey}
                    disabled={inputKey.length < 10}
                    className="px-[18px] py-2.5 rounded-[10px] bg-hf-accent text-white text-hf-title-sm font-semibold disabled:opacity-40 shrink-0"
                  >
                    {t('commonSave')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <div className="flex-1 bg-hf-bg-secondary rounded-[10px] border-[1.5px] border-hf-border px-3.5 py-2.5 flex items-center gap-2">
                    <span className="flex-1 text-hf-body-sm text-hf-text-primary truncate font-mono">
                      {showKey ? apiKey : maskKey(apiKey)}
                    </span>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="w-[30px] h-[30px] flex items-center justify-center bg-hf-bg-tertiary rounded-[7px] shrink-0"
                    >
                      {showKey ? (
                        <EyeOff className="w-4 h-4 text-hf-text-secondary" />
                      ) : (
                        <Eye className="w-4 h-4 text-hf-text-secondary" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setEditing(true);
                      setInputKey('');
                    }}
                    className="px-[18px] py-2.5 rounded-[10px] bg-hf-accent text-white text-hf-title-sm font-semibold shrink-0"
                  >
                    {t('commonReplace')}
                  </button>
                </div>
              )}

              <div className="flex gap-4 mt-2.5">
                <button
                  onClick={() => window.open('https://openrouter.ai/keys', '_blank')}
                  className="text-hf-body-sm text-hf-accent"
                >
                  {t('aiSettingsApiKeyLink')}
                </button>
                <button
                  onClick={() => setHowItWorksSheetOpen(true)}
                  className="text-hf-body-sm text-hf-accent"
                >
                  {t('aiSettingsHowItWorks')}
                </button>
              </div>
            </div>

            {!editing && apiKey && (
              <>
                <div className="h-px bg-hf-border mx-4" />
                <div className="px-4 py-3.5">
                  <button
                    onClick={handleTestKey}
                    disabled={status === 'checking'}
                    className={`w-full rounded-[10px] border-[1.5px] py-2.5 flex items-center justify-center gap-1.5 text-hf-label-lg font-semibold transition-colors ${
                      status === 'checking'
                        ? 'bg-hf-accent/4 border-hf-accent/30 text-hf-accent'
                        : 'border-hf-border text-hf-text-secondary'
                    } disabled:cursor-wait`}
                  >
                    {status === 'checking' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {t('commonSending')}
                      </>
                    ) : (
                      <>🧪 {t('aiSettingsTestButton')}</>
                    )}
                  </button>
                  <div className="mt-2.5">
                    <StatusDot status={status} t={t} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Section 2: Model */}
          <p className="text-hf-label-sm uppercase tracking-[0.08em] text-hf-text-tertiary font-semibold mt-1 mb-1.5">
            {t('aiSettingsModelSection')}
          </p>

          <div className="flex items-center gap-2 bg-hf-bg-secondary rounded-[10px] border-[1.5px] border-hf-border px-3 py-2 mb-2.5">
            <Search className="w-4 h-4 text-hf-text-tertiary shrink-0" />
            <input
              type="text"
              placeholder={t('aiSettingsModelSearchHint')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-hf-body-sm text-hf-text-primary outline-none placeholder:text-hf-text-tertiary"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="shrink-0">
                <X className="w-4 h-4 text-hf-text-tertiary" />
              </button>
            )}
          </div>

          <div className="bg-hf-card rounded-hf-lg border border-hf-border overflow-hidden">
            {modelsLoading ? (
              <div className="py-10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin text-hf-text-tertiary" />
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="py-8 text-center text-hf-body-sm text-hf-text-tertiary">
                {t('aiSettingsModelsEmpty')}
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto">
                {filteredModels.map((m, i) => (
                  <div key={m.id}>
                    <button
                      onClick={() => handleSelectModel(m.id)}
                      className={`w-full px-4 py-3.5 flex items-start gap-3 text-left transition-colors ${
                        model === m.id ? 'bg-hf-accent/4' : ''
                      }`}
                    >
                      <RadioDot selected={model === m.id} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-hf-label-lg text-hf-text-primary font-semibold">
                            {m.name}
                          </span>
                          {m.free && (
                            <span className="px-1.5 py-0.5 rounded-[6px] bg-[#22C55E]/10 text-[#16A34A] text-[10px] font-extrabold">
                              {t('aiBadgeFree')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-hf-body-sm text-hf-text-tertiary">
                          <span>{m.provider}</span>
                          <span>·</span>
                          <span>{m.context} ctx</span>
                        </div>
                      </div>
                      {!m.free && m.price && (
                        <div className="text-right shrink-0">
                          <div className="text-hf-label-md text-hf-text-secondary font-medium">
                            {m.price}
                          </div>
                          <span className="text-[11px] text-hf-text-tertiary">{t('aiSettingsPricePer1M')}</span>
                        </div>
                      )}
                    </button>
                    {i < filteredModels.length - 1 && (
                      <div className="mx-4 border-t border-hf-border/50" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <a
            href="https://openrouter.ai/models"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-hf-body-sm text-hf-accent px-1"
          >
            {t('aiSettingsAllModelsLink')}
            <ChevronRight className="w-3.5 h-3.5" />
          </a>

          {/* Section 3: AI Style */}
          <p className="text-hf-label-sm uppercase tracking-[0.08em] text-hf-text-tertiary font-semibold mt-1 mb-1.5">
            {t('aiSettingsStyleSection')}
          </p>
          <p className="text-hf-title-sm text-hf-text-secondary -mt-1 mb-2 px-1">
            {t('aiSettingsStyleSubtitle')}
          </p>

          <div className="bg-hf-card rounded-hf-lg border border-hf-border overflow-hidden">
            {AI_STYLES.map((s, i) => (
              <div key={s.id}>
                <button
                  onClick={() => handleSelectStyle(s.id)}
                  disabled={s.locked}
                  className={`w-full px-4 py-3.5 flex items-start gap-3 text-left transition-colors ${
                    s.locked ? 'opacity-50 cursor-not-allowed' : ''
                  } ${style === s.id && !s.locked ? 'bg-hf-accent/4' : ''}`}
                >
                  <RadioDot selected={style === s.id} locked={s.locked} />
                  <span className="text-xl leading-none pt-0.5 shrink-0">{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-hf-label-lg text-hf-text-primary font-semibold">
                      {t(s.nameKey)}
                    </span>
                    <p className="text-hf-body-sm text-hf-text-tertiary mt-0.5">{t(s.descKey)}</p>
                  </div>
                  {s.locked && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-hf-bg-tertiary text-[11px] text-hf-text-tertiary shrink-0">
                      <Lock className="w-3 h-3" />
                      {t('aiSettingsProBadge')}
                    </span>
                  )}
                </button>
                {i < AI_STYLES.length - 1 && (
                  <div className="mx-4 border-t border-hf-border" />
                )}
              </div>
            ))}
          </div>

          <p className="text-hf-label-sm uppercase tracking-[0.08em] text-hf-text-tertiary font-semibold mt-1 mb-1.5">
            {t('aiSettingsStyleExampleHeader')}
          </p>
          <div className="bg-hf-bg-secondary rounded-[14px] border border-hf-border p-3.5 flex items-start gap-2">
            <span className="text-lg leading-none mt-0.5 shrink-0">{currentStyle.emoji}</span>
            <p className="text-hf-body-sm text-hf-text-secondary leading-relaxed">
              {t(currentStyle.previewKey)}
            </p>
          </div>

          {/* Section 4: Usage */}
          <p className="text-hf-label-sm uppercase tracking-[0.08em] text-hf-text-tertiary font-semibold mt-1 mb-1.5">
            {t('aiSettingsUsageSection')}
          </p>

          <div className="bg-hf-card rounded-hf-lg border border-hf-border overflow-hidden">
            <div className="px-4 py-3.5 flex justify-between items-center text-hf-body-sm">
              <span className="text-hf-text-secondary">{t('aiSettingsUsageToday')}</span>
              <span>
                <span className="font-semibold text-hf-text-primary">{todayCount}</span>
                <span className="text-hf-text-tertiary"> / {dailyLimit}</span>
              </span>
            </div>
            <div className="px-4 pb-1">
              <div className="h-1 rounded-full bg-hf-bg-tertiary overflow-hidden">
                <div
                  className="h-full rounded-full bg-hf-accent transition-all duration-300"
                  style={{ width: `${todayPercent}%` }}
                />
              </div>
            </div>
            <div className="border-t border-hf-border mx-0" />
            <div className="px-4 py-3.5 flex justify-between items-center text-hf-body-sm">
              <span className="text-hf-text-secondary">{t('aiSettingsUsageMonth')}</span>
              <span className="font-semibold text-hf-text-primary">—</span>
            </div>
            <div className="border-t border-hf-border mx-0" />
            <div className="px-4 py-3.5 flex justify-between items-center text-hf-body-sm">
              <span className="text-hf-text-secondary">{t('aiSettingsUsageSpent')}</span>
              <span className="font-semibold text-hf-text-primary">—</span>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[11px] text-hf-text-tertiary leading-relaxed">
                {t('aiSettingsUsageNote')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomSheet
        isOpen={howItWorksSheetOpen}
        onClose={() => setHowItWorksSheetOpen(false)}
        title={t('aiSettingsHowItWorks')}
      >
        <div className="flex flex-col gap-3.5">
          <StepItem icon="🔑" title={t('aiSettingsHowItem1Title')} text={t('aiSettingsHowItem1Text')} />
          <StepItem icon="🌐" title={t('aiSettingsHowItem2Title')} text={t('aiSettingsHowItem2Text')} />
          <StepItem icon="💳" title={t('aiSettingsHowItem3Title')} text={t('aiSettingsHowItem3Text')} />
        </div>
        <button
          onClick={() => setHowItWorksSheetOpen(false)}
          className="mt-5 w-full py-[13px] rounded-[12px] bg-hf-accent text-white text-[16px] font-semibold"
        >
          {t('commonUnderstand')}
        </button>
      </BottomSheet>
    </div>
  );
}
