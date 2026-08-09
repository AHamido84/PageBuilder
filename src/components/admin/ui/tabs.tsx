"use client";

import { useState } from "react";

interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({ items, defaultKey }: { items: TabItem[]; defaultKey?: string }) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);

  return (
    <div>
      <div className="mb-5 flex gap-1 border-b border-neutral-800">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActive(item.key)}
            className={
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors " +
              (active === item.key
                ? "border-neutral-100 text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-300")
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div key={item.key} hidden={active !== item.key}>
          {item.content}
        </div>
      ))}
    </div>
  );
}
