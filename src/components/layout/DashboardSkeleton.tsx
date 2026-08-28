import Skeleton from "../ui/Skeleton";

function DashboardSkeleton() {
    return (
        <div className="app-shell">
            <div className="dashboard-loading-shell">
                <div className="card skeleton-stack">
                    <Skeleton width="120px" height="12px" />
                    <Skeleton height="26px" />
                    <Skeleton height="10px" />
                </div>

                <div className="card skeleton-stack">
                    <Skeleton width="90px" height="12px" />
                    <Skeleton height="26px" />
                </div>

                <div className="card skeleton-stack dashboard-loading-shell-wide">
                    <Skeleton width="160px" height="14px" />
                    <Skeleton height="120px" />
                </div>
            </div>
        </div>
    );
}

export default DashboardSkeleton;
