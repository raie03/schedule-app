"use client";
import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
import Head from "next/head";
import Link from "next/link";
import { getEvent, getResponses } from "../../api/client";
import { Event, Response } from "../../../types/types";
import EventResults from "@/app/components/EventResults";
import RespondForm from "@/app/components/RespondForm";
import OptimalSchedule from "@/app/components/OptimalSchedule";
import { useParams } from "next/navigation";

const EventPage = () => {
  // const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRespondForm, setShowRespondForm] = useState(false);
  const [showOptimalSchedule, setShowOptimalSchedule] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const data = await getEvent(id as string);
      const responseData = await getResponses(id);
      setEvent(data);
      setResponses(responseData);
      setError("");
    } catch (err) {
      console.error("Error fetching event:", err);
      setError("イベントの取得に失敗しました。");
      setEvent(null);
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const url = `${process.env.NEXT_FRONTEND_URL}/events/${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy URL:", err);
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <p className="text-red-500 mb-4 font-medium">
            {error || "イベントが見つかりませんでした。"}
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            トップページに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <Head>
        <title>{event.title} | 日程調整アプリ</title>
        <meta name="description" content={`${event.title}の日程調整ページ`} />
      </Head>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* イベントヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            {event.title}
          </h1>
          {event.description && (
            <p className="text-gray-600 mb-2">{event.description}</p>
          )}

          {/* 日付情報 */}
          <div className="mt-4 text-sm text-gray-500">
            <p>
              作成日: {new Date(event.created_at).toLocaleDateString("ja-JP")}
            </p>
            <p>
              {event.dates?.length || 0}件の候補日程 • {responses.length}
              件の回答
            </p>
          </div>
        </div>

        {/* URL共有セクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            日程調整の共有
          </h2>
          <p className="text-gray-600 mb-4">
            以下のURLを共有して回答を集めましょう：
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={
                typeof window !== "undefined"
                  ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/events/${id}`
                  : ""
              }
              readOnly
              className="flex-1 min-w-0 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm"
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 py-3 rounded-md transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                copied
                  ? "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
                  : "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500"
              }`}
            >
              <div className="flex items-center">
                {copied ? (
                  <>
                    <svg
                      className="w-5 h-5 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    コピー完了！
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      />
                    </svg>
                    URLをコピー
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* イベント結果表示 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">回答状況</h2>
          <div className="overflow-x-auto">
            <EventResults event={event} responses={responses} />
          </div>
        </div>

        {/* アクションボタンエリア */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 回答ボタン */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              回答する
            </h2>
            <p className="text-gray-600 mb-4">
              あなたの参加可能な日程を入力してください。
            </p>
            <button
              onClick={() => setShowRespondForm(!showRespondForm)}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={showRespondForm ? "M19 9l-7 7-7-7" : "M12 4v16m8-8H4"}
                />
              </svg>
              {showRespondForm ? "回答を閉じる" : "回答フォームを表示"}
            </button>
          </div>

          {/* 最適スケジュールボタン */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              最適スケジュール
            </h2>
            <p className="text-gray-600 mb-4">
              最適なスケジュール案を提案します。
            </p>
            <button
              onClick={() => setShowOptimalSchedule(!showOptimalSchedule)}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-md hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    showOptimalSchedule
                      ? "M19 9l-7 7-7-7"
                      : "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  }
                />
              </svg>
              {showOptimalSchedule
                ? "最適スケジュールを隠す"
                : "最適スケジュールを表示"}
            </button>
          </div>
        </div>

        {/* 回答フォーム - 表示/非表示切り替え */}
        {showRespondForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              回答フォーム
            </h2>
            <RespondForm event={event} />
          </div>
        )}

        {/* 最適スケジュール - 表示/非表示切り替え */}
        {showOptimalSchedule && event && (
          <div className="animate-fadeIn">
            <OptimalSchedule eventId={id} event={event} />
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="mt-12 pt-8 pb-4 text-center text-gray-500 text-sm">
        <p>© 2025 日程調整アプリ All rights reserved.</p>
      </footer>
    </div>
  );
};

export default EventPage;
