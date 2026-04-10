type Props = {
  projectedPoints?: number;
  totalPoints?: number;
  prediction1x2: string;
  predictionOU: string;
  predictionBTTS: string;
  points1x2: number;
  pointsOU: number;
  pointsBTTS: number;
  pointsCS: number;
  correct1x2?: boolean;
  correctOU?: boolean;
  correctBTTS?: boolean;
  correctScore?: boolean;
  settled?: boolean;
};

function pillClass(active?: boolean) {
  return active
    ? "relative overflow-hidden rounded-2xl border border-emerald-400/40 bg-emerald-500/15 shadow-[0_0_22px_rgba(16,185,129,0.28)]"
    : "rounded-2xl border border-white/8 bg-white/[0.04]";
}

export default function PredictionBreakdown({
  projectedPoints,
  totalPoints,
  prediction1x2,
  predictionOU,
  predictionBTTS,
  points1x2,
  pointsOU,
  pointsBTTS,
  pointsCS,
  correct1x2,
  correctOU,
  correctBTTS,
  correctScore,
  settled = false,
}: Props) {
  const topValue = settled ? totalPoints ?? 0 : projectedPoints ?? 0;

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-center">
        <span className="text-sm text-emerald-200/80">
          {settled ? "Points:" : "Projected:"}
        </span>{" "}
        <span className="text-2xl font-extrabold text-white">
          {Number(topValue).toFixed(2)}
        </span>
        <span className="ml-1 text-sm font-semibold text-emerald-300">pts</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className={`p-3 text-center ${pillClass(settled && correct1x2)}`}>
          <div className="text-[10px] tracking-[0.22em] text-white/45">1X2</div>
          <div className="mt-1 text-base font-bold text-white">{prediction1x2}</div>
          <div className="mt-1 text-sm font-semibold text-emerald-300">
            +{points1x2}
          </div>
        </div>

        <div className={`p-3 text-center ${pillClass(settled && correctOU)}`}>
          <div className="text-[10px] tracking-[0.22em] text-white/45">O/U 2.5</div>
          <div className="mt-1 text-base font-bold text-white">{predictionOU}</div>
          <div className="mt-1 text-sm font-semibold text-emerald-300">
            +{pointsOU}
          </div>
        </div>

        <div className={`p-3 text-center ${pillClass(settled && correctBTTS)}`}>
          <div className="text-[10px] tracking-[0.22em] text-white/45">BTTS</div>
          <div className="mt-1 text-base font-bold text-white">{predictionBTTS}</div>
          <div className="mt-1 text-sm font-semibold text-emerald-300">
            +{pointsBTTS}
          </div>
        </div>

        <div className={`p-3 text-center ${pillClass(settled && correctScore)}`}>
          <div className="text-[10px] tracking-[0.22em] text-white/45">CS</div>
          <div className="mt-1 text-base font-bold text-white">Exact</div>
          <div className="mt-1 text-sm font-semibold text-emerald-300">
            +{pointsCS}
          </div>
        </div>
      </div>
    </div>
  );
}