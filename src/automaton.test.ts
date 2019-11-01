import * as fs from 'fs';
import * as path from 'path';
import { createAutomaton } from './factories';

function loadWords(): string[] {
  const content = fs.readFileSync(path.join(__dirname, '__tests__', 'words.test'));

  return content
    .toString()
    .split('\n')
    .filter(word => word.length > 0);
}

describe('测试单一词汇', () => {
  it('成功扫出来', async () => {
    const automaton = await createAutomaton(['江泽民']);
    const content = '我不是江泽民的儿子，我跟江泽民没有任何关系';

    expect(await automaton.search(content)).toEqual([[3, '江泽民'], [12, '江泽民']]);
    expect(await automaton.search(content, { quick: true })).toEqual([[3, '江泽民']]);
    expect(await automaton.search(content, { longest: true })).toEqual([[3, '江泽民'], [12, '江泽民']]);
  });

  it('扫不出来的', async () => {
    const automaton = await createAutomaton(['江泽民']);
    const content = '我不喜欢喝江小白，我喜欢喝鸡尾酒';

    expect(await automaton.search(content)).toHaveLength(0);
    expect(await automaton.search(content, { quick: true })).toHaveLength(0);
    expect(await automaton.search(content, { longest: true })).toHaveLength(0);
  });
});

describe('测试多个独立词汇', () => {
  it('成功扫出来', async () => {
    const automaton = await createAutomaton(['江泽民', '习近平', '胡锦涛']);
    const content = '我不是江泽民的儿子，也不是习近平的儿子，更不是胡锦涛的儿子';

    expect(await automaton.search(content)).toEqual([[3, '江泽民'], [13, '习近平'], [23, '胡锦涛']]);
    expect(await automaton.search(content, { quick: true })).toEqual([[3, '江泽民']]);
    expect(await automaton.search(content, { longest: true })).toEqual([[3, '江泽民'], [13, '习近平'], [23, '胡锦涛']]);
  });

  it('扫不出来的', async () => {
    const automaton = await createAutomaton(['江泽民', '习近平', '胡锦涛']);
    const content = '我不喜欢喝江小白，我喜欢喝鸡尾酒';

    expect(await automaton.search(content)).toHaveLength(0);
    expect(await automaton.search(content, { quick: true })).toHaveLength(0);
    expect(await automaton.search(content, { longest: true })).toHaveLength(0);
  });
});

describe('测试叠加词汇', () => {
  it('简单扫一下', async () => {
    const automaton = await createAutomaton(['近平', '习近平棒', '习近平好']);
    const content = '习近平拽';
    const offWords = await automaton.search(content);
    console.log(offWords);

    expect(offWords).toEqual([[1, '近平']]);
  });

  it('扫的狠一点', async () => {
    const automaton = await createAutomaton(['近平', '习近平', '习近平好']);
    const content = '我不说习近平好，也不是习近平坏';

    expect(await automaton.search(content)).toEqual([
      [3, '习近平'],
      [4, '近平'],
      [3, '习近平好'],
      [11, '习近平'],
      [12, '近平'],
    ]);
    expect(await automaton.search(content, { quick: true })).toEqual([[3, '习近平']]);
    expect(await automaton.search(content, { longest: true })).toEqual([
      [3, '习近平好'],
      [4, '近平'],
      [11, '习近平'],
      [12, '近平'],
    ]);
  });
});

describe('wikipedia demo', () => {
  it('一个都不能少', async () => {
    const automaton = await createAutomaton(['a', 'ab', 'bab', 'bc', 'bca', 'c', 'caa']);
    const offWords = await automaton.search('abccab');
    expect(offWords).toEqual([[0, 'a'], [0, 'ab'], [1, 'bc'], [2, 'c'], [3, 'c'], [4, 'a'], [4, 'ab']]);
  });
});

describe('动态增加词汇', () => {
  it('动态增加别出错', async () => {
    const automaton = await createAutomaton(['近平', '习近平', '习近平好']);

    automaton.add('江泽民');
    automaton.add('泽民');
    automaton.add('江泽民好');

    const node = await automaton.locate('江泽民好');
    expect(node.val).toBe('好');
    expect(node.parent.val).toBe('民');
    expect(node.parent.parent.val).toBe('泽');
    expect(node.parent.parent.parent.val).toBe('江');
    expect(node.parent.parent.back.val).toBe('泽');
    expect(node.parent.back.val).toBe('民');
  });
});

describe('排列组合词汇', () => {
  it('不许闹出死循环', async () => {
    const seed = 'abcdefg'.split('');

    function permutator(inputArr) {
      const results = [];

      function permute(arr: string[], memo = []) {
        let cur: string[];

        for (let i = 0; i < arr.length; i++) {
          cur = arr.splice(i, 1);
          if (arr.length === 0) {
            results.push(memo.concat(cur));
          }
          permute(arr.slice(), memo.concat(cur));
          arr.splice(i, 0, cur[0]);
        }

        return results;
      }

      return permute(inputArr);
    }

    let words = permutator(seed);
    for (let i = 0; i < words.length; i++) {
      words[i] = words[i].join('');
    }

    const automaton = await createAutomaton(words);
    for (let i = 0; i < words.length; i++) {
      await automaton.search(words[i]);
    }
  });
});

describe('猛量单词测试', () => {
  it('扫啊扫啊扫的痛啊', async () => {
    const words = loadWords();
    const automaton = await createAutomaton(words);
    const content = `
        1995年中共执政当局开始寻求强化法轮功的组织构架及与政府的关系。
        中国政府的国家体委、公共健康部和气功科研会，访问李洪志，要求联合成立法轮功协会，但李洪志表示拒绝。
        同年，气功科研会通过一项新规定，命令所有气功分会必须建立中国共产党党支部，但李洪志再次表示拒绝。
        李洪志与中国气功科研会的关系在1996年持续恶化。
        1996 年3月，法轮功因拒不接受中国气功协会新负责人在“气功团体内部收取会员费创收”和“成立中国共产党党支部组织”的要求，
        主动申请退出中国气功协会和中国 气功科研会, 以独立非政府形式运作。
        自此，李洪志及其法轮功脱离了中国气功协会中的人脉和利益交换，同时失去了功派在中国政府体制系统的保护。
        法轮功申请退出中国气功协会，是与中国政府对气功的态度产生变化相对应的；
        当时随气功激进反对者在政府部门中的影响力增加，中国政府开始控制和影响各气功组织。
        90年代中期，中国政府主管的媒体开始发表文章批评气功。
        法轮功起初并没有受批评，但在1996年3月退出中国气功协会后，失去了政府体制的保护。
        `;
    console.log(await automaton.search(content));
    console.log(await automaton.search(content, { quick: true }));
    console.log(await automaton.search(content, { longest: true }));
  });
});

test('超大型词汇', async () => {
  const words = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 50000; i++) {
    const len = Math.floor(Math.random() * 20 + 20);
    const chars = [];
    for (let k = 0; k < len; k++) {
      chars.push(chars[Math.floor(Math.random() * chars.length)]);
    }
    words.push(chars.join(''));
  }

  const start = new Date().getTime();
  const automaton = await createAutomaton(words);
  const end = new Date().getTime();
  console.log('50000 words costs %dms', end - start);
});
