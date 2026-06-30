'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError('请先选择语音文件。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranscript('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/transcribe-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? '转写失败。');
      }

      setTranscript(data.transcript || '');
    } catch (err) {
      const message = err instanceof Error ? err.message : '转写失败。';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">上传语音文件转文字</h1>
        <p className="text-sm leading-7 text-zinc-400">
          上传音频文件并返回文字结果。当前页面通过服务端接口进行转写。
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl shadow-black/20"
      >
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium text-zinc-200">选择音频文件</label>
          <input
            type="file"
            accept="audio/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-fit rounded-xl bg-cyan-500 px-5 py-3 font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
          >
            {isLoading ? '转写中...' : '开始转写'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl shadow-black/20">
        <h2 className="mb-4 text-lg font-semibold">转写结果</h2>
        <div className="min-h-[220px] rounded-xl bg-zinc-900/70 p-4 text-sm leading-7 text-zinc-100">
          {transcript || <span className="text-zinc-500">上传文件后，这里会显示文字结果。</span>}
        </div>
      </section>
    </main>
  );
}
