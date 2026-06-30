export function formatStatusLabel(status: string) {
  switch (status) {
    case 'idle':
      return '空闲';
    case 'connecting':
      return '连接中';
    case 'connected':
      return '已连接';
    case 'recording':
      return '录音中';
    case 'transcribing':
      return '转写中';
    case 'stopped':
      return '已停止';
    case 'error':
      return '错误';
    default:
      return status;
  }
}
