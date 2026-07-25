import { useEffect, useRef, useState, type FormEvent } from 'react';
import { listMaterials, uploadMaterial, deleteMaterial } from '../api/materials';
import { listQuestions, importQuestions, deleteQuestion } from '../api/questions';
import type { MaterialType, MaterialView, QuestionImportResult, QuestionView } from '../api/types';

type Tab = 'material' | 'question';

export function ResourceCenterPage() {
  const [tab, setTab] = useState<Tab>('material');

  return (
    <div className="page">
      <h2>资源中心</h2>

      <div className="tab-bar">
        <button className={`tab-btn${tab === 'material' ? ' active' : ''}`} onClick={() => setTab('material')}>
          图文视频素材
        </button>
        <button className={`tab-btn${tab === 'question' ? ' active' : ''}`} onClick={() => setTab('question')}>
          题库管理
        </button>
      </div>

      {tab === 'material' ? <MaterialTab /> : <QuestionTab />}
    </div>
  );
}

/* ============================ 素材管理 ============================ */

function MaterialTab() {
  const [items, setItems] = useState<MaterialView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [mtype, setMtype] = useState<MaterialType>('IMAGE');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await listMaterials());
    } catch (e: any) {
      setError(e.message ?? '加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      await uploadMaterial(title.trim(), mtype, file);
      setTitle('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (e: any) {
      setError(e.message ?? '上传失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm('确认删除该素材？')) return;
    try {
      await deleteMaterial(id);
      await load();
    } catch (e: any) {
      setError(e.message ?? '删除失败');
    }
  }

  return (
    <>
      {error ? <div className="form-error">{error}</div> : null}

      <div className="panel">
        <h3>上传素材</h3>
        <form className="form-grid" onSubmit={onUpload}>
          <label>
            标题
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            类型
            <select value={mtype} onChange={(e) => setMtype(e.target.value as MaterialType)}>
              <option value="IMAGE">图片</option>
              <option value="VIDEO">视频</option>
              <option value="TEXT">文本</option>
            </select>
          </label>
          <label>
            文件
            <input
              ref={fileRef}
              type="file"
              accept={mtype === 'IMAGE' ? 'image/*' : mtype === 'VIDEO' ? 'video/*' : '.txt,.md'}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={submitting || !file}>
              {submitting ? '上传中…' : '上传'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h3>素材列表</h3>
        {loading ? <p className="muted">加载中…</p> : items.length === 0 ? <p className="muted">暂无素材</p> : (
          <div className="card-grid">
            {items.map((item) => (
              <div key={item.id} className="mat-card">
                <div className="mat-preview">
                  {item.type === 'IMAGE' && item.fileAccessUrl ? (
                    <img src={item.fileAccessUrl} alt={item.title} />
                  ) : item.type === 'VIDEO' ? (
                    <span className="mat-video-icon">🎬</span>
                  ) : (
                    <span className="mat-text-preview">
                      {(item.content ?? '').slice(0, 120)}{(item.content ?? '').length > 120 ? '…' : ''}
                    </span>
                  )}
                </div>
                <div className="mat-info">
                  <span className="mat-title">{item.title}</span>
                  <span className="mat-meta">{item.type} · {new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <button className="btn danger mat-del" onClick={() => onDelete(item.id)}>删除</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ============================ 题库管理 ============================ */

function QuestionTab() {
  const [questions, setQuestions] = useState<QuestionView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<QuestionImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadQuestions() {
    setLoading(true);
    setError(null);
    try {
      setQuestions(await listQuestions());
      setImportResult(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadQuestions(); }, []);

  async function onImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('请选择文件'); return; }
    setError(null);
    try {
      setImportResult(await importQuestions(file));
      if (fileRef.current) fileRef.current.value = '';
      await loadQuestions();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function onDeleteQuestion(id: number | null) {
    if (id == null) return;
    if (!confirm('确认删除该题目？')) return;
    try {
      await deleteQuestion(id);
      await loadQuestions();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <>
      {error ? <div className="form-error">{error}</div> : null}

      {/* 导入 */}
      <div className="panel">
        <h3>导入题库</h3>
        <p className="muted">支持 Excel (.xlsx) 和 Word (.docx) 批量导入，自动智能解析题目。</p>
        <div className="import-row">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.docx" />
          <button type="button" className="btn primary" onClick={onImport}>解析并导入</button>
        </div>
        {importResult ? (
          <div className={`import-result${importResult.errors.length > 0 ? '' : ' import-success'}`}>
            <p>✓ 成功导入 {importResult.parsedCount} 道题目</p>
            {importResult.errors.length > 0 ? (
              <ul>{importResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* 题目列表 */}
      <div className="panel">
        <h3>题库列表 ({questions.length})</h3>
        {loading ? <p className="muted">加载中…</p> : questions.length === 0 ? <p className="muted">暂无题目，请导入 Excel 或 Word 文件</p> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>题型</th><th>题干</th><th>答案</th><th>分值</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={q.id ?? i}>
                    <td>{q.orderNum || i + 1}</td>
                    <td>{typeLabel(q.type)}</td>
                    <td className="stem-cell" title={q.stem}>{q.stem.length > 60 ? q.stem.slice(0, 60) + '…' : q.stem}</td>
                    <td>{q.answer || '—'}</td>
                    <td>{q.score}</td>
                    <td>
                      <button className="btn danger" onClick={() => onDeleteQuestion(q.id)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function typeLabel(t: string): string {
  const map: Record<string, string> = { SINGLE: '单选', MULTI: '多选', JUDGE: '判断', FILL: '填空', ESSAY: '简答' };
  return map[t] ?? t;
}
