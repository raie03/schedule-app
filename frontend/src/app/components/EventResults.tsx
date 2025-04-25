import React from "react";
import { Event, Response, ResponseAnswer } from "../../types/types";

interface EventResultsProps {
  event: Event;
  responses: Response[];
}

const EventResults: React.FC<EventResultsProps> = ({ event, responses }) => {
  // 回答状況を色とテキストで表示するヘルパー関数
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              ></path>
            </svg>
            参加可能
          </span>
        );
      case "maybe":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              ></path>
            </svg>
            たぶん
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              ></path>
            </svg>
            参加不可
          </span>
        );
    }
  };

  // ユーザーごとの参加可能日数を計算
  const getUserAvailability = (answers: ResponseAnswer[]) => {
    return answers.reduce(
      (acc, answer) => {
        if (answer.status === "available") acc.available++;
        else if (answer.status === "maybe") acc.maybe++;
        else acc.unavailable++;
        return acc;
      },
      { available: 0, maybe: 0, unavailable: 0 }
    );
  };

  return (
    <div className="overflow-hidden">
      {/* イベント情報ヘッダー（既に上部に表示されていると仮定して省略） */}

      {/* 日程×参加者マトリクス */}
      <div className="mb-8 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                参加者 / 日程
              </th>
              {event.dates.map((date) => (
                <th
                  key={date.id}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {date.value}
                </th>
              ))}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                参加プロジェクト
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {responses.length > 0 ? (
              responses.map((response) => {
                const availability = getUserAvailability(response.answers);

                return (
                  <tr key={response.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {response.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            参加可能: {availability.available} • たぶん:{" "}
                            {availability.maybe} • 不可:{" "}
                            {availability.unavailable}
                          </div>
                        </div>
                      </div>
                    </td>

                    {response.answers.map((answer) => (
                      <td key={answer.id} className="px-4 py-4">
                        {getStatusDisplay(answer.status)}
                      </td>
                    ))}

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {response.performances.map((performance) => {
                          const perfTitle =
                            event.performances.find(
                              (perf) => perf.id === performance.performance_id
                            )?.title || "不明";

                          return (
                            <span
                              key={performance.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {perfTitle}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={event.dates.length + 2}
                  className="px-6 py-8 text-center text-gray-500 whitespace-nowrap"
                >
                  まだ回答がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* パフォーマンス情報 */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          プロジェクト別の参加者
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {event.performances.map((performance) => {
            // パフォーマンスごとの参加者を取得
            const participants = responses.filter((response) =>
              response.performances.some(
                (perf) => perf.performance_id === performance.id
              )
            );

            return (
              <div
                key={performance.id}
                className="bg-white p-4 rounded-lg border border-gray-200"
              >
                <h3 className="font-semibold text-gray-800 mb-2">
                  {performance.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {performance.description || "説明なし"}
                </p>

                <div className="mt-2">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                    参加者 ({participants.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {participants.length > 0 ? (
                      participants.map((participant) => (
                        <span
                          key={participant.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {participant.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">参加者なし</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 日程別の使用状況サマリー */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          日程別の参加可能人数
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {event.dates.map((date) => {
            // 各日程について参加可能・たぶん・不可の数をカウント
            const dateStats = responses.reduce(
              (acc, response) => {
                const answer = response.answers.find(
                  (a) => a.date_id === date.id
                );
                if (answer) {
                  if (answer.status === "available") acc.available++;
                  else if (answer.status === "maybe") acc.maybe++;
                  else acc.unavailable++;
                }
                return acc;
              },
              { available: 0, maybe: 0, unavailable: 0 }
            );

            // 参加可能率の計算
            const total =
              dateStats.available + dateStats.maybe + dateStats.unavailable;
            const availablePercent =
              total > 0 ? Math.round((dateStats.available / total) * 100) : 0;

            return (
              <div
                key={date.id}
                className="bg-white p-4 rounded-lg border border-gray-200"
              >
                <h3 className="font-medium text-gray-800 mb-2">{date.value}</h3>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: `${availablePercent}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-700">
                  <span>
                    参加可能: <strong>{dateStats.available}</strong>
                  </span>
                  <span>
                    たぶん: <strong>{dateStats.maybe}</strong>
                  </span>
                  <span>
                    不可: <strong>{dateStats.unavailable}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EventResults;
