/**
 * 按钮跳转页统一返回：有历史则返回上一页，否则回首页
 * Tab 栏切换的页面不使用此逻辑
 */
import { useRouter } from 'expo-router';

export function useSmartBack(fallback: string = '/(member)/home') {
  const router = useRouter();

  return () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as never);
    }
  };
}
