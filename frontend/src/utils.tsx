export interface NotebookEntry {
  id: string;
  user_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export function editDistance(s: string, t: string) {
  const dp = Array.from({ length: s.length + 1 }, () =>
    Array(t.length + 1).fill(0),
  );
  for (let i = 1; i < s.length + 1; i++) {
    for (let j = 1; j < t.length + 1; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j],
        dp[i][j - 1],
        dp[i - 1][j - 1] + (s[i - 1] === t[j - 1] ? 1 : 0),
      );
    }
  }
  return dp[s.length][t.length];
}

export function findMatches(
  inputText: string,
  entries: NotebookEntry[],
  threshold: number,
) {
  return entries.filter(
    (e) => editDistance(inputText, e.title) <= e.title.length * (1 - threshold),
  );
}