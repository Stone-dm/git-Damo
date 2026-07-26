import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { recommend } from '@/src/api/agent';
import { ApiError } from '@/src/api/client';
import { listKnowledge, uploadKnowledge } from '@/src/api/knowledge';
import { listLearning } from '@/src/api/learning';
import type {
  KbDocumentView,
  KbType,
  LearningView,
  RecommendItem,
} from '@/src/api/types';
import { colors } from '@/src/theme';

type Segment = 'content' | 'recommend' | 'knowledge';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

const SYNC_LABEL: Record<string, string> = {
  PENDING: '同步中',
  SYNCED: '已同步',
  FAILED: '同步失败',
};

export default function LearningHubScreen() {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('content');

  const [items, setItems] = useState<LearningView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [recItems, setRecItems] = useState<RecommendItem[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recFetched, setRecFetched] = useState(false);

  const [docs, setDocs] = useState<KbDocumentView[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbError, setKbError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [kbType, setKbType] = useState<KbType>('PERSONAL');
  const [uploading, setUploading] = useState(false);

  const loadContent = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setItems(await listLearning());
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadKnowledge = useCallback(async () => {
    setKbLoading(true);
    setKbError(null);
    try {
      setDocs(await listKnowledge());
    } catch (err) {
      setKbError(errMsg(err));
    } finally {
      setKbLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (segment === 'knowledge') {
      void loadKnowledge();
    }
  }, [segment, loadKnowledge]);

  async function onRecommend() {
    setRecLoading(true);
    setRecError(null);
    try {
      const res = await recommend({
        query: query.trim() || undefined,
      });
      setRecItems(res.items ?? []);
      setRecFetched(true);
    } catch (err) {
      setRecError(errMsg(err));
    } finally {
      setRecLoading(false);
    }
  }

  async function onUpload() {
    const t = title.trim();
    const c = content.trim();
    if (!t || !c || uploading) return;
    setUploading(true);
    setKbError(null);
    try {
      await uploadKnowledge({
        title: t,
        kbType,
        content: c,
        sourceName: 'mobile',
      });
      setTitle('');
      setContent('');
      await loadKnowledge();
    } catch (err) {
      setKbError(errMsg(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.segments}>
        {(
          [
            ['content', '内容'],
            ['recommend', '推荐'],
            ['knowledge', '知识'],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.segBtn, segment === key && styles.segBtnActive]}
            onPress={() => setSegment(key)}
          >
            <Text
              style={[
                styles.segText,
                segment === key && styles.segTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {segment === 'content' ? (
        <>
          <Text style={styles.desc}>按支部可见范围展示学习内容。</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading && !refreshing ? (
            <ActivityIndicator
              style={{ marginTop: 24 }}
              color={colors.primary}
              size="large"
            />
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.id)}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => void loadContent(true)}
                  tintColor={colors.primary}
                />
              }
              ListEmptyComponent={
                <Text style={styles.muted}>暂无学习资料</Text>
              }
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.card}
                  onPress={() =>
                    router.push(`/(member)/learning/${item.id}`)
                  }
                >
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.muted} numberOfLines={2}>
                    {item.summary || '暂无摘要'}
                  </Text>
                  <Text style={styles.meta}>
                    支部：{item.branchId ?? '全局'} ·{' '}
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </>
      ) : null}

      {segment === 'recommend' ? (
        <View style={styles.flex}>
          <Text style={styles.desc}>
            基于个人与学习知识库，生成个性化推荐。
          </Text>
          {recError ? <Text style={styles.error}>{recError}</Text> : null}
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="可选：描述学习兴趣或主题"
            placeholderTextColor={colors.muted}
          />
          <Pressable
            style={[styles.button, recLoading && styles.buttonDisabled]}
            onPress={() => void onRecommend()}
            disabled={recLoading}
          >
            {recLoading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.buttonText}>获取推荐</Text>
            )}
          </Pressable>
          <FlatList
            style={{ marginTop: 12 }}
            data={recItems}
            keyExtractor={(item, i) => `${item.document_id}-${i}`}
            ListEmptyComponent={
              <Text style={styles.muted}>
                {recFetched ? '暂无推荐结果' : '点击上方按钮获取推荐'}
              </Text>
            }
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.muted}>{item.reason}</Text>
                <Text style={styles.meta}>文档：{item.document_id}</Text>
              </View>
            )}
          />
        </View>
      ) : null}

      {segment === 'knowledge' ? (
        <View style={styles.flex}>
          <Text style={styles.desc}>
            上传个人学习材料，完善个性化推荐与助手上下文。
          </Text>
          {kbError ? <Text style={styles.error}>{kbError}</Text> : null}

          <View style={styles.typeRow}>
            {(
              [
                ['PERSONAL', '个人库'],
                ['LEARNING', '学习库'],
              ] as const
            ).map(([key, label]) => (
              <Pressable
                key={key}
                style={[
                  styles.typeBtn,
                  kbType === key && styles.typeBtnActive,
                ]}
                onPress={() => setKbType(key)}
              >
                <Text
                  style={[
                    styles.typeText,
                    kbType === key && styles.typeTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="标题"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            value={content}
            onChangeText={setContent}
            placeholder="正文内容"
            placeholderTextColor={colors.muted}
            multiline
          />
          <Pressable
            style={[styles.button, uploading && styles.buttonDisabled]}
            onPress={() => void onUpload()}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.buttonText}>上传</Text>
            )}
          </Pressable>

          {kbLoading ? (
            <ActivityIndicator
              style={{ marginTop: 16 }}
              color={colors.primary}
            />
          ) : (
            <FlatList
              style={{ marginTop: 12 }}
              data={docs}
              keyExtractor={(item) => String(item.id)}
              ListEmptyComponent={
                <Text style={styles.muted}>暂无知识文档</Text>
              }
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.meta}>
                    {item.kbType === 'PERSONAL' ? '个人库' : '学习库'} ·{' '}
                    {SYNC_LABEL[item.syncStatus] ?? item.syncStatus} · ID{' '}
                    {item.id}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  flex: { flex: 1 },
  segments: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  segBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segText: { color: colors.muted, fontWeight: '600' },
  segTextActive: { color: colors.primaryText },
  desc: { color: colors.muted, marginBottom: 12 },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  muted: { color: colors.muted, lineHeight: 20 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 8 },
  error: {
    color: colors.error,
    backgroundColor: colors.errorBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    color: colors.text,
  },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.primaryText, fontWeight: '600', fontSize: 16 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  typeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#fef2f2',
  },
  typeText: { color: colors.muted, fontWeight: '500' },
  typeTextActive: { color: colors.primary },
});
