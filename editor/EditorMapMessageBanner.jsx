import React from "react";

export default function EditorMapMessageBanner({ lastMessage }) {
  if (!lastMessage) return null;
  return (
    <div
      className={`px-3 py-1.5 text-sm shrink-0 ${
        lastMessage.type === "err"
          ? "bg-red-950/80 text-red-200"
          : lastMessage.type === "warn"
            ? "bg-amber-950/80 text-amber-100"
            : "bg-emerald-950/60 text-emerald-100"
      }`}
    >
      {lastMessage.text}
    </div>
  );
}
