"use client";

import React, { useState, useEffect } from "react";
import { suggestOptimalMultiSchedule } from "@/app/api/client";
import { PerformanceScore, Event } from "@/types/types";

interface OptimalScheduleProps {
  eventId: string;
  event: Event;
}

const OptimalSchedule: React.FC<OptimalScheduleProps> = ({ eventId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [schedule, setSchedule] = useState<PerformanceScore[]>([]);
  // const [metrics, setMetrics] = useState<ScheduleMetrics | null>(null);

  useEffect(() => {
    const fetchOptimalSchedule = async () => {
      try {
        setLoading(true);
        const result = await suggestOptimalMultiSchedule(eventId);
        console.log("Optimal schedule response:", result); // デバッグ用
        setSchedule(result.suggested_schedule || []);
        // setMetrics(result.metrics || null);
        setError("");
      } catch (err) {
        console.error("Error fetching optimal schedule:", err);
        setError("最適なスケジュールの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchOptimalSchedule();
  }, [eventId]);

  if (loading) {
    return (
      <div className="text-center py-4">最適なスケジュールを計算中...</div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // 日付ごとにパフォーマンスをグループ化
  const scheduleByDate = schedule.reduce((acc, item) => {
    console.log("Item:", item); // デバッグ用
    if (!acc[item.date_id]) {
      acc[item.date_id] = [];
    }
    acc[item.date_id].push(item);
    return acc;
  }, {} as Record<number, PerformanceScore[]>);

  //   console.log(schedule);
  //   console.log(scheduleByDate);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">最適なスケジュール提案</h2>

      {/* パフォーマンスメトリクス
      {metrics && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-semibold mb-2">スケジュールの品質</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            <div className="bg-blue-50 p-2 rounded">
              <span className="font-medium">スコア: </span>
              {metrics.total_weighted_score !== undefined
                ? metrics.total_weighted_score.toFixed(2)
                : "N/A"}
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <span className="font-medium">コンフリクト: </span>
              {metrics.total_conflicts ?? "N/A"}
            </div>
            <div className="bg-green-50 p-2 rounded">
              <span className="font-medium">参加可能者数: </span>
              {metrics.total_available ?? "N/A"}
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <span className="font-medium">計算時間: </span>
              {metrics.computation_time_ms !== undefined
                ? `${metrics.computation_time_ms.toFixed(2)}ms`
                : "N/A"}
            </div>
          </div>
        </div>
      )} */}

      {/* スケジュールテーブル */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">日付</th>
              <th className="py-2 px-4 text-left">プロジェクト</th>
              <th className="py-2 px-4 text-left">可能</th>
              <th className="py-2 px-4 text-left">たぶん</th>
              <th className="py-2 px-4 text-left">不可</th>
              <th className="py-2 px-4 text-left">コンフリクト</th>
              {/* <th className="py-2 px-4 text-left">スコア</th> */}
            </tr>
          </thead>
          <tbody>
            {Object.entries(scheduleByDate).length > 0 ? (
              Object.values(scheduleByDate).map((performances) =>
                performances.map((perf, idx) => (
                  <tr
                    key={`${perf.date_id}-${perf.performance_id}`}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="py-2 px-4">
                      {idx === 0 && (
                        <strong>
                          {perf.date_value || `日付ID: ${perf.date_id}`}
                        </strong>
                      )}
                    </td>
                    <td className="py-2 px-4 font-medium">
                      {perf.performance_name ||
                        `プロジェクトID: ${perf.performance_id}`}
                    </td>
                    <td className="py-2 px-4 text-green-600">
                      {perf.available_count || 0}
                    </td>
                    <td className="py-2 px-4 text-yellow-600">
                      {perf.maybe_count ?? 0}
                    </td>
                    <td className="py-2 px-4 text-gray-600">
                      {perf.unavailable_count ?? 0}
                    </td>
                    <td className="py-2 px-4 text-red-600">
                      {perf.conflict_count || 0}
                    </td>
                    {/* <td className="py-2 px-4 text-blue-600">
                      {perf.weighted_score !== undefined
                        ? perf.weighted_score.toFixed(2)
                        : "N/A"}
                    </td> */}
                  </tr>
                ))
              )
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  データがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* コンフリクト詳細 */}
      {schedule.some((item) => (item.conflict_count || 0) > 0) && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">コンフリクト詳細</h3>
          <div className="space-y-2">
            {schedule
              .filter((item) => (item.conflict_count || 0) > 0)
              .map((item) => (
                <div
                  key={`conflict-${item.date_id}-${item.performance_id}`}
                  className="p-3 bg-red-50 rounded-md"
                >
                  <p className="font-medium">
                    {item.date_value || `日付ID: ${item.date_id}`} -{" "}
                    {item.performance_name ||
                      `プロジェクトID: ${item.performance_id}`}
                  </p>
                  <p className="text-sm text-gray-700">
                    コンフリクトユーザー:{" "}
                    {Array.isArray(item.conflicting_users)
                      ? item.conflicting_users.join(", ")
                      : "不明"}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimalSchedule;
