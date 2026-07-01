'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, UserCheck, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useNotify } from '@/hooks/use-notify';
import type { Delegation, User } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

function today() {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DelegateTasksDialog({ open, onClose }: Props) {
  const notify = useNotify();
  const qc = useQueryClient();

  const [delegateeId, setDelegateeId] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Load peers (users sharing at least one role)
  const { data: peers = [], isLoading: peersLoading } = useQuery<User[]>({
    queryKey: ['users', 'peers'],
    queryFn: () => api.get<User[]>('/users/peers'),
    enabled: open,
  });

  // Load existing outgoing delegations
  const { data: outgoing = [] } = useQuery<Delegation[]>({
    queryKey: ['delegations', 'outgoing'],
    queryFn: () => api.get<Delegation[]>('/delegations/outgoing'),
    enabled: open,
  });

  const activeDelegate = outgoing.find((d) => d.status === 'ACTIVE');

  const createMutation = useMutation({
    mutationFn: (body: { delegateeId: string; startDate: string; endDate: string; reason?: string }) =>
      api.post<Delegation>('/delegations', body),
    onSuccess: () => {
      notify.success('Delegation created', 'Your tasks have been delegated successfully.');
      qc.invalidateQueries({ queryKey: ['delegations'] });
      resetForm();
      onClose();
    },
    onError: (err) => notify.error('Failed to create delegation', err),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/delegations/${id}/cancel`),
    onSuccess: () => {
      notify.success('Delegation cancelled');
      qc.invalidateQueries({ queryKey: ['delegations'] });
    },
    onError: (err) => notify.error('Failed to cancel delegation', err),
  });

  function resetForm() {
    setDelegateeId('');
    setStartDate(today());
    setEndDate('');
    setReason('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!delegateeId) { notify.error('Please select a delegate'); return; }
    if (!endDate) { notify.error('Please select an end date'); return; }
    if (endDate < startDate) { notify.error('End date must be on or after start date'); return; }
    createMutation.mutate({ delegateeId, startDate, endDate, reason: reason || undefined });
  }

  const peerOptions = peers.map((p) => ({ value: p.id, label: `${p.fullName} — ${p.email}` }));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Delegate My Tasks
          </DialogTitle>
        </DialogHeader>

        {/* Active delegation banner */}
        {activeDelegate && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-yellow-900">Active delegation</p>
                <p className="text-yellow-700 mt-0.5">
                  Delegated to{' '}
                  <span className="font-medium">{activeDelegate.delegatee.fullName}</span>
                  {' '}from {activeDelegate.startDate} to {activeDelegate.endDate}
                </p>
              </div>
              <button
                onClick={() => cancelMutation.mutate(activeDelegate.id)}
                disabled={cancelMutation.isPending}
                className="shrink-0 text-yellow-700 hover:text-red-600 transition-colors mt-0.5"
                title="Cancel delegation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Delegate to */}
          <div className="space-y-1.5">
            <Label>Delegate to</Label>
            {peersLoading ? (
              <div className="text-sm text-gray-500">Loading colleagues...</div>
            ) : peers.length === 0 ? (
              <div className="text-sm text-gray-500 rounded-md border border-dashed p-3">
                No colleagues share your roles. Contact your administrator.
              </div>
            ) : (
              <Select
                options={peerOptions}
                placeholder="Select a colleague"
                value={delegateeId}
                onChange={(e) => setDelegateeId(e.target.value)}
              />
            )}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> From
              </Label>
              <Input
                type="date"
                min={today()}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> To
              </Label>
              <Input
                type="date"
                min={startDate || today()}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="e.g. Annual leave, medical leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || peers.length === 0}
            >
              {createMutation.isPending ? 'Delegating...' : 'Delegate Tasks'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
