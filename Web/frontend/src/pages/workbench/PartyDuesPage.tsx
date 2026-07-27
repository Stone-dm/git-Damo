import { useCallback, useEffect, useMemo, useState } from 'react';
import { listBranches } from '../../api/branches';
import { ApiError } from '../../api/client';
import {
  batchPayPartyDuesRecords,
  batchRemindPartyDuesRecords,
  createPartyDuesStandard,
  generatePartyDuesRecords,
  getPartyDuesStats,
  importPartyDuesStandards,
  listPartyDuesRecords,
  listPartyDuesStandards,
  payPartyDuesRecord,
  remindPartyDuesRecord,
} from '../../api/party-dues';
import type {
  BranchView,
  PartyDuesMemberType,
  PartyDuesRecordStatus,
  PartyDuesRecordView,
  PartyDuesStandardStatus,
  PartyDuesStandardView,
  PartyDuesStatsView,
  UserView,
} from '../../api/types';
import { listUsers } from '../../api/users';
import { useAuth } from '../../auth/AuthContext';

type TabKey = 'records' | 'standards';

const MEMBER_TYPE_LABEL: Record<PartyDuesMemberType, string> = {
  EMPLOYED: '在职党员',
  RETIRED: '离退休党员',
  STUDENT: '学生党员',
  HARDSHIP: '困难党员',
};

const STANDARD_STATUS_LABEL: Record<PartyDuesStandardStatus, string> = {
  ACTIVE: '有效',
  WAIVED: '免缴',
};

const RECORD_STATUS_LABEL: Record<PartyDuesRecordStatus, string> = {
  PAID: '已缴',
  UNPAID: '未缴',
  WAIVED: '免缴',
};

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function money(value: number | null | undefined): string {
  return `¥${Number(value ?? 0).toFixed(2)}`;
}

function statusClass(status: PartyDuesRecordStatus | PartyDuesStandardStatus): string {
  if (status === 'PAID' || status === 'ACTIVE') return 'badge status-open';
  if (status === 'UNPAID') return 'badge status-failed';
  return 'badge status-pending';
}

