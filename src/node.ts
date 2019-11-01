import { Node } from './types';
import { sleepImmediate } from './helpers';

export function makeRootNode(): Node {
  return {
    next: {},
    val: null,
    back: null,
    parent: null,
    accept: false,
  };
}

/**
 * 词组去重并排序
 */
export function deduplicate(words: string[]): string[] {
  const filtered = words.map(word => word.trim()).filter(word => word.length > 0);
  const unique = new Set(filtered);

  return [...unique];
}

export function addWord(root: Node, word: string): void {
  let current: Node = root;
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const next = current.next[char];
    if (next === undefined) {
      current.next[char] = {
        next: {},
        val: char,
        accept: false,
        back: root,
        parent: current,
      };
    }
    current = current.next[char];
  }

  // 最后一个是完整词
  current.accept = true;
}

export async function fallbackAll(root: Node, options: { batchSize: number }): Promise<void> {
  const { batchSize } = options;

  let operationCount = 0;
  let curExpands: Node[] = Object.values(root.next);
  while (curExpands.length > 0) {
    const nextExpands = [];
    for (let i = 0; i < curExpands.length; i++) {
      operationCount++;

      const node = curExpands[i];
      for (const c in node.next) {
        nextExpands.push(node.next[c]);
      }

      const parent = node.parent as Node;
      let back = parent.back;
      while (back !== null) {
        // 匹配父节点的跳跃节点的子节点
        // TODO
        const child = back.next[node.val as string];
        if (child !== undefined) {
          node.back = child;
          break;
        }
        back = back.back;
      }

      if (operationCount % batchSize === 0) {
        await sleepImmediate();
      }
    }

    curExpands = nextExpands;
  }
}

export function fallback(root: Node, word: string) {
  let current = root.next[word[0]];
  for (let i = 1; i < word.length; i++) {
    const char = word[i];
    // TODO
    const parent = current.parent as any;
    let back: Node | null = parent.back;
    while (back !== null) {
      // 匹配父节点的跳跃节点的子节点
      // TODO
      const child: Node | undefined = back.next[current.val as any];
      if (child !== undefined) {
        current.back = child;
        break;
      }
      back = back.back;
    }
    current = current.next[char];
  }
}

/**
 * 从匹配到词中选取每个位置上匹配字最多的那个词
 */
export function selectLongest(matches: Array<[number, string]>): Array<[number, string]> {
  const longest = matches.reduce<Record<number, string>>((longest, [position, word]) => {
    if (Object.prototype.hasOwnProperty.call(longest, position) === false || word.length > longest[position].length) {
      return {
        ...longest,
        [position]: word,
      };
    }

    return longest;
  }, {});

  const offsets = Object.keys(longest)
    .map(key => parseInt(key))
    .sort((a, b) => a - b);

  return offsets.map(function(off) {
    return [off, longest[off]];
  });
}

// 从子节点往上直到根结点，收集单词
export function collect(node: Node): string {
  const chars: string[] = [];
  while (node.val !== null) {
    chars.unshift(node.val);
    node = node.parent as Node;
  }

  return chars.join('');
}

export interface BuildTreeOptions {
  batchSize?: number;
}

/**
 * TODO: 缩短 build time（特别是 suffix link）
 */
export async function buildTree(words: string[], options: BuildTreeOptions = {}): Promise<Node> {
  const { batchSize = 100 } = options;

  // 词汇去重
  const sortedWords = deduplicate(words).sort();
  const root: Node = makeRootNode();
  // make trie tree
  let wordCount = 0;
  for (const word of sortedWords) {
    addWord(root, word);
    wordCount++;

    if (wordCount % batchSize === 0) {
      await sleepImmediate();
    }
  }
  // fix backtrace pointer
  fallbackAll(root, { batchSize });

  return root;
}
