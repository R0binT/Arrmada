export type NameMatchScore = 0 | 1 | 2 | 3;

export const scoreNameMatch = (
  query: string,
  name: string,
): NameMatchScore => {
  const q = query.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  if (q.length === 0 || n.length === 0) return 0;
  if (n === q) return 3;
  if (n.startsWith(q)) return 2;
  if (n.includes(q)) return 1;
  return 0;
};
