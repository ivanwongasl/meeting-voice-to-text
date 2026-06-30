'use client';

import { useMemo } from 'react';
import { formatStatusLabel } from '@/lib/format';

type Props = {
  status: string;
  error: string | null;
};

export function StatusBar({ status, error }: Props) {
  const tone = useMemo(() => {
    if (error) return 'bg-red-500/15 text-red-200 border-red-500/30';
    if (status === 'recording' || status === 'transcribing') {
      return 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30';
    }
    if (status === 'connecting') {
      return 'bg-amber-500/15 text-amber-200 border-amber-500/30';
    }
    return 'bg-zinc-800 text-zinc-200 border-zinc-700';
  }, [error, status]);

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tone}`}>
      <div className="font-medium">状态：{formatStatusLabel(error ? 'error' : status)}</div>
      <div className="mt-1 opacity-90">{error ?? '系统已就绪，可开始实时转写。'}</div>
    </div>
  );
}
