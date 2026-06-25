'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, MessageCircle, Paperclip, Send, X, FileText, AtSign } from 'lucide-react';
import {
  ApiError,
  getPaymentRequestMessages,
  getPrParticipants,
  markPrMessagesRead,
  sendPaymentRequestMessage,
} from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type { PrMessage, PrMessageAttachment, PrParticipant } from '@/types/domain';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  return isToday ? 'Today' : d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

function groupByDate(messages: PrMessage[]): { date: string; items: PrMessage[] }[] {
  const groups: { date: string; items: PrMessage[] }[] = [];
  for (const msg of messages) {
    const label = formatDate(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.date === label) last.items.push(msg);
    else groups.push({ date: label, items: [msg] });
  }
  return groups;
}

// Highlight @mentions inside a message bubble
function renderMessageText(text: string, isMine: boolean): React.ReactNode {
  const parts = text.split(/(@\S+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span
            key={i}
            className={`inline-block rounded px-1 font-semibold ${
              isMine ? 'bg-white/25 text-white' : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ─── attachment preview in message ─────────────────────────────────────────

function AttachmentChip({ att }: { att: PrMessageAttachment }) {
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 mt-1 px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-xs underline-offset-2 hover:underline transition-colors max-w-[200px] truncate"
    >
      <FileText className="h-3 w-3 shrink-0" />
      <span className="truncate">{att.fileName}</span>
    </a>
  );
}

// ─── mention option type ────────────────────────────────────────────────────

interface MentionOption {
  key: string;
  /** Text inserted into the message after @  */
  label: string;
  /** Description shown in the dropdown */
  hint: string;
}

// ─── main component ─────────────────────────────────────────────────────────

interface Props {
  paymentRequestId: string;
}

export function PaymentRequestChat({ paymentRequestId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [text, setText] = useState('');
  const [pendingFiles, setPendingFiles] = useState<
    { file: File; uploading: boolean; url?: string; fileName?: string; error?: string }[]
  >([]);
  // mention popup state
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── group messages (all participants) ──────────────────────────────────
  const {
    data: messages,
    error: messagesError,
    isLoading: messagesLoading,
  } = useQuery<PrMessage[], ApiError>({
    queryKey: ['pr-messages', paymentRequestId],
    queryFn: () => getPaymentRequestMessages(paymentRequestId),
    refetchInterval: 5000,
    retry: false,
  });

  // ── participants for @mention suggestions ───────────────────────────────
  const { data: participants } = useQuery<PrParticipant[], ApiError>({
    queryKey: ['pr-participants', paymentRequestId],
    queryFn: () => getPrParticipants(paymentRequestId),
    retry: false,
  });

  // Build mention list: @all first, then each participant by first name
  const mentionOptions = useMemo<MentionOption[]>(() => [
    { key: '__all__', label: 'all', hint: 'Notify everyone' },
    ...(participants ?? []).map((p: PrParticipant) => ({
      key: p.id,
      label: p.fullName.split(' ')[0],
      hint: p.fullName,
    })),
  ], [participants]);

  const filteredMentions = useMemo(
    () =>
      mentionQuery === ''
        ? mentionOptions
        : mentionOptions.filter((m) =>
            m.label.toLowerCase().startsWith(mentionQuery.toLowerCase()),
          ),
    [mentionOptions, mentionQuery],
  );

  const mentionOpen = mentionStart !== null && filteredMentions.length > 0;

  // Auto-scroll to latest message + mark as read
  useEffect(() => {
    if (open && messages?.length) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      markPrMessagesRead(paymentRequestId);
    }
  }, [messages, open, paymentRequestId]);

  // ── send mutation ───────────────────────────────────────────────────────
  const { mutate: send, isPending: isSending } = useMutation({
    mutationFn: ({ msg, attachments }: { msg: string; attachments: PrMessageAttachment[] }) =>
      sendPaymentRequestMessage(paymentRequestId, msg, attachments),
    onSuccess: () => {
      setText('');
      setPendingFiles([]);
      void queryClient.invalidateQueries({
        queryKey: ['pr-messages', paymentRequestId],
      });
    },
  });

  // ── hide if not a participant (403) ────────────────────────────────────
  if (messagesLoading) return null;
  if (messagesError instanceof ApiError && messagesError.status === 403) return null;
  if (messagesError) return null;

  // ── mention helpers ─────────────────────────────────────────────────────
  const selectMention = (label: string) => {
    if (mentionStart === null) return;
    const before = text.slice(0, mentionStart);
    const after = text.slice(mentionStart + 1 + mentionQuery.length);
    const newText = `${before}@${label} ${after}`;
    setText(newText);
    setMentionStart(null);
    setMentionQuery('');
    setMentionIndex(0);
    // Restore focus and move cursor to after the inserted mention
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = before.length + 1 + label.length + 1; // @ + label + space
        textareaRef.current.setSelectionRange(pos, pos);
        textareaRef.current.focus();
      }
    });
  };

  // ── file upload handlers ────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newEntries = files.map((file) => ({ file, uploading: true }));
    setPendingFiles((prev) => [...prev, ...newEntries]);

    newEntries.forEach(async (entry) => {
      try {
        const form = new FormData();
        form.append('file', entry.file);
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('pcs.token') : null;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/uploads/file`,
          { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form },
        );
        const data = (await res.json()) as { url: string; fileName: string };
        setPendingFiles((prev) =>
          prev.map((p) =>
            p.file === entry.file
              ? { ...p, uploading: false, url: data.url, fileName: data.fileName }
              : p,
          ),
        );
      } catch {
        setPendingFiles((prev) =>
          prev.map((p) =>
            p.file === entry.file ? { ...p, uploading: false, error: 'Upload failed' } : p,
          ),
        );
      }
    });

    e.target.value = '';
  };

  const removeFile = (file: File) => {
    setPendingFiles((prev) => prev.filter((p) => p.file !== file));
  };

  const handleSend = () => {
    const trimmed = text.trim();
    const readyAttachments: PrMessageAttachment[] = pendingFiles
      .filter((p) => !p.uploading && !p.error && p.url && p.fileName)
      .map((p) => ({ url: p.url!, fileName: p.fileName! }));

    if (!trimmed && readyAttachments.length === 0) return;
    if (pendingFiles.some((p) => p.uploading)) return;
    send({ msg: trimmed, attachments: readyAttachments });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart ?? val.length;
    setText(val);

    // Detect @ mention trigger
    const beforeCursor = val.slice(0, cursor);
    const atIdx = beforeCursor.lastIndexOf('@');
    if (atIdx !== -1) {
      const afterAt = beforeCursor.slice(atIdx + 1);
      // Only open popup if there's no space/newline after @ (still typing the handle)
      if (!/[\s\n]/.test(afterAt)) {
        setMentionStart(atIdx);
        setMentionQuery(afterAt);
        setMentionIndex(0);
        return;
      }
    }
    setMentionStart(null);
    setMentionQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Mention popup keyboard navigation
    if (mentionOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => Math.min(i + 1, filteredMentions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const opt = filteredMentions[mentionIndex];
        if (opt) selectMention(opt.label);
        return;
      }
      if (e.key === 'Escape') {
        setMentionStart(null);
        setMentionQuery('');
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const grouped = groupByDate(messages ?? []);
  const stillUploading = pendingFiles.some((p) => p.uploading);
  const canSend = (text.trim() || pendingFiles.some((p) => p.url)) && !stillUploading && !isSending;

  return (
    <div className="mt-6 border rounded-xl shadow-sm bg-white overflow-hidden">
      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-b hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MessageCircle className="h-4 w-4 text-indigo-500" />
          Group Chat
          {(messages?.length ?? 0) > 0 && (
            <span className="ml-1 text-xs font-normal text-slate-400">
              {messages!.length} message{messages!.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronUp className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="flex flex-col h-[420px]">
          {/* ── Message list ── */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-slate-50/40">
            {grouped.length === 0 ? (
              <p className="text-center text-xs text-slate-400 mt-12">
                No messages yet. Be the first to send a message.
              </p>
            ) : (
              grouped.map(({ date, items }) => (
                <div key={date}>
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 border-t border-slate-200" />
                    <span className="text-xs text-slate-400 whitespace-nowrap">{date}</span>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    {items.map((msg) => {
                      const isMine = msg.sender?.id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {!isMine && (
                              <span className="text-xs font-semibold text-slate-600">
                                {msg.sender?.fullName ?? 'Unknown'}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">{formatTime(msg.createdAt)}</span>
                            {isMine && (
                              <span className="text-xs font-semibold text-indigo-600">You</span>
                            )}
                          </div>
                          <div
                            className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-2xl text-sm break-words ${
                              isMine
                                ? 'bg-indigo-600 text-white rounded-br-sm'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                            }`}
                          >
                            {msg.message && (
                              <p className="whitespace-pre-wrap">
                                {renderMessageText(msg.message, isMine)}
                              </p>
                            )}
                            {msg.attachments?.length > 0 && (
                              <div className="flex flex-col gap-1 mt-1">
                                {msg.attachments.map((att, i) => (
                                  <AttachmentChip key={i} att={att} />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Pending file chips */}
          {pendingFiles.length > 0 && (
            <div className="px-3 py-2 border-t bg-slate-50 flex flex-wrap gap-2">
              {pendingFiles.map((p, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                    p.error
                      ? 'border-red-300 bg-red-50 text-red-600'
                      : p.uploading
                      ? 'border-slate-200 bg-slate-100 text-slate-500'
                      : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  }`}
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="max-w-[100px] truncate">{p.file.name}</span>
                  {p.uploading && <span className="text-[10px]">…</span>}
                  {p.error && <span className="text-[10px]">(failed)</span>}
                  {!p.uploading && (
                    <button type="button" onClick={() => removeFile(p.file)}>
                      <X className="h-3 w-3 hover:text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input area + mention popup */}
          <div className="relative border-t bg-white">
            {/* @mention dropdown — shown above the input */}
            {mentionOpen && (
              <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-20">
                <div className="px-3 py-1.5 border-b bg-slate-50">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Mention — type to filter
                  </p>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {filteredMentions.map((m, idx) => (
                    <button
                      key={m.key}
                      type="button"
                      onMouseDown={(e) => {
                        // Prevent textarea from losing focus before we insert
                        e.preventDefault();
                        selectMention(m.label);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                        idx === mentionIndex ? 'bg-indigo-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm font-semibold text-indigo-600">@{m.label}</span>
                      <span className="text-xs text-slate-400 truncate">{m.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end gap-2 px-3 py-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.csv,.xls,.xlsx"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              {/* @ button — quick trigger for mention popup */}
              <button
                type="button"
                title="Mention someone"
                onClick={() => {
                  const ta = textareaRef.current;
                  if (!ta) return;
                  const cursor = ta.selectionStart ?? text.length;
                  const before = text.slice(0, cursor);
                  const after = text.slice(cursor);
                  const newText = `${before}@${after}`;
                  setText(newText);
                  setMentionStart(cursor);
                  setMentionQuery('');
                  setMentionIndex(0);
                  requestAnimationFrame(() => {
                    ta.setSelectionRange(cursor + 1, cursor + 1);
                    ta.focus();
                  });
                }}
                className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <AtSign className="h-4 w-4" />
              </button>
              <textarea
                ref={textareaRef}
                rows={1}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Message everyone… (type @ to mention)"
                className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent max-h-28 overflow-y-auto"
                style={{ minHeight: '38px' }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="shrink-0 inline-flex items-center justify-center rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title={stillUploading ? 'Waiting for uploads…' : 'Send'}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
