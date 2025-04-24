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
    //e.preventDefault();
    try {
      await addResponse(event.id, { name, answers, performances });
      alert("回答が送信されました！");
    } catch (err) {
      console.error("Error submitting response:", err);
      setError("回答の送信に失敗しました。");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-500">{error}</p>}

      <div>
        <label className="block font-medium mb-2">名前</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">日程の回答</h2>
        {event.dates.map((date) => (
          <div key={date.id} className="mb-2">
            <p>{date.value}</p>
            <div className="flex space-x-4">
              {["available", "maybe", "unavailable"].map((status) => (
                <label key={status} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`date-${date.id}`}
                    value={status}
                    checked={answers[date.id] === status}
                    onChange={() =>
                      handleAnswerChange(
                        date.id,
                        status as "available" | "maybe" | "unavailable"
                      )
                    }
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">参加するパフォーマンス</h2>
        {event.performances.map((performance) => (
          <div key={performance.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`performance-${performance.id}`}
              checked={performances.includes(performance.id)}
              onChange={() => handlePerformanceToggle(performance.id)}
            />
            <label htmlFor={`performance-${performance.id}`}>
              {performance.title}
            </label>
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        回答を送信
      </button>
    </form>
  );
};

export default RespondForm;
