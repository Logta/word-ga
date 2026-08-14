export type Individual = string;

export type SelectionMethod = "elite" | "roulette";

export interface HistoryEntry {
  generation: number;
  best: number;
  avg: number;
  diversity: number;
}

export interface SimState {
  target: string;
  population: Individual[];
  /** population と並行な適応度配列。各世代で一度だけ計算され表示側はこれを参照する (ADR-021) */
  fits: number[];
  generation: number;
  history: HistoryEntry[];
  isRunning: boolean;
  speed: number;
  solved: boolean;
  selectionMethod: SelectionMethod;
}
