import { Node } from './types';
import { addWord, fallback, collect, selectLongest } from './node';

/**
 * 需求：
 * * 建树的过程需要拆分为小块，以免卡住当前线程
 * * 匹配过程如果有必要也拆分为小块
 *
 * Scanner 的方法：
 * *
 *
 * Tree 的方法：
 * *
 */

export interface SearchOptions {
  quick?: boolean;
  longest?: boolean;
}

export class Automaton {
  constructor(private root: Node) {
    //
  }

  async add(word: string): Promise<void> {
    word = word.trim();
    if (word.length === 0) {
      return;
    }
    addWord(this.root, word);
    fallback(this.root, word);
  }

  async locate(word: string): Promise<Node> {
    let current = this.root.next[word[0]];
    for (let i = 1; i < word.length; i++) {
      const char = word[i];
      current = current.next[char];
      if (current === null) {
        break;
      }
    }
    return current;
  }

  async searchAndCount(content: string, options: SearchOptions = {}): Promise<Record<string, number>> {
    const matches = await this.search(content, options);

    return matches.reduce<Record<string, number>>((count, [, word]) => {
      const current = Object.prototype.hasOwnProperty.call(count, word) ? count[word] : 0;
      return {
        ...count,
        [word]: current + 1,
      };
    }, {});
  }

  async search(content: string, options: SearchOptions = {}): Promise<Array<[number, string]>> {
    const matches: Array<[number, string]> = [];

    let current: Node = this.root;
    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      let next: Node | undefined = current.next[char];
      // 当前分支上找不到，跳到其它分支上找
      if (next === undefined) {
        let back: Node | null = current.back;
        while (back !== null) {
          next = back.next[char];
          if (next) {
            break;
          }
          back = back.back;
        }
      }

      if (next !== undefined) {
        let back: Node = next;
        do {
          // 如果是匹配到的完整词
          if (back.accept === true) {
            // TODO: 可以优化性能
            const word = collect(back);
            matches.push([i - word.length + 1, word]);
            // 快速模式只选第一个词
            if (options.quick === true) {
              return matches;
            }
          }

          // 此时必然有 back 节点
          back = back.back as Node;
        } while (back !== this.root);

        current = next;
        continue;
      }

      // 回到 root
      current = this.root;
    }

    // 同一个位置选最长的
    if (options.longest) {
      return selectLongest(matches);
    }
    return matches;
  }
}
