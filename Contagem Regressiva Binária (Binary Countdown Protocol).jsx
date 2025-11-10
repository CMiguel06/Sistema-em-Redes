import React, { useEffect, useMemo, useRef, useState } from "react";

// =============================
// Binary Countdown Protocol — Interactive Demo (PT-PT)
// - Tailwind for styling
// - No external UI libs to keep it portable
// =============================

const palette = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#7c3aed", // violet-600
  "#ea580c", // orange-600
  "#0891b2", // cyan-600
  "#be185d", // rose-700
  "#15803d", // emerald-700
];

function padLeft(bin, size) {
  const s = String(bin ?? "").replace(/[^01]/g, "");
  if (!size) return s;
  return s.padStart(size, "0");
}

function computeBusBit(activeStations, bitIdx, dominant) {
  const bits = activeStations.map((s) => s.bits[bitIdx]);
  const hasDominant = bits.includes(dominant);
  return hasDominant ? dominant : dominant === "1" ? "0" : "1"; // recessive if none sent dominant
}

function eliminatedOnThisBit(station, busBit, dominant, bitIdx) {
  const b = station.bits[bitIdx];
  // Lose only if bus shows the dominant level and this station sent the recessive
  if (busBit === dominant && b !== dominant) return true;
  return false;
}

function prettyBitLabel(i, total) {
  const fromMSB = i; // index from MSB → LSB
  const weight = total - 1 - i; // traditional label Bit(total-1) ... Bit(0)
  return `Bit ${weight}`;
}

function msbToLsbIndices(n) {
  return Array.from({ length: n }, (_, i) => i);
}

function StationRow({ st, idx, active, currentBit, winner, onChangeId }) {
  const status = winner
    ? winner.name === st.name
      ? "Vencedor"
      : st.lostAt != null
      ? `Perdeu em ${prettyBitLabel(st.lostAt, st.bits.length)}`
      : "—"
    : st.lostAt != null
    ? `Perdeu em ${prettyBitLabel(st.lostAt, st.bits.length)}`
    : active
    ? "Em arbitragem"
    : "—";

  return (
    <div
      className="grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-2xl border p-3 shadow-sm bg-white/60 backdrop-blur"
      style={{ borderColor: st.color + "44" }}
    >
      <div
        className="h-8 w-8 rounded-full"
        style={{ background: st.color, boxShadow: `0 0 0 3px ${st.color}22 inset` }}
        title={st.name}
      />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-slate-800 truncate">{st.name}</div>
          <div
            className={`text-xs px-2 py-0.5 rounded-full ${
              winner && winner.name === st.name
                ? "bg-green-100 text-green-700"
                : st.lostAt != null
                ? "bg-rose-100 text-rose-700"
                : active
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {status}
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1 font-mono">
          {st.bits.map((b, i) => {
            const isCurrent = i === currentBit && st.lostAt == null && !winner;
            const dimmed = st.lostAt != null && i >= st.lostAt;
            return (
              <span
                key={i}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm ${
                  isCurrent
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-slate-200"
                } ${dimmed ? "opacity-30" : ""}`}
                style={{ background: isCurrent ? "#eff6ff" : "white" }}
                title={prettyBitLabel(i, st.bits.length)}
              >
                {b}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1 font-mono text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={st.bits.join("")}
          onChange={(e) => onChangeId(idx, e.target.value)}
          maxLength={16}
        />
      </div>
    </div>
  );
}

