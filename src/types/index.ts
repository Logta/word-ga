export type Individual = string;

export type SelectionMethod = "elite" | "roulette" | "rank";

export type HistoryEntry = { generation: number; best: number; avg: number; diversity: number };

export type SimState = {
  target: string;
  population: Individual[];
  generation: number;
  history: HistoryEntry[];
  isRunning: boolean;
  speed: number;
  solved: boolean;
  selectionMethod: SelectionMethod;
};
