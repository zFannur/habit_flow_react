export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterModelInfo {
  id: string;
  name: string;
  contextLength?: number;
  promptPrice?: string;
  completionPrice?: string;
}

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

interface RawOpenRouterModel {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: {
    prompt?: string | number;
    completion?: string | number;
  };
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || DEFAULT_BASE_URL;
  }

  private get headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'HabitFlow',
    };
  }

  async fetchModels(): Promise<OpenRouterModelInfo[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const json = await response.json();
    const data = (json.data || []) as RawOpenRouterModel[];
    return data.map((m) => ({
      id: m.id,
      name: m.name || m.id,
      contextLength: m.context_length,
      promptPrice: m.pricing?.prompt?.toString(),
      completionPrice: m.pricing?.completion?.toString(),
    }));
  }

  async testKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async chatCompletionNonStream(
    messages: OpenRouterMessage[],
    model: string = 'google/gemini-2.5-flash'
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `Chat completion failed: ${response.status}`);
    }

    const json = await response.json();
    const choices = json.choices || [];
    if (choices.length > 0) {
      return choices[0].message?.content || '';
    }
    return '';
  }

  async chatCompletionStream(
    messages: OpenRouterMessage[],
    model: string = 'google/gemini-2.5-flash',
    onChunk: (text: string) => void
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `Chat completion failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body reader is not available');
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const sepIndex = buffer.indexOf('\n\n');
        if (sepIndex === -1) break;

        const event = buffer.substring(0, sepIndex);
        buffer = buffer.substring(sepIndex + 2);

        for (const line of event.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const payload = line.substring(5).trim();
          if (payload === '' || payload === '[DONE]') continue;

          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              onChunk(delta);
            }
          } catch {
            // Ignore broken json chunks
          }
        }
      }
    }
  }
}
