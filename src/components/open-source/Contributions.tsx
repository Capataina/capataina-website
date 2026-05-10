import { memo, useMemo } from "react";
import { Contribution } from "./Contribution";
import type { Contribution as ContributionType } from "@/types";
import { burnAFine } from "@/content/open-source/burn-a-fine";
import { burnFold4d } from "@/content/open-source/burn-fold4d";
import { burnTensorContainerPanic } from "@/content/open-source/burn-tensor-container-panic";
import { tinygradOnnxLstm } from "@/content/open-source/tinygrad-onnx-lstm";
import { alloyJsonRpcRecursion } from "@/content/open-source/alloy-jsonrpc-recursion";
import { gameMods } from "@/content/open-source/game-mods";

interface ContributionsProps {
  field: string;
}

const STATUS_RANK: Record<ContributionType["status"], number> = {
  merged: 0,
  released: 1,
  open: 2,
  closed: 3,
};

export const Contributions = memo(function Contributions({
  field,
}: ContributionsProps) {
  const allContributions: ContributionType[] = [
    burnAFine,
    burnFold4d,
    burnTensorContainerPanic,
    tinygradOnnxLstm,
    alloyJsonRpcRecursion,
    gameMods,
  ];

  const contributions = useMemo(
    () =>
      allContributions
        .filter((c) => c.fields.includes(field as ContributionType["fields"][number]))
        .sort((a, b) => {
          const sr = STATUS_RANK[a.status] - STATUS_RANK[b.status];
          if (sr !== 0) return sr;
          return a.title.localeCompare(b.title);
        }),
    [field]
  );

  if (contributions.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col">
      <h3 className="text-xl font-bold text-white mb-3 text-center">
        Open Source Contributions
      </h3>
      <div className="space-y-3">
        {contributions.map((contribution, index) => (
          <div key={contribution.title}>
            <Contribution
              title={contribution.title}
              project={contribution.project}
              date={contribution.date}
              status={contribution.status}
              links={contribution.links}
              description={contribution.description}
              techStack={contribution.techStack}
              technicalDetails={contribution.technicalDetails}
              metrics={contribution.metrics}
            />
            {index < contributions.length - 1 && (
              <div className="mt-3 border-t border-zinc-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
