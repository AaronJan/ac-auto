export interface Node {
  /**
   * 子节点指针
   */
  next: Record<string, Node>;
  /**
   * 当前节点的字符，null表示根节点
   */
  val: null | string;
  /**
   * 跳跃指针，也称失败指针
   */
  back: null | Node;
  /**
   * 父节点指针
   */
  parent: null | Node;
  /**
   * 是否形成了一个完整的词汇，中间节点也可能为true
   */
  accept: boolean;
}

export interface CachedNode extends Node {
  /**
   * 完整词汇
   */
  word: string;
}
