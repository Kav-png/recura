// Simple ML deterioration-risk model (V1.5 of the detection layer).
//
// Scope, deliberately narrow — see strategy/company-and-engineering.md:25-26:
// V1 is rule-based baselines + condition rule packs + PROM score; V2 is "ML trained on
// accumulated confirm/dismiss + outcome labels, replacing rule packs as measured precision
// beats them" — that needs real nurse-confirm/dismiss history, which doesn't exist yet.
// This is a synthetic-data stand-in for that V2 shape (per company-and-engineering.md:47's
// own suggestion of a synthetic cohort with measured precision/recall), NOT a claim that the
// model is trained on real patient outcomes. Never use this to gate the unconditional
// severe-symptom emergency rail (CLAUDE.md safety rail #2) — that stays deterministic keyword
// matching in lib/checkinExtraction.ts. This model only scores a secondary "deterioration
// risk" signal from wearable trend + PROM + adherence data, for the nurse queue to triage.

export type RiskFeatures = {
  hrDeltaBpm: number; // resting HR change over the trailing 4-day window
  hrvDeltaMs: number; // HRV change over the same window (negative = declining)
  promRaw: number; // 0-4, from lib/checkinExtraction.ts PROM_SCALE
  mildFlagCount: number; // count of mild symptom keywords raised
  missedDose: 0 | 1;
};

export type LabeledCase = { features: RiskFeatures; deteriorating: 0 | 1 };

function jitter(spread: number) {
  return (Math.random() * 2 - 1) * spread;
}

// Embeds the three patterns named in company-and-engineering.md:47:
// HF decompensation (rising HR, falling HRV), silent non-adherence (missed dose,
// few/no symptom flags), and benign noisy controls.
export function generateSyntheticCohort(n = 300): LabeledCase[] {
  const cases: LabeledCase[] = [];
  for (let i = 0; i < n; i++) {
    const pattern = Math.random();
    let features: RiskFeatures;
    let deteriorating: 0 | 1;
    if (pattern < 0.3) {
      // HF decompensation: rising HR, falling HRV, symptomatic
      features = {
        hrDeltaBpm: 10 + jitter(7),
        hrvDeltaMs: -14 + jitter(9),
        promRaw: 2.5 + jitter(1.6),
        mildFlagCount: Math.round(1.5 + jitter(1.6)),
        missedDose: Math.random() < 0.3 ? 1 : 0,
      };
      deteriorating = 1;
    } else if (pattern < 0.5) {
      // Silent non-adherence: missed meds, modest wearable drift, patient reports feeling fine
      features = {
        hrDeltaBpm: 5 + jitter(6),
        hrvDeltaMs: -6 + jitter(7),
        promRaw: 0.8 + jitter(1.1),
        mildFlagCount: Math.max(0, Math.round(0.3 + jitter(1.1))),
        missedDose: 1,
      };
      deteriorating = 1;
    } else {
      // Benign noisy control: stable, no meaningful trend
      features = {
        hrDeltaBpm: jitter(8),
        hrvDeltaMs: jitter(8),
        promRaw: Math.max(0, 0.3 + jitter(1.1)),
        mildFlagCount: Math.random() < 0.15 ? 1 : 0,
        missedDose: 0,
      };
      deteriorating = 0;
    }
    // Label noise: real triage confirm/dismiss labels are never perfectly clean —
    // a small flip rate keeps held-out metrics honest instead of a suspicious 100%.
    if (Math.random() < 0.06) deteriorating = deteriorating === 1 ? 0 : 1;
    cases.push({ features, deteriorating });
  }
  return cases;
}

const FEATURE_ORDER: (keyof RiskFeatures)[] = ["hrDeltaBpm", "hrvDeltaMs", "promRaw", "mildFlagCount", "missedDose"];

function toVector(f: RiskFeatures): number[] {
  return FEATURE_ORDER.map((k) => f[k]);
}

type Standardizer = { mean: number[]; std: number[] };

function fitStandardizer(vectors: number[][]): Standardizer {
  const n = vectors.length;
  const dim = vectors[0].length;
  const mean = new Array(dim).fill(0);
  for (const v of vectors) for (let j = 0; j < dim; j++) mean[j] += v[j] / n;
  const std = new Array(dim).fill(0);
  for (const v of vectors) for (let j = 0; j < dim; j++) std[j] += (v[j] - mean[j]) ** 2 / n;
  for (let j = 0; j < dim; j++) std[j] = Math.sqrt(std[j]) || 1;
  return { mean, std };
}

function standardize(v: number[], s: Standardizer): number[] {
  return v.map((x, j) => (x - s.mean[j]) / s.std[j]);
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

export type TrainedModel = {
  weights: number[];
  bias: number;
  standardizer: Standardizer;
};

export function trainLogisticRegression(
  cases: LabeledCase[],
  { epochs = 800, learningRate = 0.15, l2 = 0.01 } = {}
): TrainedModel {
  const rawVectors = cases.map((c) => toVector(c.features));
  const standardizer = fitStandardizer(rawVectors);
  const X = rawVectors.map((v) => standardize(v, standardizer));
  const y = cases.map((c) => c.deteriorating);
  const dim = X[0].length;
  let weights = new Array(dim).fill(0);
  let bias = 0;
  const n = X.length;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradW = new Array(dim).fill(0);
    let gradB = 0;
    for (let i = 0; i < n; i++) {
      const z = X[i].reduce((sum, x, j) => sum + x * weights[j], bias);
      const pred = sigmoid(z);
      const error = pred - y[i];
      for (let j = 0; j < dim; j++) gradW[j] += (error * X[i][j]) / n;
      gradB += error / n;
    }
    for (let j = 0; j < dim; j++) weights[j] -= learningRate * (gradW[j] + l2 * weights[j]);
    bias -= learningRate * gradB;
  }

  return { weights, bias, standardizer };
}

export function predictRisk(model: TrainedModel, features: RiskFeatures): number {
  const v = standardize(toVector(features), model.standardizer);
  const z = v.reduce((sum, x, j) => sum + x * model.weights[j], model.bias);
  return sigmoid(z);
}

export type EvalMetrics = { n: number; accuracy: number; precision: number; recall: number };

export function evaluate(model: TrainedModel, cases: LabeledCase[], threshold = 0.5): EvalMetrics {
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0;
  for (const c of cases) {
    const score = predictRisk(model, c.features);
    const predicted = score >= threshold ? 1 : 0;
    if (predicted === 1 && c.deteriorating === 1) tp++;
    else if (predicted === 1 && c.deteriorating === 0) fp++;
    else if (predicted === 0 && c.deteriorating === 0) tn++;
    else fn++;
  }
  const n = cases.length;
  return {
    n,
    accuracy: (tp + tn) / n,
    precision: tp + fp === 0 ? 0 : tp / (tp + fp),
    recall: tp + fn === 0 ? 0 : tp / (tp + fn),
  };
}

// Trains on a synthetic cohort and reports held-out metrics — the number the pitch slide
// should quote, always labeled as measured on synthetic data, never real patient outcomes.
export function trainAndEvaluateOnSyntheticCohort(n = 300, trainFraction = 0.7) {
  const cohort = generateSyntheticCohort(n);
  const splitIdx = Math.floor(n * trainFraction);
  const train = cohort.slice(0, splitIdx);
  const test = cohort.slice(splitIdx);
  const model = trainLogisticRegression(train);
  const metrics = evaluate(model, test);
  return { model, metrics };
}
