import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
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

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // 展开时聚焦输入框，滚动到底部
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [open]);

  async function onSend() {
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
      const res = await chat({ message, history });
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void onSend();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter 发送，Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  }

  function toggleOpen() {
    setOpen((prev) => !prev);
    setError(null);
  }

  return (
    <>
      {/* 浮动按钮 */}
      <button
        type="button"
        className={`ai-fab${open ? ' ai-fab-active' : ''}`}
        onClick={toggleOpen}
        title="AI 学习助手"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* 聊天面板 */}
      {open ? (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <span>AI 学习助手</span>
            <button type="button" className="ai-panel-close" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <div className="ai-panel-body">
            {messages.length === 0 && !error ? (
              <p className="ai-empty">
                👋 你好！我是学习助手，可以回答学习相关的问题、总结要点、解释概念。试试问我吧！
              </p>
            ) : (
              <div className="ai-messages">
                {messages.map((m, i) => (
                  <div
                    key={`${m.role}-${i}`}
                    className={`ai-bubble ${m.role}`}
                  >
                    <div className="chat-role">
                      {m.role === 'user' ? '我' : '🤖 助手'}
                    </div>
                    <div className="chat-content">{m.content}</div>
                  </div>
                ))}
              </div>
            )}
            {error ? <div className="form-error">{error}</div> : null}
            <div ref={bottomRef} />
          </div>

          <form className="ai-panel-footer" onSubmit={onSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="输入问题，Enter 发送…"
              rows={2}
              disabled={sending}
            />
            <button type="submit" className="btn primary" disabled={sending || !input.trim()}>
              {sending ? '…' : '发送'}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
