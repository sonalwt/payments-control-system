'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { NotificationsResponse } from '@/types/domain';

const QUERY_KEY = ['notifications'];

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery<NotificationsResponse>({
    queryKey: QUERY_KEY,
    queryFn: () => api.get<NotificationsResponse>('/notifications'),
    refetchInterval: 30_000, // poll every 30 seconds
    staleTime: 15_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    notifications: query.data?.data ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
  };
}
