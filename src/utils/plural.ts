// Keep count labels grammatical in one place. Callers pass the singular noun.
export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
