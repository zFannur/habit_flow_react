import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/shared/lib/i18n';
import { Button } from '@/shared/ui';
import { ArrowLeft, Key, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { OpenRouterClient } from '@/shared/api';

export default function AiSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Local State
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('google/gemini-2.5-flash');
  
  // Status: 'unchecked' | 'checking' | 'ok' | 'error'
  const [status, setStatus] = useState<'unchecked' | 'checking' | 'ok' | 'error'>('unchecked');

  // Load Saved Values
  useEffect(() => {
    const savedKey = localStorage.getItem('openrouter_key') || '';
    setApiKey(savedKey);
    if (savedKey) {
      setStatus('ok'); // Assume okay until tested
    }
    
    const savedModel = localStorage.getItem('ai.preferred_model') || 'google/gemini-2.5-flash';
    setModel(savedModel);
  }, []);

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setStatus('error');
      return;
    }
    setStatus('checking');
    try {
      const client = new OpenRouterClient(apiKey);
      const isValid = await client.testKey();
      setStatus(isValid ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const handleSave = () => {
    const cleanKey = apiKey.trim();
    if (cleanKey) {
      localStorage.setItem('openrouter_key', cleanKey);
    } else {
      localStorage.removeItem('openrouter_key');
    }
    
    localStorage.setItem('ai.preferred_model', model);
    alert('AI settings saved!');
    navigate(-1);
  };

  const handleClear = () => {
    localStorage.removeItem('openrouter_key');
    setApiKey('');
    setStatus('unchecked');
    alert('API key cleared!');
  };

  return (
    <div className="w-full h-full flex flex-col bg-hf-bg-primary text-hf-text-primary pb-tg-safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-hf-border/10 shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-hf-bg-secondary hover:opacity-90 active:scale-[0.95] transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-hf-text-primary" />
        </button>
        <h2 className="text-[17px] font-bold">
          {t('profileMenuAiSettings')}
        </h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6 max-w-md mx-auto w-full">
        {/* Intro */}
        <div className="bg-hf-bg-secondary/50 border border-hf-border/10 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
          <Key className="w-5 h-5 text-hf-accent shrink-0 mt-0.5" />
          <p className="text-[13px] leading-relaxed text-hf-text-secondary">
            {t('aiChatDisclaimerText')}
          </p>
        </div>

        {/* API Key Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-hf-text-secondary">OpenRouter API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setStatus('unchecked');
              }}
              className="w-full bg-hf-bg-secondary border border-hf-border/15 rounded-xl px-4 py-3.5 pr-11 text-[14px] text-hf-text-primary placeholder:text-hf-text-tertiary outline-none focus:border-hf-accent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-hf-text-secondary hover:text-hf-text-primary transition-all"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Status Indicator & Test Button */}
        <div className="flex items-center justify-between bg-hf-bg-secondary/30 border border-hf-border/10 rounded-xl p-3 text-[13px]">
          <div className="flex items-center gap-1.5 font-semibold">
            {status === 'unchecked' && <span className="text-hf-text-secondary">Unchecked</span>}
            {status === 'checking' && (
              <span className="text-hf-accent flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Checking...
              </span>
            )}
            {status === 'ok' && (
              <span className="text-hf-success flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active & Verified
              </span>
            )}
            {status === 'error' && (
              <span className="text-red-500 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                Invalid Key
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleTestKey}
            disabled={status === 'checking' || !apiKey.trim()}
            className="text-[12px] font-bold text-hf-accent hover:underline disabled:opacity-50"
          >
            Verify Key
          </button>
        </div>

        {/* Model Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-hf-text-secondary">Preferred LLM Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-hf-bg-secondary border border-hf-border/15 rounded-xl p-3.5 text-[14px] text-hf-text-primary outline-none focus:border-hf-accent transition-all"
          >
            <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash (Recommended)</option>
            <option value="meta-llama/llama-3-8b-instruct:free">Meta Llama 3 8B Instruct (Free)</option>
            <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
            <option value="anthropic/claude-3-haiku">Anthropic Claude 3 Haiku</option>
          </select>
        </div>

        {/* Danger actions */}
        {apiKey && (
          <button
            type="button"
            onClick={handleClear}
            className="text-red-500 hover:text-red-700 text-[13px] font-semibold text-center hover:underline self-center mt-2"
          >
            Clear key from storage
          </button>
        )}

        {/* Actions Button */}
        <div className="mt-auto shrink-0 pb-6">
          <Button
            label={t('commonSave')}
            onClick={handleSave}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
