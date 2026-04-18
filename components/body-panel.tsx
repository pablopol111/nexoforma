import { formatNumber } from "@/lib/utils";
import type { MeasurementEntryRecord } from "@/lib/types";

type BodyPanelProps = {
  referenceWeight: number | null;
  currentWeight: number | null;
  predictedWeight: number | null;
  ready: boolean;
  referenceMeasurements?: MeasurementEntryRecord | null;
  currentMeasurements?: MeasurementEntryRecord | null;
  predictedMeasurements?: Partial<MeasurementEntryRecord> | null;
};

type BodyMetricSet = {
  chest: number;
  waist: number;
  hip: number;
  arm: number;
  thigh: number;
};

function toMetricSet(entry?: Partial<MeasurementEntryRecord> | null): BodyMetricSet | null {
  if (!entry) return null;
  const chest = Number(entry.chest_cm ?? 0);
  const waist = Number(entry.waist_cm ?? 0);
  const hip = Number(entry.hip_cm ?? 0);
  const arm = Number(entry.biceps_flexed_cm ?? entry.biceps_normal_cm ?? 0);
  const thigh = Number(entry.thigh_relaxed_cm ?? 0);
  if (![chest, waist, hip, arm, thigh].some((value) => value > 0)) return null;
  return { chest, waist, hip, arm, thigh };
}

function buildPredictedMetrics(current: BodyMetricSet | null, currentWeight: number | null, predictedWeight: number | null): BodyMetricSet | null {
  if (!current) return null;
  if (currentWeight == null || predictedWeight == null || currentWeight <= 0) return current;
  const ratio = Math.max(0.82, Math.min(1.18, predictedWeight / currentWeight));
  return {
    chest: current.chest * (0.92 + ratio * 0.08),
    waist: current.waist * ratio,
    hip: current.hip * (0.94 + ratio * 0.06),
    arm: current.arm * (0.95 + ratio * 0.05),
    thigh: current.thigh * (0.95 + ratio * 0.05),
  };
}

function getShape(metrics: BodyMetricSet | null) {
  if (!metrics) {
    return {
      shoulderHalf: 24,
      waistHalf: 18,
      hipHalf: 23,
      armWidth: 9,
      thighWidth: 11,
    };
  }

  const shoulderHalf = Math.max(22, Math.min(38, metrics.chest / 4.3));
  const waistHalf = Math.max(16, Math.min(36, metrics.waist / 4.2));
  const hipHalf = Math.max(20, Math.min(40, metrics.hip / 4.1));
  const armWidth = Math.max(8, Math.min(17, metrics.arm / 2.9));
  const thighWidth = Math.max(10, Math.min(18, metrics.thigh / 3.6));

  return { shoulderHalf, waistHalf, hipHalf, armWidth, thighWidth };
}

function HumanFigure({ metrics, tone }: { metrics: BodyMetricSet | null; tone: "reference" | "current" | "target" }) {
  const shape = getShape(metrics);
  const cx = 72;
  const headR = 13;
  const neckY = 31;
  const shoulderY = 50;
  const waistY = 103;
  const hipY = 135;
  const kneeY = 184;
  const footY = 224;

  const torso = [
    `M ${cx - shape.shoulderHalf} ${shoulderY}`,
    `Q ${cx - shape.waistHalf - 6} 78 ${cx - shape.waistHalf} ${waistY}`,
    `Q ${cx - shape.hipHalf - 5} 120 ${cx - shape.hipHalf} ${hipY}`,
    `L ${cx + shape.hipHalf} ${hipY}`,
    `Q ${cx + shape.hipHalf + 5} 120 ${cx + shape.waistHalf} ${waistY}`,
    `Q ${cx + shape.waistHalf + 6} 78 ${cx + shape.shoulderHalf} ${shoulderY}`,
    "Z",
  ].join(" ");

  return (
    <svg className={`humanFigure ${tone}`} viewBox="0 0 144 240" role="img" aria-hidden>
      <circle cx={cx} cy={16} r={headR} className="figureMain" />
      <path d={`M ${cx - 7} ${neckY} L ${cx + 7} ${neckY} L ${cx + 10} ${shoulderY} L ${cx - 10} ${shoulderY} Z`} className="figureMain" />
      <path d={torso} className="figureMain" />
      <path d={`M ${cx - shape.shoulderHalf} ${shoulderY + 3} Q ${cx - shape.shoulderHalf - 16} 78 ${cx - shape.armWidth} 118 Q ${cx - shape.armWidth + 4} 135 ${cx - 12} 148`} className="figureLimb" />
      <path d={`M ${cx + shape.shoulderHalf} ${shoulderY + 3} Q ${cx + shape.shoulderHalf + 16} 78 ${cx + shape.armWidth} 118 Q ${cx + shape.armWidth - 4} 135 ${cx + 12} 148`} className="figureLimb" />
      <path d={`M ${cx - 14} ${hipY} Q ${cx - shape.thighWidth} 162 ${cx - shape.thighWidth + 1} ${kneeY} Q ${cx - shape.thighWidth + 3} 206 ${cx - 16} ${footY}`} className="figureLimb" />
      <path d={`M ${cx + 14} ${hipY} Q ${cx + shape.thighWidth} 162 ${cx + shape.thighWidth - 1} ${kneeY} Q ${cx + shape.thighWidth - 3} 206 ${cx + 16} ${footY}`} className="figureLimb" />
    </svg>
  );
}

