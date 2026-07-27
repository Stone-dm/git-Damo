import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';

type ResourceType = 'article' | 'video';
type ResourceStatus = 'pending' | 'approved' | 'rejected';

interface LibraryResource {
  id: number;
  fileName: string;
  type: ResourceType;
  categories: string[];
  uploadedAt: string;
  status: ResourceStatus;
  progress: number;
  size: string;
}

const TYPE_LABEL: Record<ResourceType, string> = {
  article: '图文',
  video: '视频',
};

const STATUS_LABEL: Record<ResourceStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
};

const STATUS_CLASS: Record<ResourceStatus, string> = {
  pending: 'status-pending',
  approved: 'status-open',
  rejected: 'status-failed',
};

const INITIAL_CATEGORIES = ['党史理论', '时事政治', '党章党规', '基层治理'];

const INITIAL_RESOURCES: LibraryResource[] = [
  {
    id: 1,
    fileName: '二十大报告学习要点图文稿.pdf',
    type: 'article',
    categories: ['党史理论', '党章党规'],
    uploadedAt: '2026-07-25 09:24',
    status: 'approved',
    progress: 100,
    size: '4.8 MB',
  },
  {
    id: 2,
    fileName: '支部书记讲党课短视频.mp4',
    type: 'video',
    categories: ['党史理论'],
    uploadedAt: '2026-07-25 16:10',
    status: 'pending',
    progress: 100,
    size: '86.2 MB',
  },
  {
    id: 3,
    fileName: '中央会议精神速览长图.png',
    type: 'article',
    categories: ['时事政治'],
    uploadedAt: '2026-07-26 11:05',
    status: 'approved',
    progress: 100,
    size: '2.1 MB',
  },
  {
    id: 4,
    fileName: '党章党规知识问答素材.docx',
    type: 'article',
    categories: ['党章党规'],
    uploadedAt: '2026-07-26 18:36',
    status: 'rejected',
    progress: 100,
    size: '620 KB',
  },
];

