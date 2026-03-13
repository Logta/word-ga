const SPEED_MIN = 100;
const SPEED_MAX = 1000;

interface ControlsProps {
  isRunning: boolean;
  solved: boolean;
  speed: number;
  onStart: () => void;
  onPause: () => void;
  onStepOnce: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export function Controls({
  isRunning,
  solved,
  speed,
  onStart,
  onPause,
  onStepOnce,
  onReset,
  onSpeedChange,
}: ControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 p-3 bg-gray-800 rounded-lg">
      {!isRunning ? (
        <button
          onClick={onStart}
          disabled={solved}
          className="px-5 py-2 bg-green-700 hover:bg-green-600 rounded font-bold
                     disabled:opacity-40 transition-colors min-w-[90px]"
        >
          ▶ 開始
        </button>
      ) : (
        <button
          onClick={onPause}
          className="px-5 py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-bold
                     transition-colors min-w-[90px]"
        >
          ⏸ 一時停止
        </button>
      )}
      <button
        onClick={onStepOnce}
        disabled={isRunning || solved}
        className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded disabled:opacity-40 transition-colors"
      >
        ⏭ 次の世代
      </button>
      <button
        onClick={onReset}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
      >
        ↺ リセット
      </button>
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">遅い</span>
        <input
          type="range"
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={50}
          // スライダー右端 = 速い（delay小）になるよう反転
          value={SPEED_MIN + SPEED_MAX - speed}
          onChange={(e) => onSpeedChange(SPEED_MIN + SPEED_MAX - Number(e.target.value))}
          className="w-32 accent-cyan-400"
        />
        <span className="text-gray-500 text-xs">速い</span>
        <span className="text-cyan-300 text-xs w-20 text-right">{speed}ms/世代</span>
      </div>
    </div>
  );
}
