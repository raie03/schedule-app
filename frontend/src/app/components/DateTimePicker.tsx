"use client";

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  // 初期値の解析
  const parseInitialValue = (): {
    date: Date | null;
    startTime: string;
    endTime: string;
  } => {
    if (!value) {
      return { date: null, startTime: "09:00", endTime: "11:00" };
    }

    try {
      // "2025-04-15 15:00-17:00" 形式を解析
      const [datePart, timePart] = value.split(" ");
      const [startTime, endTime] = timePart.split("-");

      const [year, month, day] = datePart.split("-").map(Number);
      const date = new Date(year, month - 1, day);

      return {
        date,
        startTime: startTime || "09:00",
        endTime: endTime || "11:00",
      };
    } catch (e) {
      return { date: null, startTime: "09:00", endTime: "11:00" };
    }
  };

  const { date, startTime, endTime } = parseInitialValue();
  const [selectedDate, setSelectedDate] = useState<Date | null>(date);
  const [selectedStartTime, setSelectedStartTime] = useState(startTime);
  const [selectedEndTime, setSelectedEndTime] = useState(endTime);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    updateValue(date, selectedStartTime, selectedEndTime);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStartTime(e.target.value);
    updateValue(selectedDate, e.target.value, selectedEndTime);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEndTime(e.target.value);
    updateValue(selectedDate, selectedStartTime, e.target.value);
  };

  const updateValue = (
    date: Date | null,
    startTime: string,
    endTime: string
  ) => {
    if (!date) return;

    const formattedDate = format(date, "yyyy-MM-dd");
    const formattedValue = `${formattedDate} ${startTime}-${endTime}`;
    onChange(formattedValue);
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
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="w-full sm:w-1/2">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          locale={ja}
          dateFormat="yyyy-MM-dd"
          placeholderText="日付を選択"
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>
      <div className="flex gap-2 items-center w-full sm:w-1/2">
        <select
          value={selectedStartTime}
          onChange={handleStartTimeChange}
          disabled={disabled}
          className="w-1/2 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        >
          {timeOptions().map((time) => (
            <option key={`start-${time}`} value={time}>
              {time}
            </option>
          ))}
        </select>
        <span className="mx-1">-</span>
        <select
          value={selectedEndTime}
          onChange={handleEndTimeChange}
          disabled={disabled}
          className="w-1/2 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        >
          {timeOptions().map((time) => (
            <option key={`end-${time}`} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DateTimePicker;
