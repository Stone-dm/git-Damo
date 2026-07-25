import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { ApiError } from '../api/client';
import { listKnowledge, uploadKnowledge } from '../api/knowledge';
import type { KbDocumentView, KbType } from '../api/types';

// pdf.js worker — use CDN to avoid bundling the full ~2MB worker into the app
GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.docx', '.pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
  const [dragOver, setDragOver] = useState(false);
  const [fileMessage, setFileMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- 文档导入（拖拽 + 文件选择） ---

  async function extractText(file: File): Promise<string> {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    // 纯文本文件
    if (ext === '.txt' || ext === '.md') {
      return await file.text();
    }

    // Word 文档
    if (ext === '.docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    // PDF 文档
    if (ext === '.pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ('str' in item ? (item as { str: string }).str : ''))
          .join(' ');
        pages.push(pageText);
      }
      return pages.join('\n');
    }

    // 不应到达此处（handleFile 已做扩展名校验）
    throw new Error(`不支持的文件类型: ${ext}`);
  }

  async function handleFile(file: File) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileMessage(`不支持的文件类型 "${ext}"，仅支持 ${ALLOWED_EXTENSIONS.join(' / ')}`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileMessage(`文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），最大 10MB`);
      return;
    }

    setFileMessage('正在解析文件…');
    let text: string;
    try {
      text = await extractText(file);
    } catch (err) {
      setFileMessage('文件解析失败，请确认文件未被加密或损坏');
      return;
    }

    if (!text.trim()) {
      setFileMessage('文件内容为空或无法提取文本');
      return;
    }

    // 去掉扩展名作为默认标题
    const titleFromName = file.name.replace(/\.[^.]+$/, '');
    setTitle(titleFromName);
    setSourceName(file.name);
    setContent(text);
    const kbDesc = ext === '.pdf' ? `${pdfPageHint(text)}，` : '';
    setFileMessage(
      `✓ 已导入 ${file.name}（${kbDesc}${(file.size / 1024).toFixed(1)}KB），内容已填入表单`,
    );
  }

  function pdfPageHint(text: string): string {
    // PDF 提取文本通常每页一段，粗略估算页数
    const lines = text.split('\n').filter(Boolean);
    return `约 ${lines.length} 段`;
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    setFileMessage(null);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setFileMessage(null);
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // 重置 input 以便重复选择同一文件
    e.target.value = '';
  }

  return (
    <div className="page">
      <h2>知识库</h2>
      <p className="muted">查看文档元数据，并可通过文本表单入库。</p>

      {error ? <div className="form-error">{error}</div> : null}

      {/* --- 文档导入 --- */}
      <div className="panel">
        <h3>文档导入</h3>
        <p className="muted">拖拽文件到下方区域或点击选择，内容将自动填入表单。</p>
        <div
          className={`drop-zone${dragOver ? ' drag-over' : ''}`}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="drop-zone-icon">📄</span>
          <span>拖拽 .txt / .md / .docx / .pdf 文件到此处</span>
          <span className="drop-zone-hint">或点击选择文件 · 最大 10MB</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.docx,.pdf"
            style={{ display: 'none' }}
            onChange={onFileSelect}
          />
        </div>
        {fileMessage ? (
          <div className={`file-info${fileMessage.startsWith('✓') ? '' : ' file-info-error'}`}>
            {fileMessage}
          </div>
        ) : null}
      </div>

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
