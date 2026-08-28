import { useDashboardContext } from "../hooks/useDashboardContext";
import SkillNode from "../components/skills/SkillNode";
import CharacterBuild from "../components/skills/CharacterBuild";
import type { SkillRow } from "../services/skillService";

function groupByCategory(skills: SkillRow[]): Map<string, SkillRow[]> {
    const groups = new Map<string, SkillRow[]>();

    for (const skill of skills) {
        const list = groups.get(skill.category) ?? [];
        list.push(skill);
        groups.set(skill.category, list);
    }

    for (const list of groups.values()) {
        list.sort((a, b) => a.cost - b.cost);
    }

    return groups;
}

function SkillTreePage() {
    const { skills, unlockedSkillIds, skillPointsAvailable, unlockSkill, progression, displayStats } =
        useDashboardContext();

    const branches = groupByCategory(skills);

    function lockedReasonFor(skill: SkillRow): string | null {
        if (progression.level < skill.min_level) {
            return `Requiere nivel ${skill.min_level}`;
        }

        if (skill.requires_skill_id && !unlockedSkillIds.has(skill.requires_skill_id)) {
            const prerequisite = skills.find((item) => item.id === skill.requires_skill_id);
            return prerequisite ? `Requiere "${prerequisite.name}"` : "Requiere otra skill primero";
        }

        if (skillPointsAvailable < skill.cost) {
            return "No tenés suficientes puntos";
        }

        return null;
    }

    return (
        <div className="page-stack">
            <section className="animate-in">
                <h1>Skill Tree</h1>
                <p className="text-muted">Cada nivel te da 1 punto de habilidad para invertir donde quieras.</p>
                <span className="skill-points-badge">{skillPointsAvailable} puntos disponibles</span>
            </section>

            <CharacterBuild stats={displayStats} />

            {Array.from(branches.entries()).map(([category, categorySkills]) => (
                <section key={category} className="card skill-branch animate-in">
                    <h2>{category}</h2>
                    <div className="skill-branch-chain">
                        {categorySkills.map((skill) => (
                            <SkillNode
                                key={skill.id}
                                skill={skill}
                                isUnlocked={unlockedSkillIds.has(skill.id)}
                                lockedReason={unlockedSkillIds.has(skill.id) ? null : lockedReasonFor(skill)}
                                onUnlock={unlockSkill}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

export default SkillTreePage;
