interface BarChartProps {
    data: { label: string; value: number }[];
}

function BarChart({ data }: BarChartProps) {
    const maxValue = Math.max(1, ...data.map((item) => item.value));

    return (
        <div className="bar-chart">
            {data.map((item, index) => (
                <div key={index} className="bar-chart-column">
                    <div className="bar-chart-track">
                        <div className="bar-chart-fill" style={{ height: `${Math.round((item.value / maxValue) * 100)}%` }} />
                    </div>
                    <span className="bar-chart-label">{item.label}</span>
                    <span className="bar-chart-value">{item.value}</span>
                </div>
            ))}
        </div>
    );
}

export default BarChart;
