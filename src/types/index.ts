export type Individual = string;

export interface HistoryEntry {
  generation: number;
  best: number;
  avg: number;
}

export interface SimState {
  target: string;
  population: Individual[];
  generation: number;
  history: HistoryEntry[];
  isRunning: boolean;
  speed: number;
  solved: boolean;
}
