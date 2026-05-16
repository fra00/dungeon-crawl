import React from "react";

const svgProps = {
  className: "w-[1.15rem] h-[1.15rem] shrink-0",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function IconActionsMenu(props) {
  return (
    <svg {...svgProps} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export const DUNGEON_EXPLORE_ICON_SRC = {
  passages: "/img/altro/secret-door.svg",
  treasure: "/img/altro/open-treasure-chest.svg",
  traps: "/img/altro/wolf-trap.svg",
};

function createExploreActionIcon(src) {
  return function ExploreActionIcon({ className = "" }) {
    return (
      <img
        src={src}
        alt=""
        draggable={false}
        className={`object-contain pointer-events-none shrink-0 ${
          className || "w-[1.15rem] h-[1.15rem]"
        }`}
      />
    );
  };
}

/** Cerca passaggi segreti */
export const IconSearchPassages = createExploreActionIcon(DUNGEON_EXPLORE_ICON_SRC.passages);

/** Cerca tesori */
export const IconSearchTreasure = createExploreActionIcon(DUNGEON_EXPLORE_ICON_SRC.treasure);

/** Cerca trappole */
export const IconSearchTraps = createExploreActionIcon(DUNGEON_EXPLORE_ICON_SRC.traps);

export function IconOpenDoor(props) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M5 4h8a2 2 0 0 1 2 2v12H7a2 2 0 0 1-2-2V4z" />
      <path d="M15 8h4v12h-4" />
      <circle cx="11" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconDisarmTrap(props) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M14 6l4 4-8 8-4-4 8-8z" />
      <path d="M6 18l-2 2" />
      <path d="M16 4l2-2" />
    </svg>
  );
}

export function IconCancelTarget(props) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}

export function IconMagic(props) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
    </svg>
  );
}

/** Fine turno */
export function IconEndTurn({ className = "" }) {
  return (
    <img
      src="/img/altro/player-next.svg"
      alt=""
      draggable={false}
      className={`object-contain pointer-events-none shrink-0 ${
        className || "w-[1.15rem] h-[1.15rem]"
      }`}
    />
  );
}

/** Icona + etichetta opzionale (menu, FAB). */
export function ActionGlyph({ icon: Icon, label, iconClassName = "" }) {
  return (
    <span className="inline-flex flex-col items-center justify-center gap-0.5 leading-none">
      <Icon className={iconClassName || svgProps.className} />
      {label ? (
        <span className="text-[7px] font-bold uppercase tracking-wide">{label}</span>
      ) : null}
    </span>
  );
}
