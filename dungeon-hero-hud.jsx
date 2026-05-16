import React from "react";

function StatRow({ icon, label, value, valueColor = "text-stone-100" }) {
  return (
    <div className="flex flex-col items-center justify-center py-1 px-0.5 border-b border-stone-700/40 last:border-b-0 min-h-0">
      <span className="text-sm leading-none" title={label}>
        {icon}
      </span>
      <span className={`text-xs sm:text-sm font-bold leading-tight ${valueColor}`}>
        {value}
      </span>
      <span className="text-[8px] text-stone-500 uppercase tracking-tighter leading-none hidden sm:block">
        {label}
      </span>
    </div>
  );
}

/** Barra che anima il riempimento quando Sal/Men cambiano. */
function StatBarRow({
  icon,
  label,
  current,
  maxBase,
  valueColor = "text-stone-100",
  barClass = "bg-stone-500",
}) {
  const max = Math.max(1, Number(maxBase) || 1);
  const cur = Math.max(0, Number(current) || 0);
  const pct = Math.min(100, (cur / max) * 100);
  return (
    <div className="flex flex-col items-center justify-center py-1 px-0.5 border-b border-stone-700/40 last:border-b-0 min-h-0 w-full">
      <span className="text-sm leading-none" title={label}>
        {icon}
      </span>
      <div className="w-full max-w-[2.4rem] sm:max-w-[2.85rem] mt-0.5 px-0.5">
        <div className="h-1 sm:h-1.5 w-full rounded-full bg-stone-950/90 overflow-hidden border border-stone-700/45">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${barClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className={`text-xs sm:text-sm font-bold leading-tight mt-0.5 ${valueColor}`}>{cur}</span>
      <span className="text-[8px] text-stone-500 uppercase tracking-tighter leading-none hidden sm:block">
        {label}
      </span>
    </div>
  );
}

/**
 * Colonna sinistra: stats (scroll) + azioni di turno in basso.
 */
export default function DungeonHeroHud({
  currentHero,
  currentHeroStats = null,
  chromeDisabled = false,
  sidebarActions = null,
}) {
  if (!currentHero) return null;

  const attack = currentHeroStats?.attacco ?? currentHero.hero?.attacco ?? 0;
  const defense = currentHeroStats?.difesa ?? currentHero.hero?.difesa ?? 0;
  const body = currentHero.currentBody ?? 0;
  const mind = currentHero.currentMind ?? 0;
  const maxBody = currentHero.hero?.corpo ?? 1;
  const maxMind = currentHero.hero?.mente ?? 1;
  const gold = currentHero.gold ?? 0;
  const activeEffects = Array.isArray(currentHero.activeStatus)
    ? currentHero.activeStatus
    : [];

  return (
    <aside
      className={`dungeon-hero-column flex flex-col h-full min-h-0 w-[3rem] sm:w-[3.25rem] shrink-0 bg-stone-800/95 border-r border-amber-700/30 text-stone-200 font-serif ${
        chromeDisabled ? "opacity-55 pointer-events-none select-none" : ""
      }`}
      data-testid="dungeon-hero-stats"
      aria-disabled={chromeDisabled || undefined}
    >
      <div className="dungeon-hero-stats flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <StatRow icon="⚔️" label="Att" value={attack} />
        <StatRow icon="🛡️" label="Dif" value={defense} />
        <StatBarRow
          icon="🧠"
          label="Men"
          current={mind}
          maxBase={maxMind}
          valueColor="text-blue-400"
          barClass="bg-gradient-to-r from-indigo-600 to-blue-400"
        />
        <StatBarRow
          icon="❤️"
          label="Sal"
          current={body}
          maxBase={maxBody}
          valueColor="text-red-400"
          barClass="bg-gradient-to-r from-red-800 to-red-500"
        />
        <StatRow icon="🪙" label="Oro" value={gold} valueColor="text-yellow-400" />
        {activeEffects.length > 0 && (
          <div className="p-0.5 flex flex-col gap-0.5 items-center">
            {activeEffects.slice(0, 3).map((effect, idx) => (
              <span
                key={idx}
                className="bg-purple-900/60 text-purple-200 px-0.5 rounded text-[7px] leading-tight text-center max-w-full truncate"
                title={effect}
              >
                {effect.slice(0, 4)}
              </span>
            ))}
          </div>
        )}
      </div>
      {sidebarActions}
    </aside>
  );
}
