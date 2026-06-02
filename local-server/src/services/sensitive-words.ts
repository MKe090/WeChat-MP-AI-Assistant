import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../config.js';

/**
 * 敏感词检测服务
 */
export class SensitiveWordsService {
  private builtInWords: string[] = [];
  private customWords: string[] = [];

  /**
   * 加载内置敏感词库
   */
  loadBuiltIn(): void {
    try {
      const content = readFileSync(
        join(process.cwd(), 'data/sensitive-words.txt'),
        'utf-8'
      );
      this.builtInWords = content
        .split('\n')
        .map((w) => w.trim())
        .filter((w) => w && !w.startsWith('#'));
      logger.info(
        `Loaded ${this.builtInWords.length} built-in sensitive words`
      );
    } catch {
      logger.warn(
        'Built-in sensitive words file not found, using defaults'
      );
      this.builtInWords = [
        '国家领导人',
        '颠覆',
        '分裂',
        '最高级',
        '国家级',
        '世界级',
        '最佳',
        '最好',
        '第一',
        '唯一',
        '首个',
        '首选',
        '绝对',
        '顶级',
        '极品',
        '万能',
        '特效',
        '包治',
        '根治',
        '秘方',
      ];
    }
  }

  /**
   * 添加自定义敏感词
   */
  addCustomWords(words: string[]): void {
    this.customWords.push(...words);
  }

  /**
   * 扫描文本中的敏感词
   */
  scan(
    text: string
  ): { text: string; type: string; position: number; reason: string }[] {
    const allWords = [...this.builtInWords, ...this.customWords];
    const results: { text: string; type: string; position: number; reason: string }[] = [];

    for (const word of allWords) {
      let pos = text.indexOf(word);
      while (pos !== -1) {
        results.push({
          text: word,
          type: 'sensitive',
          position: pos,
          reason: `包含敏感词：${word}`,
        });
        pos = text.indexOf(word, pos + 1);
      }
    }

    return results;
  }

  /**
   * 获取敏感词总数
   */
  getWordCount(): number {
    return this.builtInWords.length + this.customWords.length;
  }
}
