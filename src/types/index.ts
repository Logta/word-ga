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
  generation: number;
  history: HistoryEntry[];
  isRunning: boolean;
  speed: number;
  solved: boolean;
  selectionMethod: SelectionMethod;
}
