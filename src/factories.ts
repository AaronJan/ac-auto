import { buildTree } from './node';
import { Automaton } from './automaton';

export async function createAutomaton(words: string[]): Promise<Automaton> {
  const root = await buildTree(words);

  return new Automaton(root);
}
