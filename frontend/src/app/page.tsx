"use client";
import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { createEvent } from "./api/client";
import BulkDateAdder from "./components/BulkDateAdder";
import DateTimePicker from "./components/DateTimePicker";

interface PerformanceInput {
  title: string;
  description: string;
}

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dates, setDates] = useState<string[]>([""]);
  const [performances, setPerformances] = useState<PerformanceInput[]>([
    { title: "", description: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // イベントハンドラー関数は変更なし

  const handleAddDate = () => {
    setDates([...dates, ""]);
  };

  const handleRemoveDate = (index: number) => {
    if (dates.length > 1) {
      setDates(dates.filter((_, i) => i !== index));
    }
  };

  const handleDateChange = (index: number, value: string) => {
    const newDates = [...dates];
    newDates[index] = value;
    setDates(newDates);
  };

  // handleAddBulkDates 関数を追加
  const handleAddBulkDates = (newDates: string[]) => {
    setDates([...dates, ...newDates]);
  };

  const handleAddPerformance = () => {
    setPerformances([...performances, { title: "", description: "" }]);
  };

  const handleRemovePerformance = (index: number) => {
    if (performances.length > 1) {
      setPerformances(performances.filter((_, i) => i !== index));
    }
  };

  const handlePerformanceChange = (
    index: number,
    field: keyof PerformanceInput,
    value: string
  ) => {
    const newPerformances = [...performances];
    newPerformances[index] = { ...newPerformances[index], [field]: value };
    setPerformances(newPerformances);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!title.trim()) {
      setError("イベント名を入力してください");
      return;
    }

    if (dates.some((date) => !date.trim())) {
      setError("すべての候補日を入力してください");
      return;
    }

    if (performances.some((perf) => !perf.title.trim())) {
      setError("すべてのプロジェクト名を入力してください");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const event = await createEvent({
        title,
        description,
        dates: dates.filter((date) => date.trim()),
        performances: performances.map((perf) => ({
          title: perf.title,
          description: perf.description,
        })),
      });

      // 成功したらイベントページにリダイレクト
      router.push(`/events/${event.id}`);
    } catch (err) {
      console.error("Error creating event:", err);
      setError("イベントの作成に失敗しました。もう一度お試しください。");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Head>
        <title>プロジェクト・日程調整アプリ</title>
        <meta
          name="description"
          content="プロジェクトごとの日程調整ができるアプリ"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
            プロジェクト・日程調整アプリ
          </h1>
          <p className="text-xl text-gray-600">
            プロジェクトごとの参加者の日程を効率的に調整
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">
            新しい日程調整を作成
          </h2>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6 border-l-4 border-red-500">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                イベント名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                placeholder="例：2025年春公演"
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                説明（任意）
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="イベントの詳細を記入してください"
                rows={3}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            // 候補日程のセクションを更新
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  候補日程 <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddDate}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  候補日を追加
                </button>
              </div>

              <div className="space-y-3">
                {dates.map((date, index) => (
                  <div key={`date-${index}`} className="flex space-x-2">
                    <div className="flex-1">
                      <DateTimePicker
                        value={date}
                        onChange={(value) => handleDateChange(index, value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDate(index)}
                      disabled={dates.length <= 1 || isSubmitting}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-500 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}

                <BulkDateAdder onAdd={handleAddBulkDates} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  プロジェクト <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddPerformance}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  プロジェクトを追加
                </button>
              </div>

              <div className="space-y-4">
                {performances.map((perf, index) => (
                  <div
                    key={`perf-${index}`}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        プロジェクト #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePerformance(index)}
                        disabled={performances.length <= 1 || isSubmitting}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-red-500 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        削除
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={perf.title}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handlePerformanceChange(
                            index,
                            "title",
                            e.target.value
                          )
                        }
                        placeholder="プロジェクト名"
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                      <input
                        type="text"
                        value={perf.description}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handlePerformanceChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="プロジェクトの説明（任意）"
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full md:w-auto px-6 py-3 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    作成中...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
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
                    日程調整を作成
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 機能説明セクション */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full inline-block mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">複数日程の調整</h3>
            <p className="text-gray-600">
              プロジェクトの候補日を複数設定して、参加者の都合を一括で調整できます。
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="bg-green-100 text-green-600 p-3 rounded-full inline-block mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">プロジェクト別管理</h3>
            <p className="text-gray-600">
              参加者ごとに異なるプロジェクトの組み合わせを柔軟に管理できます。
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="bg-purple-100 text-purple-600 p-3 rounded-full inline-block mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">最適スケジュール提案</h3>
            <p className="text-gray-600">
              競合を最小限に抑えた最適なスケジュール案を自動で提案します。
            </p>
          </div>
        </div>

        {/* フッター */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2025 プロジェクト・日程調整アプリ All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
