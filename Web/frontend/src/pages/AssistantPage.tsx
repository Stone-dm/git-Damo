import { useRef, useState, type FormEvent } from 'react';
import { chat } from '../api/agent';
import { ApiError } from '../api/client';
import type { ChatHistoryItem } from '../api/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

export function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [extraText, setExtraText] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    setError(null);
    setSending(true);
    setInput('');

    const history: ChatHistoryItem[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, { role: 'user', content: message }]);

    try {
      const parsedDoc =
        documentId.trim() === '' ? null : Number(documentId.trim());
      const res = await chat({
        message,
        text: extraText.trim() || null,
        documentId: Number.isFinite(parsedDoc) ? parsedDoc : null,
        history,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply },
      ]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch (err) {
      setError(errMsg(err));
      setMessages((prev) => prev.slice(0, -1));
      setInput(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page">
      <h2>学习助手</h2>
      <p className="muted">
        聊天对话；可附加文本用于总结整理，也可指定知识库文档 ID。
      </p>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="panel chat-panel">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <p className="muted">开始提问，例如：「帮我总结这段材料的要点」</p>
          ) : (
            messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="chat-role">
                  {m.role === 'user' ? '我' : '助手'}
                </div>
                <div className="chat-content">{m.content}</div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form className="chat-form" onSubmit={onSend}>
          <label className="span-2">
            附加文本（可选，用于总结）
            <textarea
              value={extraText}
              onChange={(e) => setExtraText(e.target.value)}
              rows={3}
              placeholder="粘贴需要总结或整理的原文…"
            />
          </label>
          <label>
            文档 ID（可选）
            <input
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="知识库文档 ID"
            />
          </label>
          <label className="grow">
            消息
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入问题或指令…"
              required
            />
          </label>
          <button type="submit" className="btn primary" disabled={sending}>
            {sending ? '发送中…' : '发送'}
          </button>
        </form>
      </div>
    </div>
  );
}
