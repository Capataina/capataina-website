import type { Article } from "@/types";

// NeuroDrive
import { neurodrive43xCacheSpeedup } from "./neurodrive/43x-cache-speedup";
import { neurodriveStutterForensics } from "./neurodrive/stutter-forensics";
import { neurodriveOneBrainOneLifetime } from "./neurodrive/one-brain-one-lifetime";
import { neurodrivePpoAsBaseline } from "./neurodrive/ppo-as-baseline";
import { neurodriveDualGemmAmx } from "./neurodrive/dual-gemm-amx";

// Cernio
import { cernioVsLinkedin } from "./cernio/vs-linkedin";
import { cernioSkillEcosystem } from "./cernio/skill-ecosystem";
import { cernioRatatuiTui } from "./cernio/ratatui-tui";
import { cernioTestAudit } from "./cernio/test-audit";
import { cernioLocationRubric } from "./cernio/location-rubric";

// Aurix
import { aurixVectorASprint } from "./aurix/vector-a-sprint";
import { aurixQ6496Math } from "./aurix/q64-96-math";
import { aurixFreeDataFallback } from "./aurix/free-data-fallback";
import { aurixVolRegimeClassifier } from "./aurix/vol-regime-classifier";
import { aurixAuditCycle } from "./aurix/audit-cycle";

// Image Browser
import { imageBrowserRrfSearch } from "./image-browser/rrf-search";
import { imageBrowserWalStalls } from "./image-browser/wal-stalls";
import { imageBrowserOnnxRuntime } from "./image-browser/onnx-runtime";
import { imageBrowserCoremlFailure } from "./image-browser/coreml-failure";

// Nyquestro
import { nyquestroLockFreeMatching } from "./nyquestro/lock-free-matching";
import { nyquestroNewtypeSafety } from "./nyquestro/newtype-safety";

// Open Source
import { burnAfinePr } from "./open-source/burn-afine-pr";
import { burnTensorContainerDualFix } from "./open-source/burn-tensor-container-dual-fix";
import { tinygradLstmSecondTime } from "./open-source/tinygrad-lstm-second-time";
import { burnFold4dImplementation } from "./open-source/burn-fold4d-implementation";
import { ossScoutIssuesSkill } from "./open-source/oss-scout-issues-skill";
import { ossAiPolicySpectrum } from "./open-source/oss-ai-policy-spectrum";

// Meta / cross-cutting
import { portfolioStrategy } from "./meta/portfolio-strategy";
import { websiteArchitecture } from "./meta/website-architecture";
import { localFirstPrinciple } from "./meta/local-first-principle";

export const allArticles: Article[] = [
  // NeuroDrive
  neurodrive43xCacheSpeedup,
  neurodriveStutterForensics,
  neurodriveOneBrainOneLifetime,
  neurodrivePpoAsBaseline,
  neurodriveDualGemmAmx,
  // Cernio
  cernioVsLinkedin,
  cernioSkillEcosystem,
  cernioRatatuiTui,
  cernioTestAudit,
  cernioLocationRubric,
  // Aurix
  aurixVectorASprint,
  aurixQ6496Math,
  aurixFreeDataFallback,
  aurixVolRegimeClassifier,
  aurixAuditCycle,
  // Image Browser
  imageBrowserRrfSearch,
  imageBrowserWalStalls,
  imageBrowserOnnxRuntime,
  imageBrowserCoremlFailure,
  // Nyquestro
  nyquestroLockFreeMatching,
  nyquestroNewtypeSafety,
  // Open Source
  burnAfinePr,
  burnTensorContainerDualFix,
  tinygradLstmSecondTime,
  burnFold4dImplementation,
  ossScoutIssuesSkill,
  ossAiPolicySpectrum,
  // Meta / cross-cutting
  portfolioStrategy,
  websiteArchitecture,
  localFirstPrinciple,
];

/** Lookup helper used by the article view when reading `?article=<slug>`. */
export function findArticle(slug: string): Article | undefined {
  return allArticles.find((a) => a.slug === slug);
}
