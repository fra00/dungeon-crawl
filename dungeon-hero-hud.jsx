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

/**
 * Colonna stats sempre visibile (stretto, mobile = desktop).
 */
export default function DungeonHeroHud({
  currentHero,
  currentHeroStats = null,
}) {
  if (!currentHero) return null;

  const attack = currentHeroStats?.attacco ?? currentHero.hero?.attacco ?? 0;
  const defense = currentHeroStats?.difesa ?? currentHero.hero?.difesa ?? 0;
  const body = currentHero.currentBody ?? 0;
  const mind = currentHero.currentMind ?? 0;
  const gold = currentHero.gold ?? 0;
  const activeEffects = Array.isArray(currentHero.activeStatus)
    ? currentHero.activeStatus
    : [];

  return (
    <aside
      className="dungeon-hero-stats flex flex-col h-full min-h-0 w-[2.75rem] sm:w-[3.25rem] shrink-0 bg-stone-800/95 border-r border-amber-700/30 text-stone-200 font-serif overflow-y-auto custom-scrollbar"
      data-testid="dungeon-hero-stats"
    >
      <StatRow icon="⚔️" label="Att" value={attack} />
      <StatRow icon="🛡️" label="Dif" value={defense} />
      <StatRow icon="🧠" label="Men" value={mind} valueColor="text-blue-400" />
      <StatRow icon="❤️" label="Sal" value={body} valueColor="text-red-400" />
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
    </aside>
  );
}