function inferType(file: File): ResourceType {
  return file.type.startsWith('video/') ? 'video' : 'article';
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ResourceLibraryPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resources, setResources] = useState<LibraryResource[]>(INITIAL_RESOURCES);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [dragOver, setDragOver] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingResource, setEditingResource] = useState<LibraryResource | null>(null);
  const [previewResource, setPreviewResource] = useState<LibraryResource | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const filteredResources = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    return resources.filter((item) => {
      if (typeFilter && item.type !== typeFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (categoryFilter && !item.categories.includes(categoryFilter)) return false;
      if (search) {
        const haystack = `${item.fileName} ${item.categories.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [categoryFilter, keyword, resources, statusFilter, typeFilter]);

  function resetFilters() {
    setKeyword('');
    setTypeFilter('');
    setStatusFilter('');
    setCategoryFilter('');
  }

  function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const now = Date.now();
    const nextItems = fileArray.map((file, index) => ({
      id: now + index,
      fileName: file.name,
      type: inferType(file),
      categories: categories.slice(0, 1),
      uploadedAt: formatDate(new Date()),
      status: 'pending' as ResourceStatus,
      progress: 0,
      size: formatSize(file.size),
    }));

    setResources((current) => [...nextItems, ...current]);

    nextItems.forEach((item, index) => {
      let progress = 0;
      const timer = window.setInterval(() => {
        progress = Math.min(100, progress + 14 + index * 3);
        setResources((current) => current.map((resource) => (
          resource.id === item.id ? { ...resource, progress } : resource
        )));
        if (progress >= 100) window.clearInterval(timer);
      }, 260);
    });
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) handleFiles(event.target.files);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    handleFiles(event.dataTransfer.files);
  }

  function updateResourceCategories(resourceId: number, nextCategories: string[]) {
    setResources((current) => current.map((resource) => (
      resource.id === resourceId ? { ...resource, categories: nextCategories } : resource
    )));
    setEditingResource(null);
  }

  function deleteResource(resourceId: number) {
    if (!window.confirm('确认删除该资源？')) return;
    setResources((current) => current.filter((resource) => resource.id !== resourceId));
  }

  function addCategory() {
    const name = draftCategory.trim();
    if (!name || categories.includes(name)) return;
    setCategories((current) => [...current, name]);
    setDraftCategory('');
  }

  function saveCategoryRename(oldName: string) {
    const nextName = editingCategoryName.trim();
    if (!nextName || (nextName !== oldName && categories.includes(nextName))) return;
    setCategories((current) => current.map((item) => (item === oldName ? nextName : item)));
    setResources((current) => current.map((resource) => ({
      ...resource,
      categories: resource.categories.map((item) => (item === oldName ? nextName : item)),
    })));
    setEditingCategory(null);
    setEditingCategoryName('');
  }

  function deleteCategory(name: string) {
    if (!window.confirm(`确认删除分类“${name}”？资源上的该分类标签也会移除。`)) return;
    setCategories((current) => current.filter((item) => item !== name));
    setResources((current) => current.map((resource) => ({
      ...resource,
      categories: resource.categories.filter((item) => item !== name),
    })));
  }

  return (
    <div className="page resource-library-page">
      <div className="resource-library-heading">
        <div>
          <h2>资源库管理</h2>
          <p className="muted">学习资源 / 资源库管理，使用模拟数据管理图文与视频素材</p>
        </div>
        <button className="btn ghost" type="button" onClick={() => setCategoryModalOpen(true)}>
          分类管理
        </button>
      </div>

      <div className="panel resource-upload-panel">
        <h3>素材上传</h3>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md"
          className="resource-file-input"
          onChange={handleInputChange}
        />
        <div
          className={`drop-zone resource-drop-zone${dragOver ? ' drag-over' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <span className="drop-zone-icon">上传</span>
          <strong>拖拽文件到此处，或点击选择文件</strong>
          <span className="drop-zone-hint">支持图文、PDF、Word、视频文件批量上传</span>
        </div>
        {resources.some((item) => item.progress < 100) && (
          <div className="upload-progress-list">
            {resources.filter((item) => item.progress < 100).map((item) => (
              <div key={item.id} className="upload-progress-item">
                <span>{item.fileName}</span>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${item.progress}%` }} />
                </div>
                <strong>{item.progress}%</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="resource-table-head">
          <h3>资源列表</h3>
          <span className="muted">共 {filteredResources.length} 条</span>
        </div>

        <div className="filter-bar" style={{ marginTop: 0 }}>
          <div className="filter-bar-row">
            <div className="filter-group">
              <span className="filter-label">关键词</span>
              <input className="filter-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索文件名或分类" />
            </div>
            <div className="filter-group">
              <span className="filter-label">类型</span>
              <select className="filter-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as ResourceType | '')}>
                <option value="">全部类型</option>
                <option value="article">图文</option>
                <option value="video">视频</option>
              </select>
            </div>
            <div className="filter-group">
              <span className="filter-label">状态</span>
              <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ResourceStatus | '')}>
                <option value="">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已驳回</option>
              </select>
            </div>
            <div className="filter-group">
              <span className="filter-label">分类</span>
              <select className="filter-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="">全部分类</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            {(keyword || typeFilter || statusFilter || categoryFilter) && (
              <button className="btn ghost" type="button" onClick={resetFilters}>清除筛选</button>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table resource-table">
            <thead>
              <tr>
                <th>文件名</th>
                <th>类型</th>
                <th>分类标签</th>
                <th>上传时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="resource-name-cell">
                      <strong>{item.fileName}</strong>
                      <span className="muted">{item.size}</span>
                    </div>
                  </td>
                  <td><span className={`badge resource-type-${item.type}`}>{TYPE_LABEL[item.type]}</span></td>
                  <td>
                    <div className="resource-tags">
                      {item.categories.length === 0 ? <span className="muted">未分类</span> : item.categories.map((category) => (
                        <span key={category} className="resource-tag">{category}</span>
                      ))}
                    </div>
                  </td>
                  <td>{item.uploadedAt}</td>
                  <td><span className={`badge ${STATUS_CLASS[item.status]}`}>{STATUS_LABEL[item.status]}</span></td>
                  <td>
                    <div className="action-btn-group">
                      <button className="btn ghost" type="button" onClick={() => setEditingResource(item)}>编辑分类</button>
                      <button className="btn ghost" type="button" onClick={() => setPreviewResource(item)}>预览</button>
                      <button className="btn danger" type="button" onClick={() => deleteResource(item.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredResources.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="resource-empty">暂无匹配资源</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingResource && (
        <ResourceCategoryModal
          resource={editingResource}
          categories={categories}
          onClose={() => setEditingResource(null)}
          onSave={(nextCategories) => updateResourceCategories(editingResource.id, nextCategories)}
        />
      )}

      {previewResource && (
        <div className="modal-overlay" onClick={() => setPreviewResource(null)}>
          <div className="modal-card resource-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>资源预览</h3>
              <button className="modal-close" type="button" onClick={() => setPreviewResource(null)}>x</button>
            </div>
            <div className="resource-preview-body">
              <div className={`resource-preview-frame ${previewResource.type}`}>
                {previewResource.type === 'video' ? '视频预览' : '图文预览'}
              </div>
              <div className="resource-preview-meta">
                <strong>{previewResource.fileName}</strong>
                <span>{TYPE_LABEL[previewResource.type]} / {previewResource.size}</span>
                <span>{previewResource.uploadedAt} 上传</span>
                <div className="resource-tags">
                  {previewResource.categories.map((category) => <span key={category} className="resource-tag">{category}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {categoryModalOpen && (
        <div className="modal-overlay" onClick={() => setCategoryModalOpen(false)}>
          <div className="modal-card category-manage-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>分类管理</h3>
              <button className="modal-close" type="button" onClick={() => setCategoryModalOpen(false)}>x</button>
            </div>
            <div className="category-manage-body">
              <div className="category-add-row">
                <input value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)} placeholder="新增资源分类" />
                <button className="btn primary" type="button" onClick={addCategory}>新增</button>
              </div>
              <div className="category-list">
                {categories.map((category) => (
                  <div key={category} className="category-list-item">
                    {editingCategory === category ? (
                      <input value={editingCategoryName} onChange={(event) => setEditingCategoryName(event.target.value)} />
                    ) : (
                      <span>{category}</span>
                    )}
                    <div className="action-btn-group">
                      {editingCategory === category ? (
                        <>
                          <button className="btn primary" type="button" onClick={() => saveCategoryRename(category)}>保存</button>
                          <button className="btn ghost" type="button" onClick={() => setEditingCategory(null)}>取消</button>
                        </>
                      ) : (
                        <>
                          <button className="btn ghost" type="button" onClick={() => { setEditingCategory(category); setEditingCategoryName(category); }}>编辑</button>
                          <button className="btn danger" type="button" onClick={() => deleteCategory(category)}>删除</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ResourceCategoryModalProps {
  resource: LibraryResource;
  categories: string[];
  onClose: () => void;
  onSave: (categories: string[]) => void;
}

function ResourceCategoryModal({ resource, categories, onClose, onSave }: ResourceCategoryModalProps) {
  const [selected, setSelected] = useState(resource.categories);

  function toggle(category: string) {
    setSelected((current) => (
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    ));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card resource-edit-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>编辑分类标签</h3>
          <button className="modal-close" type="button" onClick={onClose}>x</button>
        </div>
        <div className="resource-edit-body">
          <p className="muted">{resource.fileName}</p>
          <div className="resource-category-options">
            {categories.map((category) => (
              <label key={category} className="resource-category-option">
                <input
                  type="checkbox"
                  checked={selected.includes(category)}
                  onChange={() => toggle(category)}
                />
                {category}
              </label>
            ))}
          </div>
          <div className="form-actions resource-modal-actions">
            <button className="btn primary" type="button" onClick={() => onSave(selected)}>保存</button>
            <button className="btn ghost" type="button" onClick={onClose}>取消</button>
          </div>
        </div>
      </div>
    </div>
  );
}
