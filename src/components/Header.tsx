interface HeaderProps {
  targetInput: string;
  isRunning: boolean;
  onChange: (value: string) => void;
  onSet: () => void;
}

export function Header({ targetInput, isRunning, onChange, onSet }: HeaderProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <h1 className="text-2xl font-bold text-cyan-400 tracking-wide">
        遺伝的アルゴリズム シミュレーター
      </h1>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">ターゲット:</span>
        <input
          type="text"
          value={targetInput}
          onChange={(e) =>
            onChange(e.target.value.toUpperCase().replace(/[^A-Z ]/g, ""))
          }
          onKeyDown={(e) => e.key === "Enter" && !isRunning && onSet()}
          disabled={isRunning}
          maxLength={20}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-cyan-300 w-56 text-sm
                     tracking-widest disabled:opacity-50 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <button
          onClick={onSet}
          disabled={isRunning}
          className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-sm disabled:opacity-50 transition-colors"
        >
          セット
        </button>
      </div>
    </div>
  );
}
