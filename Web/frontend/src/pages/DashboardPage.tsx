import { useState } from 'react';
import { ArchivePage } from './workbench/ArchivePage';
import { ArchiveMaterialPage } from './workbench/ArchiveMaterialPage';
import { FloatingMembersPage } from './workbench/FloatingMembersPage';
import { TrainingPage } from './workbench/TrainingPage';
import { WorkbenchTasksPage } from './workbench/TasksPage';
import { PlaceholderPage } from './workbench/PlaceholderPage';
import { VolunteerPage } from './workbench/VolunteerPage';

interface SubPage {
  id: string;
  label: string;
}

interface NavSection {
  id: string;
  label: string;
  icon: string;
  pages: SubPage[];
}

const WORKBENCH_NAV: NavSection[] = [
  {
    id: 'member',
    label: '党员管理',
    icon: '党',
    pages: [
      { id: 'archive', label: '档案管理' },
      { id: 'floating', label: '流动党员管理' },
      { id: 'training', label: '党员培养' },
    ],
  },
  {
    id: 'org-life',
    label: '组织生活',
    icon: '组',
    pages: [
      { id: 'tasks', label: '任务管理' },
      { id: 'materials', label: '材料归档' },
    ],
  },
  {
    id: 'party-work',
    label: '党群工作',
    icon: '群',
    pages: [
      { id: 'volunteer', label: '志愿服务管理' },
      { id: 'dues', label: '党费收缴' },
      { id: 'relations', label: '组织关系转接' },
      { id: 'review', label: '民主评议' },
      { id: 'assessment', label: '支部考核' },
    ],
  },
  {
    id: 'inspection',
    label: '督察督办',
    icon: '督',
    pages: [
      { id: 'org-todo', label: '组织代办' },
      { id: 'personal-todo', label: '个人代办' },
    ],
  },
  {
    id: 'statistics',
    label: '支部数据统计分析',
    icon: '数',
    pages: [], // 无子页面，直接展示数据大屏
  },
];

export function DashboardPage() {
  const [expanded, setExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('member');
  const [activePage, setActivePage] = useState('archive');

  function handleSectionClick(section: NavSection) {
    if (activeSection === section.id) {
      return; // already active
    }
    setActiveSection(section.id);
    if (section.pages.length > 0) {
      setActivePage(section.pages[0].id);
    }
  }

  function handlePageClick(sectionId: string, pageId: string) {
    setActiveSection(sectionId);
    setActivePage(pageId);
  }

  const activeSectionDef = WORKBENCH_NAV.find((s) => s.id === activeSection);
  const activePageDef = activeSectionDef?.pages.find((p) => p.id === activePage);

  return (
    <div className="workbench">
      {/* left sidebar */}
      <nav
        className={`wb-sidebar${expanded ? ' wb-sidebar-expanded' : ''}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="wb-sidebar-inner">
          {WORKBENCH_NAV.map((section) => {
            const isActive = activeSection === section.id;
            const hasSub = section.pages.length > 0;

            return (
              <div key={section.id} className="wb-section">
                <button
                  type="button"
                  className={`wb-section-btn${isActive ? ' active' : ''}`}
                  onClick={() => handleSectionClick(section)}
                  title={section.label}
                >
                  <span className="wb-section-icon">{section.icon}</span>
                  {expanded && (
                    <span className="wb-section-label">{section.label}</span>
                  )}
                </button>
                {expanded && hasSub && isActive && (
                  <div className="wb-sub-list">
                    {section.pages.map((page) => (
                      <button
                        key={page.id}
                        type="button"
                        className={`wb-sub-btn${activePage === page.id ? ' active' : ''}`}
                        onClick={() => handlePageClick(section.id, page.id)}
                      >
                        {page.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* right content */}
      <div className="wb-content">
        {activeSection === 'statistics' ? (
          <div className="page">
            <h2>支部数据统计分析</h2>
            <p className="muted">数据化大屏（占位）</p>
            <div
              className="panel"
              style={{
                minHeight: 480,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(160deg, #0f1923 0%, #1a2d3d 50%, #0d1b2a 100%)',
                borderRadius: 12,
                border: '1px solid #2a3f55',
              }}
            >
              <span style={{ color: '#4a90d9', fontSize: '1.2rem' }}>📊 数据可视化大屏区域</span>
            </div>
          </div>
        ) : activeSection === 'member' && activePage === 'archive' ? (
          <ArchivePage />
        ) : activeSection === 'member' && activePage === 'floating' ? (
          <FloatingMembersPage />
        ) : activeSection === 'member' && activePage === 'training' ? (
          <TrainingPage />
        ) : activeSection === 'org-life' && activePage === 'tasks' ? (
          <WorkbenchTasksPage />
        ) : activeSection === 'org-life' && activePage === 'materials' ? (
          <ArchiveMaterialPage />
        ) : activeSection === 'party-work' && activePage === 'volunteer' ? (
          <VolunteerPage />
        ) : activeSectionDef && activePageDef ? (
          <PlaceholderPage
            key={`${activeSection}/${activePage}`}
            section={activeSectionDef.label}
            title={activePageDef.label}
          />
        ) : null}
      </div>
    </div>
  );
}
