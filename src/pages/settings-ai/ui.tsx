import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { HeaderBar, BottomSheet } from '@/shared/ui';
import { OpenRouterClient } from '@/shared/api';
import {
  Search,
  X,
  Eye,
  EyeOff,
  XCircle,
  RefreshCw,
  Lock,
  ChevronRight,
} from 'lucide-react';

const MODELS = [
  { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B', provider: 'OpenAI', free: true, context: '131K', rpm: 20, rpd: 200 },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'OpenAI', free: false, context: '131K', rpm: 60, price: '$0.04 / $0.18' },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder', provider: 'Qwen / Alibaba', free: true, context: '32K', rpm: 20, rpd: 200 },
  { id: 'anthropic/claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'Anthropic', free: false, context: '200K', rpm: 50, price: '$0.08 / $0.25' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google DeepMind', free: false, context: '1M', rpm: 60, price: '$0.00 / $0.00' },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta', free: false, context: '512K', rpm: 30, price: '$0.10 / $0.28' },
];

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

  useEffect(() => {
    const savedKey = localStorage.getItem('openrouter_key') || '';
    setApiKey(savedKey);
    if (savedKey) {
      setEditing(false);
      setStatus('ok');
    } else {
      setEditing(true);
    }
    const savedModel = localStorage.getItem('ai.preferred_model') || 'google/gemini-2.5-flash';
    setModel(savedModel);
    const savedStyle = localStorage.getItem('ai.style') || 'coach';
    setStyle(savedStyle);
  }, []);

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
  };

  const handleSelectModel = (id: string) => {
    setModel(id);
    localStorage.setItem('ai.preferred_model', id);
  };

  const handleSelectStyle = (id: string) => {
    const s = AI_STYLES.find((s) => s.id === id);
    if (s?.locked) return;
    setStyle(id);
    localStorage.setItem('ai.style', id);
  };

  const filteredModels = MODELS.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.id === model || m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
  });

  const currentStyle = AI_STYLES.find((s) => s.id === style) ?? AI_STYLES[0]!;

  const statusDot = () => {
    switch (status) {
      case 'unchecked': return <span className="text-hf-text-tertiary text-[12px] font-semibold">{t('aiSettingsStatusUnchecked')}</span>;
      case 'checking': return (
        <span className="text-hf-accent flex items-center gap-1 text-[12px] font-semibold">
          <RefreshCw className="w-3 h-3 animate-spin" />
          {t('aiSettingsStatusChecking')}
        </span>
      );
      case 'ok': return (
        <span className="text-[#16A34A] flex items-center gap-1 text-[12px] font-semibold">
          <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
          {t('aiSettingsStatusOk')}
        </span>
      );
      case 'error': return (
        <span className="text-hf-danger flex items-center gap-1 text-[12px] font-semibold">
          <XCircle className="w-3 h-3" />
          {t('aiSettingsStatusError')}
        </span>
      );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-secondary overflow-y-auto pb-tg-safe-bottom">
      <HeaderBar title={t('aiSettingsTitle')} onBack={() => navigate(-1)} />

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-md mx-auto w-full">
        {/* Section Header */}
        <p className="text-[11px] uppercase tracking-wider text-hf-text-tertiary font-semibold px-1">
          {t('aiSettingsApiKeySection')}
        </p>

        {/* API Key Card */}
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card overflow-hidden">
          <div className="p-4">
            <p className="text-[13px] font-semibold text-hf-text-primary mb-2.5">{t('aiSettingsApiKeyLabel')}</p>

            {editing || !apiKey ? (
              <div className="flex gap-2 items-center">
                <div className="flex-1 border-[1.5px] border-hf-border rounded-hf-md bg-hf-bg-secondary px-3.5 py-2.5">
                  <input
                    type="text"
                    placeholder="sk-or-v1-..."
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="w-full bg-transparent text-[13px] text-hf-text-primary outline-none placeholder:text-hf-text-tertiary"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSaveKey}
                  disabled={inputKey.length < 10}
                  className="px-4 py-2.5 rounded-hf-md bg-hf-accent text-white text-[13px] font-semibold disabled:opacity-40 shrink-0"
                >
                  {t('commonSave')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <div className="flex-1 border-[1.5px] border-hf-border rounded-hf-md bg-hf-bg-secondary px-3.5 py-2.5 flex items-center gap-2">
                  <span className="flex-1 text-[13px] text-hf-text-primary truncate">
                    {showKey ? apiKey : maskKey(apiKey)}
                  </span>
                  <button onClick={() => setShowKey(!showKey)} className="p-1 rounded-md bg-hf-bg-tertiary hover:opacity-80">
                    {showKey ? <EyeOff className="w-4 h-4 text-hf-text-secondary" /> : <Eye className="w-4 h-4 text-hf-text-secondary" />}
                  </button>
                </div>
                <button
                  onClick={() => { setEditing(true); setInputKey(''); }}
                  className="px-4 py-2.5 rounded-hf-md bg-hf-accent text-white text-[13px] font-semibold shrink-0"
                >
                  {t('commonReplace')}
                </button>
              </div>
            )}

            <div className="flex gap-4 mt-2.5">
              <button onClick={() => window.open('https://openrouter.ai/keys', '_blank')} className="text-[12px] text-hf-accent">
                {t('aiSettingsApiKeyLink')}
              </button>
              <button onClick={() => setHowItWorksSheetOpen(true)} className="text-[12px] text-hf-accent">
                {t('aiSettingsHowItWorks')}
              </button>
            </div>
          </div>

          {!editing && apiKey && (
            <>
              <div className="border-t border-hf-border" />
              <div className="p-4">
                <button
                  onClick={handleTestKey}
                  disabled={status === 'checking'}
                  className="w-full py-2.5 rounded-hf-md border-[1.5px] border-hf-border text-[13px] font-semibold text-hf-text-secondary hover:border-hf-accent hover:text-hf-accent transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  🧪 {status === 'checking' ? t('commonSending') : t('aiSettingsTestButton')}
                </button>
                <div className="mt-2.5">{statusDot()}</div>
              </div>
            </>
          )}
        </div>

        {/* Model Selection */}
        <p className="text-[11px] uppercase tracking-wider text-hf-text-tertiary font-semibold px-1 mt-1">
          {t('aiSettingsModelSection')}
        </p>

        <div className="flex items-center gap-2 border-[1.5px] border-hf-border rounded-hf-md bg-hf-bg-secondary px-3 py-2">
          <Search className="w-4 h-4 text-hf-text-tertiary" />
          <input
            type="text"
            placeholder={t('aiSettingsModelSearchHint')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[14px] text-hf-text-primary outline-none placeholder:text-hf-text-tertiary"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X className="w-4 h-4 text-hf-text-tertiary" />
            </button>
          )}
        </div>

        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card overflow-hidden">
          {filteredModels.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-hf-text-tertiary">{t('aiSettingsModelsEmpty')}</div>
          ) : (
            <div className="max-h-80 overflow-y-auto pb-tg-safe-bottom">
              {filteredModels.map((m, i) => (
                <div key={m.id}>
                  <button
                    onClick={() => handleSelectModel(m.id)}
                    className={`w-full px-4 py-3.5 flex items-start gap-3 text-left transition-colors ${
                      model === m.id ? 'bg-hf-accent/5' : ''
                    }`}
                  >
                    <div className="pt-0.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          model === m.id ? 'bg-hf-accent border-2 border-hf-accent' : 'border-[1.5px] border-hf-border'
                        }`}
                      >
                        {model === m.id && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[13px] font-semibold text-hf-text-primary">{m.name}</span>
                        {m.free && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#22C55E]/10 text-[#16A34A] text-[10px] font-extrabold tracking-wider">
                            {t('aiBadgeFree')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-hf-text-tertiary">
                        <span>{m.provider}</span>
                        <span>·</span>
                        <span>{m.context} ctx</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {m.free ? null : (
                        <div>
                          <span className="text-[11px] text-hf-text-tertiary">за 1M</span>
                          <div className="text-[12px] text-hf-text-secondary font-medium">{m.price}</div>
                        </div>
                      )}
                    </div>
                  </button>
                  {i < filteredModels.length - 1 && <div className="mx-4 border-t border-hf-border" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="flex items-center gap-1 text-[12px] text-hf-accent px-1">
          {t('aiSettingsAllModelsLink')}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* AI Style Selection */}
        <p className="text-[11px] uppercase tracking-wider text-hf-text-tertiary font-semibold px-1 mt-1">
          {t('aiSettingsStyleSection')}
        </p>
        <p className="text-[13px] text-hf-text-secondary px-1 -mt-2 mb-0">{t('aiSettingsStyleSubtitle')}</p>

        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card overflow-hidden">
          {AI_STYLES.map((s, i) => (
            <div key={s.id}>
              <button
                onClick={() => handleSelectStyle(s.id)}
                disabled={s.locked}
                className={`w-full px-4 py-3.5 flex items-start gap-3 text-left transition-colors disabled:opacity-45 ${
                  style === s.id ? 'bg-hf-accent/5' : ''
                }`}
              >
                <div className="pt-0.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      s.locked ? 'border-[1.5px] border-hf-bg-tertiary' :
                      style === s.id ? 'bg-hf-accent border-2 border-hf-accent' : 'border-[1.5px] border-hf-border'
                    }`}
                  >
                    {style === s.id && !s.locked && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
                  </div>
                </div>
                <span className="text-xl leading-none pt-0.5">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-semibold text-hf-text-primary">{t(s.nameKey)}</span>
                  <p className="text-[12px] text-hf-text-tertiary mt-0.5">{t(s.descKey)}</p>
                </div>
                {s.locked && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-hf-bg-tertiary text-[11px] text-hf-text-tertiary shrink-0">
                    <Lock className="w-3 h-3" />
                    Pro
                  </span>
                )}
              </button>
              {i < AI_STYLES.length - 1 && <div className="mx-4 border-t border-hf-border" />}
            </div>
          ))}
        </div>

        {/* Style Preview Bubble */}
        <p className="text-[11px] uppercase tracking-wider text-hf-text-tertiary font-semibold px-1">
          {t('aiSettingsStyleExampleHeader')}
        </p>
        <div className="bg-hf-bg-secondary border border-hf-border rounded-hf-md px-3.5 py-3 flex items-start gap-2">
          <span className="text-lg leading-none mt-0.5">{currentStyle.emoji}</span>
          <p className="text-[12px] text-hf-text-secondary leading-relaxed">{t(currentStyle.previewKey)}</p>
        </div>

        {/* Usage Stats */}
        <p className="text-[11px] uppercase tracking-wider text-hf-text-tertiary font-semibold px-1 mt-1">
          {t('aiSettingsUsageSection')}
        </p>
        <div className="bg-hf-card border border-hf-border rounded-hf-lg shadow-hf-card overflow-hidden">
          <div className="px-4 py-3 flex justify-between items-center text-[12px]">
            <span className="text-hf-text-secondary">{t('aiSettingsUsageToday')}</span>
            <span>
              <span className="font-semibold text-hf-text-primary">0</span>
              <span className="text-hf-text-tertiary"> / 200 {t('aiSettingsUsageToday').toLowerCase()}</span>
            </span>
          </div>
          <div className="px-4 pb-1">
            <div className="h-1 rounded-full bg-hf-bg-tertiary overflow-hidden">
              <div className="h-full rounded-full bg-hf-accent" style={{ width: '0%' }} />
            </div>
          </div>
          <div className="border-t border-hf-border" />
          <div className="px-4 py-3 flex justify-between items-center text-[12px]">
            <span className="text-hf-text-secondary">{t('aiSettingsUsageMonth')}</span>
            <span className="font-semibold text-hf-text-primary">—</span>
          </div>
          <div className="border-t border-hf-border" />
          <div className="px-4 py-3 flex justify-between items-center text-[12px]">
            <span className="text-hf-text-secondary">{t('aiSettingsUsageSpent')}</span>
            <span className="font-semibold text-hf-text-primary">—</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-[11px] text-hf-text-tertiary leading-relaxed">{t('aiSettingsUsageNote')}</p>
          </div>
        </div>
      </div>

      {/* BottomSheet: How It Works */}
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
