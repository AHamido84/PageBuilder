"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  id: string;
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
}

export function FaqAccordion({ items, locale }: { items: FaqItem[]; locale: string }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-ink/10 border-y border-ink/10">
      {items.map((item) => {
        const open = openId === item.id;
        const question = locale === "ar" ? item.questionAr : item.questionEn;
        const answer = locale === "ar" ? item.answerAr : item.answerEn;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left font-medium"
            >
              <span>{question}</span>
              <ChevronDown size={18} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open ? <p className="whitespace-pre-line pb-4 text-sm leading-relaxed text-ink/65">{answer}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
