import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { TShirtSizeType } from "@shared/schema";

export default function EstimationStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/stats'],
  });

  const sizeDistributionColors = {
    XS: "bg-primary-300",
    S: "bg-primary-400",
    M: "bg-primary-500",
    L: "bg-primary-600",
    XL: "bg-primary-700",
    XXL: "bg-primary-800",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
      <h2 className="text-xl font-semibold mb-4 text-slate-900">Estimation Dashboard</h2>
      
      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
            <div className="text-sm font-medium text-primary-600 mb-1">Tasks Estimated</div>
            <div className="text-2xl font-semibold text-slate-900">{stats?.totalTasks || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Last 30 days</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-sm font-medium text-slate-600 mb-1">Avg. Story Points</div>
            <div className="text-2xl font-semibold text-slate-900">{stats?.averagePoints || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Per task</div>
          </div>
        </div>
      )}
      
      {/* Distribution Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Size Distribution</h3>
        
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-2 flex-grow mx-2" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(stats?.sizeDistribution || {}).map(([size, percentage]) => (
              <div key={size} className="flex items-center">
                <span className="text-xs font-medium w-8 text-slate-500">{size}</span>
                <div className="flex-grow bg-slate-100 rounded-full h-2">
                  <div 
                    className={`${sizeDistributionColors[size as TShirtSizeType]} h-2 rounded-full`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium w-8 text-right text-slate-500">{percentage}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Accuracy Metrics */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">Prediction Accuracy</h3>
        
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">Overall Accuracy</span>
              <span className="text-sm font-medium text-slate-900">{stats?.predictionAccuracy || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
              <div 
                className="bg-green-500 rounded-full h-2" 
                style={{ width: `${stats?.predictionAccuracy || 0}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-500">
              Based on team feedback for {stats?.totalTasks || 0} estimated tasks
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
