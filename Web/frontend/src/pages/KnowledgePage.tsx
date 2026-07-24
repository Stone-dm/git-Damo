import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { listKnowledge, uploadKnowledge } from '../api/knowledge';
import type { KbDocumentView, KbType } from '../api/types';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

export function KnowledgePage() {
  const [items, setItems] = useState<KbDocumentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [kbType, setKbType] = useState<KbType>('LEARNING');
  const [content, setContent] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await listKnowledge());
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await uploadKnowledge({
        title: title.trim(),
        kbType,
        content,
        sourceName: sourceName.trim() || undefined,
      });
      setTitle('');
      setContent('');
      setSourceName('');
      setKbType('LEARNING');
      await load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h2>知识库</h2>
      <p className="muted">查看文档元数据，并可通过文本表单入库。</p>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="panel">
        <h3>文本入库</h3>
        <form className="form-grid" onSubmit={onUpload}>
          <label>
            标题
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label>
            知识库类型
            <select
              value={kbType}
              onChange={(e) => setKbType(e.target.value as KbType)}
            >
              <option value="LEARNING">LEARNING（学习库）</option>
              <option value="PERSONAL">PERSONAL（个人库）</option>
            </select>
          </label>
          <label>
            来源名称
            <input
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="可选，如 note.txt"
            />
          </label>
          <label className="span-2">
            正文内容
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? '入库中…' : '提交入库'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h3>文档列表</h3>
        {loading ? (
          <p className="muted">加载中…</p>
        ) : items.length === 0 ? (
          <p className="muted">暂无文档</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>标题</th>
                  <th>类型</th>
                  <th>同步状态</th>
                  <th>来源</th>
                  <th>支部</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {items.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.id}</td>
                    <td>{doc.title}</td>
                    <td>{doc.kbType}</td>
                    <td>
                      <span
                        className={`badge status-${doc.syncStatus.toLowerCase()}`}
                      >
                        {doc.syncStatus}
                      </span>
                    </td>
                    <td>{doc.sourceName || '—'}</td>
                    <td>{doc.branchId ?? '—'}</td>
                    <td>{new Date(doc.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