export default function BinaryCountdownDemo() {
  const [bitCount, setBitCount] = useState(4);
  const [dominant, setDominant] = useState("1"); // "1" or "0"
  const [stations, setStations] = useState(() => {
    const base = [
      { name: "D", id: "1110" },
      { name: "A", id: "1101" },
      { name: "B", id: "1010" },
      { name: "C", id: "0111" },
    ];
    return base.map((s, i) => ({
      name: s.name,
      color: palette[i % palette.length],
      bits: padLeft(s.id, 4).split(""),
      lostAt: null,
    }));
  });

  const [currentBit, setCurrentBit] = useState(null); // null -> not started; otherwise 0..(bitCount-1)
  const [busBits, setBusBits] = useState([]); // values decided for each bit so far
  const [log, setLog] = useState([]); // narration
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState(900); // ms per step

  const activeStations = useMemo(
    () => stations.filter((s) => s.lostAt == null),
    [stations]
  );

  const winner = useMemo(() => {
    const alive = stations.filter((s) => s.lostAt == null);
    if (alive.length === 1) return alive[0];
    if (currentBit === bitCount && alive.length >= 1) {
      // If IDs are unique, alive.length should be 1; otherwise it's a tie
      if (alive.length === 1) return alive[0];
      return { name: "Empate", color: "#0f172a", bits: [], lostAt: null };
    }
    return null;
  }, [stations, currentBit, bitCount]);

  // Helpers
  const reset = () => {
    setStations((prev) => prev.map((s) => ({ ...s, lostAt: null })));
    setCurrentBit(null);
    setBusBits([]);
    setLog([]);
    setAuto(false);
  };

  const start = () => {
    reset();
    setCurrentBit(0);
  };

  const step = () => {
    if (winner && winner.name !== "Empate") return; // already have a clear winner
    if (currentBit == null) {
      setCurrentBit(0);
      return;
    }
    if (currentBit >= bitCount) return; // finished all bits

    const bus = computeBusBit(activeStations, currentBit, dominant);

    // determine eliminations
    const losing = activeStations.filter((s) =>
      eliminatedOnThisBit(s, bus, dominant, currentBit)
    );

    setStations((prev) =>
      prev.map((s) => {
        const isLosing = losing.find((x) => x.name === s.name);
        if (isLosing) return { ...s, lostAt: currentBit };
        return s;
      })
    );

    setBusBits((prev) => {
      const next = [...prev];
      next[currentBit] = bus;
      return next;
    });

    const losersList = losing.map((s) => s.name).join(", ") || "nenhuma";
    const lab = prettyBitLabel(currentBit, bitCount);
    const msg =
      bus === dominant
        ? `${lab}: o barramento ficou em ${bus} (nível dominante). Perdem: ${losersList}.`
        : `${lab}: nenhuma estação enviou o nível dominante; o barramento ficou em ${bus} (recessivo). Ninguém perde.`;
    setLog((l) => [...l, msg]);

    const nextBit = currentBit + 1;
    setCurrentBit(nextBit);
  };

  // Auto-play
  useEffect(() => {
    if (!auto) return;
    if (winner && winner.name !== "Empate") return;
    if (currentBit == null) return;
    if (currentBit > bitCount) return;
    const t = setTimeout(() => step(), speed);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, currentBit, speed, dominant, stations]);

  // Keep all IDs with the same bit length
  useEffect(() => {
    setStations((prev) =>
      prev.map((s, i) => ({
        ...s,
        bits: padLeft(s.bits.join(""), bitCount).slice(-bitCount).split(""),
        lostAt: null,
      }))
    );
    setCurrentBit(null);
    setBusBits([]);
    setLog([]);
    setAuto(false);
  }, [bitCount]);

  const onChangeId = (idx, newVal) => {
    const cleaned = newVal.replace(/[^01]/g, "").slice(-16);
    setStations((prev) =>
      prev.map((s, i) =>
        i === idx
          ? { ...s, bits: padLeft(cleaned, bitCount).slice(-bitCount).split("") }
          : s
      )
    );
    setCurrentBit(null);
    setBusBits([]);
    setLog([]);
    setAuto(false);
  };

  const addStation = () => {
    const idx = stations.length;
    const name = String.fromCharCode(65 + idx); // A, B, C...
    const id = padLeft("", bitCount).replace(/0/g, idx % 2 ? "1" : "0");
    setStations((prev) => [
      ...prev,
      {
        name,
        color: palette[idx % palette.length],
        bits: id.split(""),
        lostAt: null,
      },
    ]);
    setCurrentBit(null);
    setBusBits([]);
    setLog([]);
  };

  const removeStation = (i) => {
    setStations((prev) => prev.filter((_, j) => j !== i));
    setCurrentBit(null);
    setBusBits([]);
    setLog([]);
  };

  const activeCount = activeStations.length;
  const recessive = dominant === "1" ? "0" : "1";

  return (
    <div className="min-h-[100vh] w-full bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="sticky top-0 z-10 mb-6 rounded-2xl border bg-white/80 p-4 backdrop-blur shadow-sm">
          <h1 className="text-2xl font-bold">Contagem Regressiva Binária (Binary Countdown Protocol)</h1>
          <p className="mt-1 text-sm text-slate-600">
            Arbitragem determinística em meios partilhados com nível dominante. As estações emitem os seus
            <span className="font-semibold"> IDs binários </span> do bit mais significativo (MSB) para o menos (LSB). O barramento apresenta o
            nível <span className="font-semibold">{dominant}</span> se alguma estação o transmitir (nível dominante); quem transmitiu o nível
            recessivo e observa o dominante <span className="font-semibold">perde a arbitragem</span> e desiste. Vence a prioridade de acordo com a polaridade.
          </p>
        </header>

        {/* Controls */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Parâmetros</h2>
            <div className="mt-3 space-y-3">
              <label className="block text-sm">
                <span className="text-slate-600">Número de bits</span>
                <input
                  type="number"
                  min={2}
                  max={16}
                  value={bitCount}
                  onChange={(e) => setBitCount(Math.max(2, Math.min(16, Number(e.target.value) || 2)))}
                  className="mt-1 w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </label>

              <div className="text-sm">
                <div className="text-slate-600 mb-1">Nível dominante</div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="dom"
                      checked={dominant === "1"}
                      onChange={() => setDominant("1")}
                    />
                    <span className="font-mono">1 domina 0</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="dom"
                      checked={dominant === "0"}
                      onChange={() => setDominant("0")}
                    />
                    <span className="font-mono">0 domina 1</span>
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Com <span className="font-mono">1</span> dominante, vence o ID numericamente mais alto; com <span className="font-mono">0</span> dominante, vence o mais baixo.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Execução</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={start}
                className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                Iniciar
              </button>
              <button
                onClick={step}
                disabled={currentBit == null}
                className="rounded-xl bg-slate-700 px-4 py-2 text-white shadow hover:bg-slate-800 disabled:opacity-40"
              >
                Avançar 1 bit
              </button>
              <button
                onClick={() => setAuto((v) => !v)}
                disabled={currentBit == null}
                className={`rounded-xl px-4 py-2 text-white shadow disabled:opacity-40 ${
                  auto ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {auto ? "Pausar" : "Auto"}
              </button>
              <button
                onClick={reset}
                className="rounded-xl bg-white px-4 py-2 text-slate-700 shadow border hover:bg-slate-50"
              >
                Repor
              </button>
            </div>
            <div className="mt-4">
              <label className="text-xs text-slate-500">Velocidade (ms por bit)</label>
              <input
                type="range"
                min={200}
                max={2000}
                step={100}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-slate-600">{speed} ms</div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Cenários de utilização</h2>
            <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
              <li><span className="font-semibold">Barramentos industriais/automotivos</span>: arbitragem bit-a-bit com prioridades rígidas.</li>
              <li><span className="font-semibold">Backplanes e sistemas multiprocessador</span>: concessão do bus sem colisões.</li>
              <li><span className="font-semibold">Interfaces multi-mestre</span> em meios com níveis dominante/recessivo.</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">Vantagem: elimina colisões na contenção e dá previsibilidade temporal. Atenção à potencial fome de baixas prioridades.</p>
          </div>
        </section>

        {/* Bus timeline */}
        <section className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Barramento (MSB → LSB)</h2>
          <div className="mt-3 grid grid-cols-[auto,1fr] items-center gap-3">
            <div className="text-xs text-slate-500">Nível no fio</div>
            <div className="flex flex-wrap items-center gap-2">
              {msbToLsbIndices(bitCount).map((i) => {
                const decided = busBits[i] != null;
                const isCurrent = i === currentBit;
                return (
                  <div
                    key={i}
                    className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border font-mono text-lg ${
                      decided
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : isCurrent
                        ? "border-blue-400 bg-blue-50 text-blue-700 animate-pulse"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                    title={prettyBitLabel(i, bitCount)}
                  >
                    {decided ? busBits[i] : isCurrent ? "?" : "—"}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Dominante: <span className="font-mono font-semibold">{dominant}</span> · Recessivo: <span className="font-mono font-semibold">{recessive}</span>
          </div>
        </section>

        {/* Stations */}
        <section className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {stations.map((st, i) => (
            <div key={st.name} className="relative">
              <StationRow
                st={st}
                idx={i}
                active={st.lostAt == null && !winner}
                currentBit={currentBit}
                winner={winner && winner.name !== "Empate" ? winner : null}
                onChangeId={onChangeId}
              />
              <button
                onClick={() => removeStation(i)}
                className="absolute -right-2 -top-2 rounded-full bg-white text-slate-500 p-1 shadow border hover:bg-rose-50 hover:text-rose-600"
                title="Remover estação"
              >
                ×
              </button>
            </div>
          ))}
        </section>
        <div className="mt-2">
          <button
            onClick={addStation}
            className="rounded-xl border bg-white px-3 py-2 text-sm shadow hover:bg-slate-50"
          >
            + Adicionar estação
          </button>
        </div>

        {/* Narration */}
        <section className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Narração da arbitragem</h2>
          {log.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Sem eventos ainda. Clique em <span className="font-semibold">Iniciar</span> e depois em <span className="font-semibold">Avançar 1 bit</span> (ou <span className="font-semibold">Auto</span>).
            </p>
          ) : (
            <ol className="mt-2 list-decimal pl-5 text-sm space-y-1">
              {log.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ol>
          )}

          {/* Winner banner */}
          {winner && (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3">
              {winner.name === "Empate" ? (
                <p className="text-emerald-800">
                  Empate após {bitCount} bits — existem IDs idênticos. Diferencie os IDs para um desfecho único.
                </p>
              ) : (
                <p className="text-emerald-800">
                  <span className="font-semibold">Vencedor:</span> estação <span className="font-semibold">{winner.name}</span>.
                  Pode transmitir sem colisões.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Footer note */}
        <footer className="mt-8 text-xs text-slate-500">
          <p>
            Dica: use o exemplo do enunciado — <span className="font-mono">D=1110</span>, <span className="font-mono">A=1101</span>, <span className="font-mono">B=1010</span>, <span className="font-mono">C=0111</span> — e veja como o barramento decide <span className="font-mono">1</span> nos três primeiros bits, eliminando C, depois B e depois A.
          </p>
        </footer>
      </div>
    </div>
  );
}