export function PartyDuesPage() {
  const { user } = useAuth();
  const isSecretary = user?.role === 'SECRETARY';

  const [tab, setTab] = useState<TabKey>('records');
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [branchId, setBranchId] = useState<string>(isSecretary && user?.branchId ? String(user.branchId) : '');
  const [recordStatus, setRecordStatus] = useState<string>('');

  const [records, setRecords] = useState<PartyDuesRecordView[]>([]);
  const [standards, setStandards] = useState<PartyDuesStandardView[]>([]);
  const [stats, setStats] = useState<PartyDuesStatsView | null>(null);
  const [branches, setBranches] = useState<BranchView[]>([]);
  const [members, setMembers] = useState<UserView[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);

  const [formUserId, setFormUserId] = useState('');
  const [formMemberType, setFormMemberType] = useState<PartyDuesMemberType>('EMPLOYED');
  const [formIncome, setFormIncome] = useState('');
  const [formEffectiveDate, setFormEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState<PartyDuesStandardStatus>('ACTIVE');
  const [formNotes, setFormNotes] = useState('');

  const selectedBranchId = branchId ? Number(branchId) : undefined;

  const loadMeta = useCallback(async () => {
    const [branchData, userData] = await Promise.all([listBranches(), listUsers()]);
    setBranches(branchData);
    setMembers(userData.filter((u) => u.role === 'MEMBER'));
  }, []);

  const loadRecords = useCallback(async () => {
    const data = await listPartyDuesRecords({
      branchId: selectedBranchId,
      yearMonth,
      status: recordStatus ? (recordStatus as PartyDuesRecordStatus) : undefined,
    });
    setRecords(data);
    setStats(await getPartyDuesStats(yearMonth));
    setSelectedRecordIds([]);
  }, [selectedBranchId, yearMonth, recordStatus]);

  const loadStandards = useCallback(async () => {
    setStandards(await listPartyDuesStandards({ branchId: selectedBranchId }));
  }, [selectedBranchId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadMeta();
      await Promise.all([loadRecords(), loadStandards()]);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [loadMeta, loadRecords, loadStandards]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const branchOptions = useMemo(() => {
    if (!isSecretary) return branches;
    return branches.filter((b) => b.id === user?.branchId);
  }, [branches, isSecretary, user?.branchId]);

  const standardPreview = useMemo(() => {
    const income = Number(formIncome || 0);
    if (formStatus === 'WAIVED' || formMemberType === 'HARDSHIP') return { rate: 0, amount: 0 };
    if (formMemberType === 'STUDENT') return { rate: 0, amount: 0.2 };
    if (formMemberType === 'RETIRED') {
      const rate = income < 5000 ? 0.005 : 0.01;
      return { rate, amount: income * rate };
    }
    const rate = income < 3000 ? 0.005 : income <= 5000 ? 0.01 : income <= 10000 ? 0.015 : 0.02;
    return { rate, amount: income * rate };
  }, [formIncome, formMemberType, formStatus]);

  async function handleGenerate() {
    setActionLoading(true);
    setError(null);
    try {
      await generatePartyDuesRecords(yearMonth);
      await loadRecords();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePay(record: PartyDuesRecordView) {
    const input = window.prompt('请输入实缴金额', String(record.dueAmount));
    if (!input) return;
    setActionLoading(true);
    setError(null);
    try {
      await payPartyDuesRecord(record.id, { paidAmount: Number(input) });
      await loadRecords();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBatchPay() {
    if (selectedRecordIds.length === 0) return;
    const input = window.prompt('请输入本次批量标记的实缴金额', '0');
    if (!input) return;
    setActionLoading(true);
    setError(null);
    try {
      await batchPayPartyDuesRecords({ recordIds: selectedRecordIds, paidAmount: Number(input) });
      await loadRecords();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemind(id: number) {
    setActionLoading(true);
    setError(null);
    try {
      await remindPartyDuesRecord(id);
      await loadRecords();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBatchRemind() {
    if (selectedRecordIds.length === 0) return;
    setActionLoading(true);
    setError(null);
    try {
      await batchRemindPartyDuesRecords({ recordIds: selectedRecordIds });
      await loadRecords();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateStandard() {
    if (!formUserId || !formIncome) {
      setError('请选择党员并填写月收入基数');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const member = members.find((m) => m.id === Number(formUserId));
      await createPartyDuesStandard({
        userId: Number(formUserId),
        branchId: member?.branchId ?? selectedBranchId,
        memberType: formMemberType,
        monthlyIncome: Number(formIncome),
        effectiveDate: formEffectiveDate,
        status: formStatus,
        notes: formNotes.trim() || undefined,
      });
      setFormUserId('');
      setFormIncome('');
      setFormNotes('');
      await loadStandards();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    setActionLoading(true);
    setError(null);
    try {
      const result = await importPartyDuesStandards(file);
      if (result.errors.length > 0) {
        setError(`导入 ${result.importedCount} 条，存在 ${result.errors.length} 条错误：${result.errors[0]}`);
      }
      await loadStandards();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setActionLoading(false);
    }
  }

  function toggleSelected(id: number, checked: boolean) {
    setSelectedRecordIds((ids) => checked ? [...ids, id] : ids.filter((item) => item !== id));
  }

  return (
    <div className="page">
      <h2>党费收缴</h2>
      <p className="muted">党群工作 · 党费标准维护、月度账单生成、缴费登记和催缴统计</p>

      {error && <div className="form-error">{error}</div>}

      <div className="panel meta">
        <div>
          <span className="label">应缴总额</span>
          <strong>{money(stats?.totalDueAmount)}</strong>
        </div>
        <div>
          <span className="label">已缴总额</span>
          <strong>{money(stats?.totalPaidAmount)}</strong>
        </div>
        <div>
          <span className="label">缴纳率</span>
          <strong>{(((stats?.paymentRate ?? 0) as number) * 100).toFixed(1)}%</strong>
        </div>
        <div>
          <span className="label">未缴人数</span>
          <strong>{stats?.unpaidCount ?? 0}</strong>
        </div>
      </div>

      <div className="panel">
        <div className="form-inline">
          <label>
            月份
            <input value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} placeholder="2026-07" />
          </label>
          <label>
            支部
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={isSecretary}>
              <option value="">全部支部</option>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </label>
          <label>
            记录状态
            <select value={recordStatus} onChange={(e) => setRecordStatus(e.target.value)}>
              <option value="">全部状态</option>
              <option value="UNPAID">未缴</option>
              <option value="PAID">已缴</option>
              <option value="WAIVED">免缴</option>
            </select>
          </label>
          <button className="btn ghost" type="button" onClick={loadAll} disabled={loading}>查询</button>
          <button className="btn primary" type="button" onClick={handleGenerate} disabled={actionLoading}>生成当月账单</button>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn${tab === 'records' ? ' active' : ''}`} onClick={() => setTab('records')}>缴费记录</button>
        <button className={`tab-btn${tab === 'standards' ? ' active' : ''}`} onClick={() => setTab('standards')}>缴费标准</button>
      </div>

      {tab === 'records' ? (
        <div className="panel">
          <div className="form-inline" style={{ marginBottom: 12 }}>
            <button className="btn ghost" type="button" onClick={handleBatchPay} disabled={actionLoading || selectedRecordIds.length === 0}>
              批量标记已缴
            </button>
            <button className="btn ghost" type="button" onClick={handleBatchRemind} disabled={actionLoading || selectedRecordIds.length === 0}>
              批量催缴
            </button>
            <span className="muted">已选择 {selectedRecordIds.length} 条</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>党员</th>
                  <th>支部</th>
                  <th>月份</th>
                  <th>应缴</th>
                  <th>实缴</th>
                  <th>状态</th>
                  <th>缴费时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRecordIds.includes(record.id)}
                        onChange={(e) => toggleSelected(record.id, e.target.checked)}
                        disabled={record.status !== 'UNPAID'}
                      />
                    </td>
                    <td>{record.userName}</td>
                    <td>{record.branchName}</td>
                    <td>{record.yearMonth}</td>
                    <td>{money(record.dueAmount)}</td>
                    <td>{money(record.paidAmount)}</td>
                    <td><span className={statusClass(record.status)}>{RECORD_STATUS_LABEL[record.status]}</span></td>
                    <td>{record.paidAt ? record.paidAt.replace('T', ' ').slice(0, 16) : '-'}</td>
                    <td>
                      {record.status === 'UNPAID' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn ghost" type="button" onClick={() => handlePay(record)} disabled={actionLoading}>标记已缴</button>
                          <button className="btn ghost" type="button" onClick={() => handleRemind(record.id)} disabled={actionLoading}>催缴</button>
                        </div>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && records.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)' }}>暂无缴费记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="panel">
          <h3>新增缴费标准</h3>
          <div className="form-grid">
            <label>
              党员
              <select value={formUserId} onChange={(e) => setFormUserId(e.target.value)}>
                <option value="">请选择党员</option>
                {members
                  .filter((m) => !selectedBranchId || m.branchId === selectedBranchId)
                  .map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
              </select>
            </label>
            <label>
              党员类型
              <select value={formMemberType} onChange={(e) => setFormMemberType(e.target.value as PartyDuesMemberType)}>
                {Object.entries(MEMBER_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              月收入基数
              <input type="number" value={formIncome} onChange={(e) => setFormIncome(e.target.value)} placeholder="例如 5600" />
            </label>
            <label>
              生效日期
              <input type="date" value={formEffectiveDate} onChange={(e) => setFormEffectiveDate(e.target.value)} />
            </label>
            <label>
              状态
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as PartyDuesStandardStatus)}>
                <option value="ACTIVE">有效</option>
                <option value="WAIVED">免缴</option>
              </select>
            </label>
            <label>
              备注
              <input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="可选" />
            </label>
            <div>
              <span className="muted">预计比例 {(standardPreview.rate * 100).toFixed(2)}%，月应缴 {money(standardPreview.amount)}</span>
            </div>
            <div className="form-actions">
              <button className="btn primary" type="button" onClick={handleCreateStandard} disabled={actionLoading}>保存标准</button>
            </div>
          </div>

          <div className="form-inline" style={{ marginTop: 16 }}>
            <label>
              Excel 批量导入
              <input type="file" accept=".xlsx" onChange={(e) => handleImport(e.target.files?.[0])} />
            </label>
          </div>

          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>党员</th>
                  <th>支部</th>
                  <th>类型</th>
                  <th>收入基数</th>
                  <th>比例</th>
                  <th>月应缴</th>
                  <th>生效日期</th>
                  <th>状态</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {standards.map((standard) => (
                  <tr key={standard.id}>
                    <td>{standard.userName}</td>
                    <td>{standard.branchName}</td>
                    <td>{MEMBER_TYPE_LABEL[standard.memberType]}</td>
                    <td>{money(standard.monthlyIncome)}</td>
                    <td>{(standard.rate * 100).toFixed(2)}%</td>
                    <td>{money(standard.monthlyAmount)}</td>
                    <td>{standard.effectiveDate}</td>
                    <td><span className={statusClass(standard.status)}>{STANDARD_STATUS_LABEL[standard.status]}</span></td>
                    <td>{standard.notes ?? '-'}</td>
                  </tr>
                ))}
                {!loading && standards.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)' }}>暂无缴费标准</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
