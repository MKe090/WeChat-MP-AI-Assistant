/**
 * chrome.storage 封装：统一管理本地存储和会话存储
 */
export class StorageManager {
  /**
   * 从 chrome.storage.local 获取值
   */
  async get<T>(key: string): Promise<T | undefined> {
    const result = await chrome.storage.local.get(key);
    return result[key] as T | undefined;
  }

  /**
   * 向 chrome.storage.local 写入值
   */
  async set(key: string, value: any): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  /**
   * 从 chrome.storage.session 获取值
   */
  async getSession<T>(key: string): Promise<T | undefined> {
    const result = await chrome.storage.session.get(key);
    return result[key] as T | undefined;
  }

  /**
   * 向 chrome.storage.session 写入值
   */
  async setSession(key: string, value: any): Promise<void> {
    await chrome.storage.session.set({ [key]: value });
  }

  /**
   * 从 chrome.storage.local 删除值
   */
  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }

  /**
   * 从 chrome.storage.session 删除值
   */
  async removeSession(key: string): Promise<void> {
    await chrome.storage.session.remove(key);
  }

  /**
   * 清空 chrome.storage.local
   */
  async clear(): Promise<void> {
    await chrome.storage.local.clear();
  }

  /**
   * 批量获取值
   */
  async getMultiple(keys: string[]): Promise<Record<string, any>> {
    const result = await chrome.storage.local.get(keys);
    return result;
  }
}
