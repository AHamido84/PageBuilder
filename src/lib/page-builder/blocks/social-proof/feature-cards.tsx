import type { BlockRenderProps } from "../../types";
import { resolveColumnsClasses } from "../../style-tokens";
import type { FeatureCardsData } from "../social-proof-blocks";

export function FeatureCardsRender({ data, settings }: BlockRenderProps<FeatureCardsData>) {
  return (
    <div>
      {data.heading ? <h2 className="mb-8 font-display text-3xl">{data.heading}</h2> : null}
      <div className={`grid gap-8 ${resolveColumnsClasses(settings)}`}>
        {data.items.map((item, i) => (
          <div key={i}>
            <p className="font-display text-xl">{item.title}</p>
            <p className="mt-2 text-sm opacity-65">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
