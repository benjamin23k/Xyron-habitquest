import { ClipboardText } from "@phosphor-icons/react";
import { useDashboardContext } from "../hooks/useDashboardContext";
import MissionCard from "../components/missions/MissionCard";
import CustomMissionForm from "../components/missions/CustomMissionForm";
import EmptyState from "../components/ui/EmptyState";

function MissionsPage() {
    const {
        dailyQuests,
        customQuests,
        isCompletedToday,
        completeMission,
        addCustomMission,
        removeCustomMission,
        displayStats
    } = useDashboardContext();

    return (
        <div className="page-stack">
            <section className="animate-in">
                <h1>Misiones diarias</h1>
                <p className="text-muted">Se reinician automáticamente cada día.</p>

                <ul className="mission-grid">
                    {dailyQuests.map((quest) => (
                        <MissionCard
                            key={quest.id}
                            quest={quest}
                            kind="daily"
                            isCompleted={isCompletedToday(quest.id)}
                            onComplete={completeMission}
                        />
                    ))}
                </ul>
            </section>

            <section className="animate-in">
                <h2>Misiones personalizadas</h2>

                {customQuests.length > 0 ? (
                    <ul className="mission-grid">
                        {customQuests.map((quest) => (
                            <MissionCard
                                key={quest.id}
                                quest={quest}
                                kind="custom"
                                isCompleted={isCompletedToday(quest.id)}
                                onComplete={completeMission}
                                onRemove={removeCustomMission}
                            />
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={ClipboardText}
                        title="Tu tablero de misiones está vacío"
                        description="Creá tu primera misión personalizada y sumala a tu progreso diario."
                    />
                )}

                <CustomMissionForm
                    availableStats={displayStats.map((stat) => stat.name)}
                    onAdd={addCustomMission}
                />
            </section>
        </div>
    );
}

export default MissionsPage;
