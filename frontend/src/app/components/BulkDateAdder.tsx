"use client";

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays } from "date-fns";

interface BulkDateAdderProps {
  onAdd: (dates: string[]) => void;
}

const BulkDateAdder: React.FC<BulkDateAdderProps> = ({ onAdd }) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [days, setDays] = useState(3);
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddBulk = () => {
    if (!startDate) return;

    const newDates = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i);
      const formattedDate = format(date, "yyyy-MM-dd");
      newDates.push(`${formattedDate} ${startTime}-${endTime}`);
    }

    onAdd(newDates);
    setIsOpen(false);
  };

  // 時間選択用のオプション生成
  const timeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-blue-500 text-sm flex items-center mt-2 hover:text-blue-700"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        複数日程を一括追加
      </button>

      {isOpen && (
        <div className="mt-3 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h4 className="font-medium text-gray-700 mb-3">連続した日程を追加</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">開始日</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="開始日を選択"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">日数</label>
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {[1, 2, 3, 4, 5, 6, 7, 14].map((value) => (
                  <option key={value} value={value}>
                    {value}日間
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                開始時間
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {timeOptions().map((time) => (
                  <option key={`start-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                終了時間
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {timeOptions().map((time) => (
                  <option key={`end-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-gray-600 mr-2 border border-gray-300 rounded-md"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleAddBulk}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={!startDate}
            >
              追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkDateAdder;
