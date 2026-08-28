import { useState } from "react";
import { useDashboardContext } from "../hooks/useDashboardContext";
import AttributeCard from "../components/attributes/AttributeCard";
import AttributeFormModal from "../components/AttributeFormModal";
import ConfirmModal from "../components/ConfirmModal";
import Button from "../components/ui/Button";
import type { StatRow } from "../services/profileService";

const MAX_RADAR_ATTRIBUTES = 8;

function AttributesPage() {
    const { stats, weeklyGains, addStat, editStat, removeStat } = useDashboardContext();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingStat, setEditingStat] = useState<StatRow | null>(null);
    const [deletingStat, setDeletingStat] = useState<StatRow | null>(null);

    const radarCount = stats.filter((stat) => stat.in_radar).length;

    async function handleToggleRadar(stat: StatRow) {
        if (!stat.in_radar && radarCount >= MAX_RADAR_ATTRIBUTES) {
            return;
        }

        await editStat(stat.id, { in_radar: !stat.in_radar });
    }

    return (
        <div className="page-stack">
            <div className="section-header animate-in">
                <div>
                    <h1>Mis atributos</h1>
                    <p className="text-muted">
                        En el radar: {radarCount}/{MAX_RADAR_ATTRIBUTES}
                    </p>
                </div>
                <Button type="button" variant="primary" onClick={() => setShowCreateModal(true)}>
                    + Nuevo atributo
                </Button>
            </div>

            <div className="attribute-grid">
                {stats.map((stat) => (
                    <AttributeCard
                        key={stat.id}
                        stat={stat}
                        weeklyGain={weeklyGains[stat.name] ?? 0}
                        radarDisabled={radarCount >= MAX_RADAR_ATTRIBUTES}
                        onToggleRadar={() => handleToggleRadar(stat)}
                        onEdit={() => setEditingStat(stat)}
                        onDelete={() => setDeletingStat(stat)}
                    />
                ))}
            </div>

            {showCreateModal && (
                <AttributeFormModal
                    title="Nuevo atributo"
                    submitLabel="Crear atributo"
                    onSubmit={addStat}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {editingStat && (
                <AttributeFormModal
                    title={`Editar ${editingStat.name}`}
                    submitLabel="Guardar cambios"
                    initialValues={{
                        name: editingStat.name,
                        description: editingStat.description ?? "",
                        icon: editingStat.icon,
                        maxValue: editingStat.max_value
                    }}
                    onSubmit={(values) =>
                        editStat(editingStat.id, {
                            name: values.name,
                            description: values.description || null,
                            icon: values.icon,
                            max_value: values.maxValue
                        })
                    }
                    onClose={() => setEditingStat(null)}
                />
            )}

            {deletingStat && (
                <ConfirmModal
                    title={`¿Eliminar ${deletingStat.name}?`}
                    description="Se perderá el progreso almacenado de este atributo."
                    confirmLabel="Eliminar"
                    onConfirm={() => removeStat(deletingStat.id)}
                    onClose={() => setDeletingStat(null)}
                />
            )}
        </div>
    );
}

export default AttributesPage;
