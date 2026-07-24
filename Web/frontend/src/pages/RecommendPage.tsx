import { useState, type FormEvent } from 'react';
import { recommend } from '../api/agent';
import { ApiError } from '../api/client';
import type { RecommendItem } from '../api/types';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

export function RecommendPage() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<RecommendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await recommend({
        query: query.trim() || undefined,
      });
      setItems(res.items ?? []);
      setFetched(true);
    } catch (err) {
      setError(errMsg(err));
      setItems([]);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h2>智能推荐</h2>
      <p className="muted">基于双知识库检索生成个性化学习推荐。</p>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="panel">
        <form className="form-inline" onSubmit={onSubmit}>
          <label className="grow">
            查询（可选）
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例如：二十大报告学习要点"
            />
          </label>
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? '生成中…' : '获取推荐'}
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>推荐结果</h3>
        {!fetched && !loading ? (
          <p className="muted">点击「获取推荐」开始。</p>
        ) : null}
        {loading ? <p className="muted">加载中…</p> : null}
        {fetched && !loading && items.length === 0 ? (
          <p className="muted">暂无推荐结果</p>
        ) : null}
        {items.length > 0 ? (
          <ul className="recommend-list">
            {items.map((item, idx) => (
              <li key={`${item.document_id}-${idx}`}>
                <div className="recommend-title">{item.title}</div>
                <div className="recommend-reason">{item.reason}</div>
                <div className="muted">文档 ID：{item.document_id || '—'}</div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
