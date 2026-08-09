"use client";

import { SelectField } from "@/components/admin/ui/field";
import type { BlockEditProps, BlockRenderProps } from "../../types";
import type { DividerData, SpacerData } from "../layout-blocks";

export function DividerEdit({ data, onChange }: BlockEditProps<DividerData>) {
  return (
    <SelectField
      label="Style"
      value={data.style}
      onChange={(style) => onChange({ style })}
      options={[
        { value: "line", label: "Line" },
        { value: "dots", label: "Dots" },
      ]}
    />
  );
}

export function DividerRender({ data }: BlockRenderProps<DividerData>) {
  if (data.style === "dots") {
    return (
      <div className="flex justify-center gap-2" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
      </div>
    );
  }
  return <hr className="border-current opacity-15" />;
}

const HEIGHT_LABEL: Record<SpacerData["height"], string> = { sm: "Small", md: "Medium", lg: "Large", xl: "Extra large" };
const HEIGHT_CLASS: Record<SpacerData["height"], string> = { sm: "h-6", md: "h-12", lg: "h-20", xl: "h-32" };

export function SpacerEdit({ data, onChange }: BlockEditProps<SpacerData>) {
  return (
    <SelectField
      label="Height"
      value={data.height}
      onChange={(height) => onChange({ height })}
      options={(Object.keys(HEIGHT_LABEL) as SpacerData["height"][]).map((v) => ({ value: v, label: HEIGHT_LABEL[v] }))}
    />
  );
}

export function SpacerRender({ data }: BlockRenderProps<SpacerData>) {
  return <div className={HEIGHT_CLASS[data.height]} aria-hidden="true" />;
}