function MeasurementList({ metrics }: { metrics: BodyMetricSet | null }) {
  if (!metrics) {
    return <small>Sin medidas suficientes para modelar el contorno corporal.</small>;
  }

  return (
    <div className="bodyMetricList">
      <span>Pecho {formatNumber(metrics.chest, 1)} cm</span>
      <span>Cintura {formatNumber(metrics.waist, 1)} cm</span>
      <span>Cadera {formatNumber(metrics.hip, 1)} cm</span>
      <span>Brazo {formatNumber(metrics.arm, 1)} cm</span>
      <span>Muslo {formatNumber(metrics.thigh, 1)} cm</span>
    </div>
  );
}

function BodyCard({ title, weight, tone, metrics }: { title: string; weight: number | null; tone: "reference" | "current" | "target"; metrics: BodyMetricSet | null }) {
  return (
    <article className={`bodyCard ${tone}`}>
      <div className="bodyFigure humanoidFigure" aria-hidden>
        <HumanFigure metrics={metrics} tone={tone} />
      </div>
      <div className="stack compactStack bodyCardMeta">
        <strong>{title}</strong>
        <span>{weight === null ? "-" : `${formatNumber(weight, 2)} kg`}</span>
        <MeasurementList metrics={metrics} />
      </div>
    </article>
  );
}

export function BodyPanel({ referenceWeight, currentWeight, predictedWeight, ready, referenceMeasurements, currentMeasurements, predictedMeasurements }: BodyPanelProps) {
  if (!ready) {
    return <section className="panel bodyPending"><h2>Cuerpo</h2><p>Completa tu perfil con nombre, apellidos, altura y pesos para visualizar la comparativa corporal.</p></section>;
  }

  const referenceMetrics = toMetricSet(referenceMeasurements ?? currentMeasurements ?? null);
  const currentMetrics = toMetricSet(currentMeasurements ?? referenceMeasurements ?? null);
  const targetMetrics = toMetricSet(predictedMeasurements) ?? buildPredictedMetrics(currentMetrics, currentWeight, predictedWeight);

  return (
    <section className="panel stack">
      <div className="panelHead split wrapOnMobile">
        <div className="stack compactStack">
          <h2>Cuerpo</h2>
          <p className="mutedLine">Lectura visual basada en pecho, cintura, cadera, brazo y muslo. El contorno cambia según las medidas registradas.</p>
        </div>
        <span className="chip">Referencia · actual · previsto</span>
      </div>
      <div className="bodyGrid premiumBodyGrid humanoidGrid">
        <BodyCard title="Referencia" weight={referenceWeight} tone="reference" metrics={referenceMetrics} />
        <BodyCard title="Actual" weight={currentWeight} tone="current" metrics={currentMetrics} />
        <BodyCard title="Previsto" weight={predictedWeight} tone="target" metrics={targetMetrics} />
      </div>
    </section>
  );
}
