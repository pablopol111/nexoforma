import { formatNumber } from "@/lib/utils";
import type { MeasurementEntryRecord } from "@/lib/types";

type BodyPanelProps = {
  referenceWeight: number | null;
  currentWeight: number | null;
  predictedWeight: number | null;
  ready: boolean;
  latestMeasurements?: MeasurementEntryRecord | null;
  previousMeasurements?: MeasurementEntryRecord | null;
};

function silhouetteMetrics(measurement?: MeasurementEntryRecord | null) {
  const chest = measurement?.chest_cm ?? 96;
  const waist = measurement?.waist_cm ?? 82;
  const hip = measurement?.hip_cm ?? 96;
  const arm = measurement?.biceps_flexed_cm ?? measurement?.biceps_normal_cm ?? 31;
  const thigh = measurement?.thigh_relaxed_cm ?? 55;
  return {
    shoulder: Math.max(42, Math.min(64, 46 + (chest - 96) * 0.18)),
    waist: Math.max(26, Math.min(50, 30 + (waist - 82) * 0.14)),
    hip: Math.max(36, Math.min(62, 40 + (hip - 96) * 0.18)),
    arm: Math.max(10, Math.min(18, 11 + (arm - 31) * 0.2)),
    thigh: Math.max(14, Math.min(24, 16 + (thigh - 55) * 0.12)),
  };
}

function HumanFigure({ title, weight, measurement, highlight }: { title: string; weight: number | null; measurement?: MeasurementEntryRecord | null; highlight?: boolean }) {
  const shape = silhouetteMetrics(measurement);
  const shoulderX = 80 - shape.shoulder / 2;
  const waistX = 80 - shape.waist / 2;
  const hipX = 80 - shape.hip / 2;
  const path = [
    `M ${shoulderX} 58`,
    `Q 80 52 ${80 + shape.shoulder / 2} 58`,
    `L ${80 + shape.waist / 2} 120`,
    `Q 80 130 ${80 + shape.hip / 2} 148`,
    `L ${80 + shape.thigh / 2 - 4} 208`,
    `L ${80 + shape.thigh / 2 - 16} 208`,
    `L 88 156`,
    `L 72 156`,
    `L ${80 - shape.thigh / 2 + 16} 208`,
    `L ${80 - shape.thigh / 2 + 4} 208`,
    `L ${hipX} 148`,
    `Q 80 130 ${waistX} 120`,
    "Z",
  ].join(" ");

  return (
    <article className={`bodyCard premium ${highlight ? "selected" : ""}`}>
      <svg viewBox="0 0 160 240" className="bodySvg" role="img" aria-label={title}>
        <circle cx="80" cy="30" r="18" className="bodyHead" />
        <path d={path} className="bodyShape" />
        <rect x={String(80 - shape.shoulder / 2 - shape.arm)} y="70" width={String(shape.arm)} height="86" rx="10" className="bodyArm" />
        <rect x={String(80 + shape.shoulder / 2)} y="70" width={String(shape.arm)} height="86" rx="10" className="bodyArm" />
      </svg>
      <strong>{title}</strong>
      <span>{weight === null ? "-" : `${formatNumber(weight, 2)} kg`}</span>
      <div className="bodyMetrics">
        <small>Pecho {formatNumber(measurement?.chest_cm, 1)}</small>
        <small>Cintura {formatNumber(measurement?.waist_cm, 1)}</small>
        <small>Cadera {formatNumber(measurement?.hip_cm, 1)}</small>
      </div>
    </article>
  );
}

export function BodyPanel({ referenceWeight, currentWeight, predictedWeight, ready, latestMeasurements, previousMeasurements }: BodyPanelProps) {
  if (!ready) {
    return <section className="panel bodyPending"><h2>Cuerpo</h2><p>Completa tu perfil y registra medidas para visualizar una comparativa corporal útil.</p></section>;
  }

  return (
    <section className="panel stack">
      <div className="panelHead"><h2>Cuerpo</h2></div>
      <div className="bodyGrid premiumGrid">
        <HumanFigure title="Referencia" weight={referenceWeight} measurement={previousMeasurements ?? latestMeasurements ?? null} />
        <HumanFigure title="Actual" weight={currentWeight} measurement={latestMeasurements ?? null} highlight />
        <HumanFigure title="Previsto" weight={predictedWeight} measurement={latestMeasurements ?? null} />
      </div>
      <small>La silueta se ajusta en función de pecho, cintura, cadera, brazo y muslo para dar una lectura visual mucho más clara.</small>
    </section>
  );
}
