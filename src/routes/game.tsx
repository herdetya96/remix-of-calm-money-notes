import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Fuel, Heart, RotateCcw, Trophy } from "lucide-react";
import { Card } from "@/components/Card";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Pom Bensin · Ledger" },
      { name: "description", content: "Mini game mengisi bensin sesuai pesanan pelanggan." },
    ],
  }),
  component: GasStationGame,
});

const PRICE_PER_LITER = 16250; // Pertamax, Rp/liter
const MAX_LIVES = 3;
const HIGHSCORE_KEY = "spbu-highscore";

const MONEY_ORDERS = [10000, 15000, 20000, 25000, 30000, 35000, 40000, 50000];
const LITER_ORDERS = [1, 1.5, 2, 2.5, 3];
const CUSTOMERS = ["🧕", "👨", "👩", "🧑‍🦱", "👴", "👷", "🧑‍💼", "👮"];

type Order = {
  customer: string;
  text: string;
  targetMoney: number;
  targetLiters: number;
};

type Phase = "ready" | "filling" | "result" | "gameover";

type Verdict = {
  points: number;
  title: string;
  detail: string;
  emoji: string;
  loseLife: boolean;
};

function formatRupiah(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function randomOrder(): Order {
  const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  if (Math.random() < 0.5) {
    const money = MONEY_ORDERS[Math.floor(Math.random() * MONEY_ORDERS.length)];
    return {
      customer,
      text: `Pertamax ${formatRupiah(money)} ya, Kak!`,
      targetMoney: money,
      targetLiters: money / PRICE_PER_LITER,
    };
  }
  const liters = LITER_ORDERS[Math.floor(Math.random() * LITER_ORDERS.length)];
  return {
    customer,
    text: `Pertamax ${liters.toLocaleString("id-ID")} liter ya, Kak!`,
    targetMoney: liters * PRICE_PER_LITER,
    targetLiters: liters,
  };
}

function judge(money: number, target: number): Verdict {
  const diff = money - target;
  if (diff > 100) {
    return {
      points: 0,
      title: "Kelebihan!",
      detail: `Kamu nombok ${formatRupiah(diff)}. Pelanggan cuma bayar sesuai pesanan.`,
      emoji: "😱",
      loseLife: true,
    };
  }
  const short = Math.abs(diff);
  if (short <= 100)
    return {
      points: 100,
      title: "Pas banget!",
      detail: "Presisi level master SPBU.",
      emoji: "🤩",
      loseLife: false,
    };
  if (short <= 300)
    return {
      points: 70,
      title: "Mantap!",
      detail: `Cuma kurang ${formatRupiah(short)}.`,
      emoji: "😄",
      loseLife: false,
    };
  if (short <= 600)
    return {
      points: 40,
      title: "Lumayan",
      detail: `Kurang ${formatRupiah(short)} dari pesanan.`,
      emoji: "🙂",
      loseLife: false,
    };
  if (short <= 1500)
    return {
      points: 15,
      title: "Hampir...",
      detail: `Kurang ${formatRupiah(short)}. Pelanggan agak cemberut.`,
      emoji: "😕",
      loseLife: false,
    };
  return {
    points: 0,
    title: "Kurang banyak!",
    detail: `Kurang ${formatRupiah(short)}. Pelanggan komplain ke pusat.`,
    emoji: "😤",
    loseLife: true,
  };
}

function GasStationGame() {
  const [order, setOrder] = useState<Order>(() => randomOrder());
  const [phase, setPhase] = useState<Phase>("ready");
  const [liters, setLiters] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [round, setRound] = useState(1);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [highscore, setHighscore] = useState(0);

  const holdingRef = useRef(false);
  const litersRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const holdStartRef = useRef(0);
  const lastTickRef = useRef(0);

  useEffect(() => {
    setHighscore(Number(localStorage.getItem(HIGHSCORE_KEY) ?? 0));
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const money = Math.round(liters * PRICE_PER_LITER);
  // Tangki digambar dengan target di 75% supaya garis batas selalu terlihat
  const tankCapacity = order.targetLiters / 0.75;
  const fillFrac = Math.min(1, liters / tankCapacity);

  const tick = useCallback((now: number) => {
    const dt = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;
    if (holdingRef.current) {
      const heldFor = (now - holdStartRef.current) / 1000;
      // Mulai pelan lalu makin deras — tap singkat untuk isi sedikit-sedikit
      const rate = Math.min(0.6, 0.18 + heldFor * 0.55); // liter/detik
      litersRef.current += rate * dt;
      setLiters(litersRef.current);
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  }, []);

  const startFilling = useCallback(() => {
    if (holdingRef.current) return;
    holdingRef.current = true;
    setPhase("filling");
    holdStartRef.current = performance.now();
    lastTickRef.current = performance.now();
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopFilling = useCallback(() => {
    holdingRef.current = false;
  }, []);

  const handDelivery = () => {
    stopFilling();
    const v = judge(Math.round(litersRef.current * PRICE_PER_LITER), order.targetMoney);
    const newScore = score + v.points;
    const newLives = lives - (v.loseLife ? 1 : 0);
    setScore(newScore);
    setLives(newLives);
    setVerdict(v);
    if (newLives <= 0) {
      setPhase("gameover");
      if (newScore > highscore) {
        setHighscore(newScore);
        localStorage.setItem(HIGHSCORE_KEY, String(newScore));
      }
    } else {
      setPhase("result");
    }
  };

  const nextCustomer = () => {
    litersRef.current = 0;
    setLiters(0);
    setVerdict(null);
    setOrder(randomOrder());
    setRound((r) => r + 1);
    setPhase("ready");
  };

  const restart = () => {
    litersRef.current = 0;
    setLiters(0);
    setVerdict(null);
    setScore(0);
    setLives(MAX_LIVES);
    setRound(1);
    setOrder(randomOrder());
    setPhase("ready");
  };

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[16px] font-semibold text-ink-900 tracking-[-0.18px]">Pom Bensin</h1>
          <p className="text-[13px] text-ink-500 mt-0.5">
            Isi Pertamax sesuai pesanan pelanggan — {formatRupiah(PRICE_PER_LITER)}/liter
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-700">
            <Trophy className="h-4 w-4 text-accent" strokeWidth={1.5} />
            {highscore}
          </span>
          <span className="flex gap-0.5">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Heart
                key={i}
                className={"h-4 w-4 " + (i < lives ? "text-red fill-current" : "text-ink-150")}
                strokeWidth={1.5}
              />
            ))}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
        <Card className="p-5 flex flex-col items-center gap-4">
          {/* Pesanan pelanggan */}
          <div className="flex items-start gap-3 self-start">
            <div className="h-10 w-10 rounded-full bg-ink-40 flex items-center justify-center text-[22px]">
              {order.customer}
            </div>
            <div className="relative rounded-xl bg-accent-100 px-4 py-2.5 text-[14px] font-medium text-ink-900">
              {phase === "gameover" ? "Yah, shift kamu selesai..." : `"${order.text}"`}
              <span className="absolute -left-1.5 top-3.5 h-3 w-3 rotate-45 bg-accent-100" />
            </div>
          </div>

          <MotorbikeTank
            fillFrac={fillFrac}
            targetFrac={0.75}
            filling={holdingRef.current && phase === "filling"}
          />

          {/* Kontrol */}
          {phase === "gameover" ? (
            <div className="text-center space-y-3">
              <div className="text-[32px]">💔</div>
              <div className="text-[15px] font-semibold text-ink-900">Game Over</div>
              <div className="text-[13px] text-ink-500">
                Skor akhir: <span className="font-semibold text-ink-900">{score}</span>
                {score >= highscore && score > 0 && " — rekor baru! 🎉"}
              </div>
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-accent text-paper text-[14px] font-semibold hover:opacity-90 active:scale-95 transition"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={2} />
                Main lagi
              </button>
            </div>
          ) : phase === "result" && verdict ? (
            <div className="text-center space-y-3">
              <div className="text-[32px]">{verdict.emoji}</div>
              <div className="text-[15px] font-semibold text-ink-900">
                {verdict.title}{" "}
                {verdict.points > 0 && <span className="text-accent">+{verdict.points}</span>}
              </div>
              <div className="text-[13px] text-ink-500 max-w-[320px]">{verdict.detail}</div>
              <button
                type="button"
                onClick={nextCustomer}
                className="h-10 px-5 rounded-xl bg-accent text-paper text-[14px] font-semibold hover:opacity-90 active:scale-95 transition"
              >
                Pelanggan berikutnya →
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onPointerDown={startFilling}
                  onPointerUp={stopFilling}
                  onPointerLeave={stopFilling}
                  onPointerCancel={stopFilling}
                  onContextMenu={(e) => e.preventDefault()}
                  className="h-16 w-16 rounded-full bg-red text-paper flex items-center justify-center shadow-[var(--shadow-sr)] select-none touch-none active:scale-95 transition-transform"
                  aria-label="Tahan untuk mengisi bensin"
                >
                  <Fuel className="h-7 w-7" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={handDelivery}
                  disabled={liters === 0}
                  className="h-10 px-5 rounded-xl bg-ink-900 text-paper text-[14px] font-semibold disabled:opacity-30 hover:opacity-90 active:scale-95 transition"
                >
                  Serahkan
                </button>
              </div>
              <p className="text-[12px] text-ink-400">
                Tahan tombol merah untuk mengisi — tap singkat untuk menambah sedikit demi sedikit
              </p>
            </div>
          )}
        </Card>

        {/* Mesin pompa */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Dispenser · Pertamax</span>
            <span className="text-[11px] font-medium text-ink-400">Ronde {round}</span>
          </div>
          <div className="rounded-xl bg-ink-900 p-4 space-y-3">
            <PumpReadout
              label="Rupiah"
              value={money.toLocaleString("id-ID")}
              accentClass="text-[#5eead4]"
            />
            <PumpReadout
              label="Liter"
              value={liters.toFixed(3).replace(".", ",")}
              accentClass="text-[#fbbf24]"
            />
            <PumpReadout
              label="Harga/Liter"
              value={PRICE_PER_LITER.toLocaleString("id-ID")}
              accentClass="text-paper/70"
              small
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-ink-500">Pesanan</span>
              <span className="font-semibold text-ink-900">{formatRupiah(order.targetMoney)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-ink-500">Skor</span>
              <span className="font-semibold text-accent">{score}</span>
            </div>
          </div>
          <div className="rounded-xl bg-ink-40 p-3 text-[12px] leading-relaxed text-ink-500">
            <span className="font-semibold text-ink-700">Aturan:</span> berhenti sedekat mungkin
            dengan pesanan. Pas (±Rp 100) = 100 poin. Kelebihan Rp 100 atau kurang lebih dari Rp
            1.500 = kehilangan 1 nyawa.
          </div>
        </Card>
      </div>
    </div>
  );
}

function PumpReadout({
  label,
  value,
  accentClass,
  small = false,
}: {
  label: string;
  value: string;
  accentClass: string;
  small?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wider text-paper/50">{label}</span>
      <span
        className={
          "doc-num font-bold tabular-nums " +
          accentClass +
          (small ? " text-[14px]" : " text-[24px] leading-7")
        }
      >
        {value}
      </span>
    </div>
  );
}

function MotorbikeTank({
  fillFrac,
  targetFrac,
  filling,
}: {
  fillFrac: number;
  targetFrac: number;
  filling: boolean;
}) {
  // Tangki transparan: y dari 52 (penuh) sampai 122 (kosong)
  const tankTop = 52;
  const tankBottom = 122;
  const liquidY = tankBottom - (tankBottom - tankTop) * fillFrac;
  const targetY = tankBottom - (tankBottom - tankTop) * targetFrac;

  return (
    <svg
      viewBox="0 0 360 210"
      className="w-full max-w-[440px]"
      role="img"
      aria-label="Motor transparan dengan tangki bensin"
    >
      <defs>
        <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2e6de9" stopOpacity="0.95" />
        </linearGradient>
        <clipPath id="tankClip">
          <path d="M118 60 Q118 48 132 48 L188 48 Q202 48 202 60 L202 110 Q202 126 184 126 L136 126 Q118 126 118 110 Z" />
        </clipPath>
      </defs>

      {/* Tanah */}
      <line
        x1="14"
        y1="186"
        x2="346"
        y2="186"
        stroke="rgba(26,28,30,0.12)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Roda */}
      <g stroke="rgba(26,28,30,0.55)" fill="none">
        <circle cx="76" cy="156" r="30" strokeWidth="7" stroke="rgba(26,28,30,0.7)" />
        <circle cx="76" cy="156" r="12" strokeWidth="2.5" />
        <circle cx="284" cy="156" r="30" strokeWidth="7" stroke="rgba(26,28,30,0.7)" />
        <circle cx="284" cy="156" r="12" strokeWidth="2.5" />
      </g>

      {/* Bodi transparan */}
      <g
        stroke="rgba(46,109,233,0.55)"
        strokeWidth="2.5"
        fill="rgba(46,109,233,0.06)"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* rangka belakang + jok */}
        <path d="M284 156 L240 96 Q236 88 226 88 L210 88 L202 60" fill="none" />
        <path d="M196 86 Q230 78 252 84 Q262 87 258 96 L240 96 L210 88 Z" />
        {/* dek tengah & bodi depan */}
        <path
          d="M118 112 Q96 116 88 132 Q84 142 96 144 L150 148 Q170 150 184 140 L202 110"
          fill="none"
        />
        {/* garpu depan + setang */}
        <path d="M76 156 L100 92 L94 70" fill="none" />
        <path d="M82 64 Q94 58 106 66" fill="none" strokeWidth="4" />
        {/* lampu depan */}
        <circle
          cx="99"
          cy="86"
          r="7"
          fill="rgba(251,191,36,0.35)"
          stroke="rgba(26,28,30,0.4)"
          strokeWidth="2"
        />
      </g>

      {/* Bensin di dalam tangki */}
      <g clipPath="url(#tankClip)">
        <rect
          x="118"
          y={liquidY}
          width="84"
          height={tankBottom - liquidY + 6}
          fill="url(#fuelGrad)"
        />
        {/* permukaan bergelombang saat mengisi */}
        {filling && fillFrac > 0.02 && (
          <>
            <ellipse cx="146" cy={liquidY + 10} rx="4" ry="4" fill="rgba(255,255,255,0.5)">
              <animate
                attributeName="cy"
                values={`${liquidY + 26};${liquidY + 4}`}
                dur="0.7s"
                repeatCount="indefinite"
              />
            </ellipse>
            <ellipse cx="172" cy={liquidY + 16} rx="3" ry="3" fill="rgba(255,255,255,0.45)">
              <animate
                attributeName="cy"
                values={`${liquidY + 34};${liquidY + 6}`}
                dur="0.9s"
                repeatCount="indefinite"
              />
            </ellipse>
          </>
        )}
        <rect x="118" y={liquidY - 1.5} width="84" height="3" fill="rgba(255,255,255,0.55)" />
      </g>

      {/* Dinding tangki transparan */}
      <path
        d="M118 60 Q118 48 132 48 L188 48 Q202 48 202 60 L202 110 Q202 126 184 126 L136 126 Q118 126 118 110 Z"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(26,28,30,0.6)"
        strokeWidth="3"
      />
      {/* kilau kaca */}
      <path d="M127 58 Q127 53 133 53 L142 53 L128 96 Z" fill="rgba(255,255,255,0.35)" />
      {/* tutup tangki */}
      <rect x="150" y="40" width="20" height="10" rx="4" fill="rgba(26,28,30,0.6)" />

      {/* Garis target pesanan */}
      <line
        x1="110"
        y1={targetY}
        x2="210"
        y2={targetY}
        stroke="#e5484d"
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      <text x="214" y={targetY + 4} fontSize="11" fill="#e5484d" fontWeight="600">
        pesanan
      </text>

      {/* Selang & nozzle saat mengisi */}
      {filling && (
        <g>
          <path
            d="M160 16 Q160 30 160 38"
            stroke="rgba(26,28,30,0.5)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="153" y="8" width="14" height="12" rx="3" fill="#e5484d" />
          <line
            x1="160"
            y1="42"
            x2="160"
            y2={Math.max(liquidY - 2, 56)}
            stroke="url(#fuelGrad)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
