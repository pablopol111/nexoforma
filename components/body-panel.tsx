import { formatNumber } from '@/lib/utils';

type BodyPanelProps = {
  referenceWeight: number | null;
  currentWeight: number | null;
  predictedWeight: number | null;
  ready: boolean;
};

function BodyCard({ title, weight, tone }: { title: string; weight: number | null; tone: "reference" | "current" | "target" }) {
  return (
    <article className={`bodyCard ${tone}`}>
      <div className="bodyFigure" aria-hidden>
        <div className="bodyFront" />
        <div className="bodySide" />
      </div>
      <strong>{title}</strong>
      <span>{weight === null ? '-' : `${formatNumber(weight, 2)} kg`}</span>
    </article>
  );
}

export function BodyPanel({ referenceWeight, currentWeight, predictedWeight, ready }: BodyPanelProps) {
  if (!ready) {
    return <section className="panel bodyPending"><h2>Cuerpo</h2><p>Completa tu perfil con nombre, apellidos, altura y pesos para visualizar la comparativa corporal.</p></section>;
  }

  return (
    <section className="panel stack">
      <div className="panelHead split">
        <h2>Cuerpo</h2>
        <span className="chip">Referencia · actual · previsto</span>
      </div>
      <div className="bodyGrid premiumBodyGrid">
        <BodyCard title="Referencia" weight={referenceWeight} tone="reference" />
        <BodyCard title="Actual" weight={currentWeight} tone="current" />
        <BodyCard title="Previsto" weight={predictedWeight} tone="target" />
      </div>
      <div className="legendRow"><span>Cintura</span><span>Cadera</span><span>Pecho</span><span>Brazo</span><span>Muslo</span></div>
    </section>
  );
}
