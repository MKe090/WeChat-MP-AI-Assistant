/**
 * 长连接管理器：与 Content Script 建立长连接用于 SSE 流式传输
 */
export class PortManager {
  private ports = new Map<string, chrome.runtime.Port>();

  /**
   * 注册新的长连接
   */
  register(port: chrome.runtime.Port): void {
    const tabId = port.sender?.tab?.id?.toString() || 'unknown';
    this.ports.set(tabId, port);

    port.onDisconnect.addListener(() => {
      this.ports.delete(tabId);
      console.info(`[WAA] Port disconnected for tab: ${tabId}`);
    });

    console.info(`[WAA] Port registered for tab: ${tabId}`);
  }

  /**
   * 通过长连接发送消息
   */
  send(tabId: string, message: any): void {
    const port = this.ports.get(tabId);
    if (port) {
      try {
        port.postMessage(message);
      } catch (error) {
        console.warn(
          `[WAA] Failed to send message to tab ${tabId}:`,
          error
        );
        this.ports.delete(tabId);
      }
    } else {
      console.warn(`[WAA] No port found for tab: ${tabId}`);
    }
  }

  /**
   * 获取指定 Tab 的长连接
   */
  getPort(tabId: string): chrome.runtime.Port | undefined {
    return this.ports.get(tabId);
  }

  /**
   * 断开指定 Tab 的长连接
   */
  disconnect(tabId: string): void {
    const port = this.ports.get(tabId);
    if (port) {
      port.disconnect();
      this.ports.delete(tabId);
    }
  }

  /**
   * 获取当前活跃连接数
   */
  getActiveCount(): number {
    return this.ports.size;
  }

  /**
   * 获取所有已连接的 Tab ID
   */
  getConnectedTabs(): string[] {
    return Array.from(this.ports.keys());
  }
}
