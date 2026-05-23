import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api';
import type { AiChatModel, AiMessageModel, AiSummaryModel } from '../model/types';

// -------------------------------------------------------------------------
// AI Chats Hooks
// -------------------------------------------------------------------------

export function useAiChatsQuery(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ai_chats', userId],
    queryFn: async (): Promise<AiChatModel[]> => {
      const { data, error } = await supabase
        .from('ai_chats')
        .select()
        .eq('user_id', userId!)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AiChatModel[];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime:ai_chats:${userId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', filter: `user_id=eq.${userId}`, schema: 'public', table: 'ai_chats' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ai_chats', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

export function useCreateAiChatMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title?: string): Promise<AiChatModel> => {
      const { data, error } = await supabase
        .from('ai_chats')
        .insert({ user_id: userId, title: title || 'New chat' })
        .select()
        .single();

      if (error) throw error;
      return data as AiChatModel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_chats', userId] });
    },
  });
}

export function useRenameAiChatMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { chatId: string; title: string }): Promise<void> => {
      const { error } = await supabase
        .from('ai_chats')
        .update({ title: vars.title })
        .eq('id', vars.chatId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_chats', userId] });
    },
  });
}

export function useDeleteAiChatMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string): Promise<void> => {
      const { error } = await supabase
        .from('ai_chats')
        .delete()
        .eq('id', chatId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_chats', userId] });
    },
  });
}

// -------------------------------------------------------------------------
// AI Messages Hooks
// -------------------------------------------------------------------------

export function useAiMessagesQuery(chatId?: string, userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ai_messages', chatId],
    queryFn: async (): Promise<AiMessageModel[]> => {
      const { data, error } = await supabase
        .from('ai_messages')
        .select()
        .eq('chat_id', chatId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as AiMessageModel[];
    },
    enabled: !!chatId && !!userId,
  });

  useEffect(() => {
    if (!chatId || !userId) return;

    const channel = supabase
      .channel(`realtime:ai_messages:${chatId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', filter: `chat_id=eq.${chatId}`, schema: 'public', table: 'ai_messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ai_messages', chatId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, userId, queryClient]);

  return query;
}

export function useInsertAiMessageMutation(userId: string, chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      role: 'user' | 'assistant' | 'system';
      content: string;
      tokensUsed?: number;
    }): Promise<AiMessageModel> => {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          chat_id: chatId,
          user_id: userId,
          role: vars.role,
          content: vars.content,
          tokens_used: vars.tokensUsed,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AiMessageModel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['ai_chats', userId] }); // to update list drawer order (updated_at changes on message post)
    },
  });
}

// -------------------------------------------------------------------------
// AI Summaries Hooks
// -------------------------------------------------------------------------

export function useAiSummariesQuery(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ai_summaries', userId],
    queryFn: async (): Promise<AiSummaryModel[]> => {
      const { data, error } = await supabase
        .from('ai_summaries')
        .select()
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AiSummaryModel[];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime:ai_summaries:${userId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', filter: `user_id=eq.${userId}`, schema: 'public', table: 'ai_summaries' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ai_summaries', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

export function useRegenerateSummaryMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      rangeEndN: number;
      openRouterKey?: string;
      model?: string;
    }): Promise<string> => {
      const payload: Record<string, string | number> = {
        user_id: userId,
        range_end_n: vars.rangeEndN,
      };
      if (vars.openRouterKey) payload['openrouter_key'] = vars.openRouterKey;
      if (vars.model) payload['model'] = vars.model;

      const { data, error } = await supabase.functions.invoke('generate_summary', {
        body: payload,
      });

      if (error) throw error;
      if (data?.ok === false || data?.status === 'error') {
        throw new Error(data.reason || 'Failed to regenerate summary');
      }

      const summaryId = data?.summary_id;
      if (!summaryId) {
        throw new Error('No summary_id returned from Edge Function');
      }

      return summaryId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_summaries', userId] });
    },
  });
}

export function useDeleteSummaryMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (summaryId: string): Promise<void> => {
      const { error } = await supabase
        .from('ai_summaries')
        .delete()
        .eq('id', summaryId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_summaries', userId] });
    },
  });
}
