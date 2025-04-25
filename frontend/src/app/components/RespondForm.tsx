"use client";

import { useState } from "react";
import { addResponse } from "@/app/api/client";
import { Event } from "@/types/types";

interface RespondFormProps {
  event: Event;
}

const RespondForm: React.FC<RespondFormProps> = ({ event }) => {
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<
    Record<number, "available" | "maybe" | "unavailable">
  >({});
  const [performances, setPerformances] = useState<number[]>([]);
  const [error, setError] = useState("");

  const handleAnswerChange = (
    dateId: number,
    status: "available" | "maybe" | "unavailable"
  ) => {
    setAnswers((prev) => ({ ...prev, [dateId]: status }));
  };

  const handlePerformanceToggle = (performanceId: number) => {
    setPerformances((prev) =>
      prev.includes(performanceId)
        ? prev.filter((id) => id !== performanceId)
        : [...prev, performanceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("名前を入力してください。");
      return;
    }
    if (Object.keys(answers).length === 0) {
      setError("日程の回答を選択してください。");
      return;
    }
    if (Object.keys(answers).length !== event.dates.length) {
      setError("すべての日程に回答してください。");
      return;
    }
    if (performances.length === 0) {
      setError("少なくとも1つのプロジェクトを選択してください。");
      return;
    }
    try {
      await addResponse(event.id, { name, answers, performances });
      alert("回答が送信されました！");
    } catch (err) {
      console.error("Error submitting response:", err);
      setError("回答の送信に失敗しました。");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md"
    >
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-gray-700 font-medium mb-2">名前</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="あなたの名前を入力してください"
          required
        />
      </div>

      <div className="bg-gray-50 p-5 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
          日程の回答
        </h2>
        <div className="space-y-5">
          {event.dates.map((date) => (
            <div key={date.id} className="p-3 bg-white rounded-md shadow-sm">
              <p className="font-medium text-gray-700 mb-3">{date.value}</p>
              <div className="flex space-x-4">
                {[
                  {
                    value: "available",
                    label: "〇",
                    description: "参加可能",
                    color: "green",
                  },
                  {
                    value: "maybe",
                    label: "△",
                    description: "たぶん参加可能",
                    color: "yellow",
                  },
                  {
                    value: "unavailable",
                    label: "×",
                    description: "参加不可",
                    color: "red",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`
                      flex-1 flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer
                      border-2 transition-all duration-200 hover:bg-gray-50
                      ${
                        answers[date.id] === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : "border-gray-200"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={`date-${date.id}`}
                      value={option.value}
                      checked={answers[date.id] === option.value}
                      onChange={() =>
                        handleAnswerChange(
                          date.id,
                          option.value as "available" | "maybe" | "unavailable"
                        )
                      }
                      className="sr-only" // 実際のラジオボタンは非表示
                    />
                    <span
                      className={`
                      text-2xl font-bold mb-1
                      ${
                        option.value === "available"
                          ? "text-green-500"
                          : option.value === "maybe"
                          ? "text-yellow-500"
                          : "text-red-500"
                      }
                    `}
                    >
                      {option.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {option.description}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-5 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
          参加するプロジェクト
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {event.performances.map((performance) => (
            <label
              key={performance.id}
              htmlFor={`performance-${performance.id}`}
              className={`
                flex items-center p-3 rounded-md cursor-pointer transition-all
                ${
                  performances.includes(performance.id)
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-white border-2 border-gray-200 hover:bg-gray-50"
                }
              `}
            >
              <input
                type="checkbox"
                id={`performance-${performance.id}`}
                checked={performances.includes(performance.id)}
                onChange={() => handlePerformanceToggle(performance.id)}
                className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">{performance.title}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors"
      >
        回答を送信する
      </button>
    </form>
  );
};

export default RespondForm;
