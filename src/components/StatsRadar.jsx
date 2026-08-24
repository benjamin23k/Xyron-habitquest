function StatsRadar({ stats }) {
    const size = 500;
    const center = size / 2;
    const radius = 150;
    const labelRadius = 200;

    const angleStep = (Math.PI * 2) / stats.length;

    function getCoordinates(value, index, maxValue = 10, distance = radius) {
        const angle = index * angleStep - Math.PI / 2;

        const currentRadius = (value / maxValue) * distance;

        const x = center + Math.cos(angle) * currentRadius;
        const y = center + Math.sin(angle) * currentRadius;

        return { x, y };
    }

    const backgroundPoints = stats
        .map((_, index) => {
            const { x, y } = getCoordinates(10, index);
            return `${x},${y}`;
        })
        .join(" ");

    const statPoints = stats
        .map((stat, index) => {
            const { x, y } = getCoordinates(
                stat.value,
                index,
                stat.maxValue
            );

            return `${x},${y}`;
        })
        .join(" ");

    return (
        <div className="stats-radar">

            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
            >

                {/* Líneas desde el centro */}
                {stats.map((stat, index) => {
                    const { x, y } = getCoordinates(10, index);

                    return (
                        <line
                            key={stat.name}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            stroke="#333"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Forma exterior */}
                <polygon
                    points={backgroundPoints}
                    fill="rgba(255,255,255,0.02)"
                    stroke="#444"
                    strokeWidth="2"
                />

                {/* Forma de estadísticas */}
                <polygon
                    points={statPoints}
                    fill="rgba(155,92,255,0.25)"
                    stroke="#9b5cff"
                    strokeWidth="3"
                />

                {/* Puntos */}
                {stats.map((stat, index) => {
                    const { x, y } = getCoordinates(
                        stat.value,
                        index,
                        stat.maxValue
                    );

                    return (
                        <circle
                            key={stat.name}
                            cx={x}
                            cy={y}
                            r="5"
                            fill="#9b5cff"
                        />
                    );
                })}

                {/* Nombres */}
                {stats.map((stat, index) => {
                    const { x, y } = getCoordinates(
                        10,
                        index,
                        10,
                        labelRadius
                    );

                    let textAnchor = "middle";

                    if (x < center - 20) {
                        textAnchor = "end";
                    }

                    if (x > center + 20) {
                        textAnchor = "start";
                    }

                    return (
                        <text
                            key={stat.name}
                            x={x}
                            y={y}
                            textAnchor={textAnchor}
                            dominantBaseline="middle"
                            fill="#ffffff"
                            fontSize="14"
                            fontWeight="600"
                        >
                            {stat.name}
                        </text>
                    );
                })}

                {/* Valor central */}
                <text
                    x={center}
                    y={center}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize="18"
                    fontWeight="700"
                >
                    
                </text>

            </svg>

        </div>
    );
}

export default StatsRadar;