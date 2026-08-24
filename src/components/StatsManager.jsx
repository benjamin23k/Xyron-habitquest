import { useState } from "react";

function StatsManager({ stats, setStats }) {

    const [showForm, setShowForm] = useState(false);

    const [name, setName] = useState("");
    const [value, setValue] = useState(1);

    function addStat(event) {
        event.preventDefault();

        if (!name.trim()) {
            return;
        }

        const newStat = {
            name: name,
            value: Number(value),
            maxValue: 10
        };

        setStats([
            ...stats,
            newStat
        ]);

        setName("");
        setValue(1);
        setShowForm(false);
    }

    return (
        <div className="stats-manager">

            <button
                onClick={() => setShowForm(!showForm)}
            >
                + Nueva estadística
            </button>

            {showForm && (
                <form onSubmit={addStat}>

                    <div>
                        <label>
                            Nombre
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            placeholder="Ej: Programación"
                        />
                    </div>

                    <div>
                        <label>
                            Valor inicial
                        </label>

                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={value}
                            onChange={(event) =>
                                setValue(event.target.value)
                            }
                        />
                    </div>

                    <button type="submit">
                        Crear
                    </button>

                </form>
            )}

        </div>
    );
}

export default StatsManager;