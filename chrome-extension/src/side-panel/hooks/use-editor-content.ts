import { useCallback } from 'react';
import { useMessage } from './use-message';
import { MessageType } from '../../shared/types';

/**
 * 编辑器内容读写 Hook
 */
export function useEditorContent() {
  const { sendToBackground } = useMessage();

  /**
   * 获取编辑器 HTML 内容
   */
  const getContent = useCallback(async (): Promise<string> => {
    const result = await sendToBackground(MessageType.EDITOR_GET_CONTENT);
    return result?.data || '';
  }, [sendToBackground]);

  /**
   * 设置编辑器 HTML 内容
   */
  const setContent = useCallback(
    async (html: string): Promise<void> => {
      await sendToBackground(MessageType.EDITOR_SET_CONTENT, { html });
    },
    [sendToBackground]
  );

  /**
   * 获取文章标题
   */
  const getTitle = useCallback(async (): Promise<string> => {
    const result = await sendToBackground(MessageType.EDITOR_GET_TITLE);
    return result?.data || '';
  }, [sendToBackground]);

  /**
   * 设置文章标题
   */
  const setTitle = useCallback(
    async (title: string): Promise<void> => {
      await sendToBackground(MessageType.EDITOR_SET_TITLE, { title });
    },
    [sendToBackground]
  );

  /**
   * 在光标位置插入 HTML
   */
  const insertContent = useCallback(
    async (html: string): Promise<void> => {
      await sendToBackground(MessageType.EDITOR_INSERT, { html });
    },
    [sendToBackground]
  );

  return { getContent, setContent, getTitle, setTitle, insertContent };
}
