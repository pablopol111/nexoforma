import { formatNumber } from '@/lib/utils';

type BodyPanelProps = {
  referenceWeight: number | null;
  currentWeight: number | null;
  predictedWeight: number | null;
  ready: boolean;
};

function BodyCard({ title, weight }: { title: string; weight: number | null }) {
  return (
    <article className="bodyCard">
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
    return <section className="panel bodyPending"><h2>Cuerpo</h2><p>Completa tu perfil para visualizar tu progreso corporal.</p></section>;
  }

  return (
    <section className="panel stack">
      <div className="panelHead"><h2>Cuerpo</h2></div>
      <div className="bodyGrid">
        <BodyCard title="Referencia" weight={referenceWeight} />
        <BodyCard title="Actual" weight={currentWeight} />
        <BodyCard title="Previsto" weight={predictedWeight} />
      </div>
      <div className="legendRow"><span>Cintura</span><span>Cadera</span><span>Pecho</span><span>Brazo</span><span>Muslo</span></div>
    </section>
  );
}
