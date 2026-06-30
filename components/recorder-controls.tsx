'use client';

type Props = {
  onStart: () => void;
  onStop: () => void;
  disabledStart?: boolean;
  disabledStop?: boolean;
};

export function RecorderControls({
  onStart,
  onStop,
  disabledStart,
  disabledStop,
}: Props) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onStart}
        disabled={disabledStart}
        className="rounded-xl bg-emerald-500 px-5 py-3 font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
      >
        开始转写
      </button>
      <button
        type="button"
        onClick={onStop}
        disabled={disabledStop}
        className="rounded-xl bg-zinc-800 px-5 py-3 font-medium text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-zinc-500"
      >
        停止
      </button>
    </div>
  );
}
