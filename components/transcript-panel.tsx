'use client';

import type { TranscriptSegment } from '@/lib/types';

type Props = {
  segments: TranscriptSegment[];
  interimText: string;
};

export function TranscriptPanel({ segments, interimText }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">实时字幕</h2>
        <span className="text-xs text-zinc-400">Final + Interim</span>
      </div>

      <div className="min-h-[320px] space-y-3 overflow-y-auto rounded-xl bg-zinc-900/70 p-4">
        {segments.length === 0 && !interimText ? (
          <p className="text-sm text-zinc-500">开始说话后，这里会实时显示转写结果。</p>
        ) : null}

        {segments.map((segment) => (
          <div
            key={segment.id}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-7 text-zinc-100"
          >
            {segment.text}
          </div>
        ))}

        {interimText ? (
          <div className="rounded-lg border border-dashed border-cyan-700 bg-cyan-500/5 px-4 py-3 text-sm leading-7 text-cyan-100">
            {interimText}
          </div>
        ) : null}
      </div>
    </div>
  );
}
