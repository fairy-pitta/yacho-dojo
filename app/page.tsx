"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface QuizResult {
  id: number;
  score: number;
  total_questions: number;
  created_at: string;
}

interface UserStats {
  totalQuizzes: number;
  averageScore: number;
  totalStudyTime: number;
  correctAnswers: number;
  totalAnswers: number;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [recentResults, setRecentResults] = useState<QuizResult[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await loadUserData(user.id);
      }
      setLoading(false);
    }

    getUser();
  }, []);

  async function loadUserData(userId: string) {
    try {
      // 最近のクイズ結果を取得
      const { data: results } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (results) {
        setRecentResults(results);
        
        // 統計を計算
        const stats: UserStats = {
          totalQuizzes: results.length,
          averageScore: results.length > 0 ? 
            Math.round(results.reduce((sum, r) => sum + (r.score / r.total_questions * 100), 0) / results.length) : 0,
          totalStudyTime: results.length * 10, // 仮の値（10分/クイズ）
          correctAnswers: results.reduce((sum, r) => sum + r.score, 0),
          totalAnswers: results.reduce((sum, r) => sum + r.total_questions, 0),
        };
        setUserStats(stats);
      }
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    }
  }

  const handleStartQuiz = () => {
    router.push('/quiz');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="読み込み中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main role="main" className="flex-1 container mx-auto px-4 py-8">
        {/* ヘッダーセクション */}
        <div className="bg-white border rounded-lg p-6 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              野鳥識別士道場
            </h1>
            <p className="text-gray-600 mb-6">
              野鳥識別士試験の合格を目指して学習しましょう
            </p>
            
            {user ? (
              <div className="space-y-4">
                <div className="bg-theme-50 border border-theme-200 rounded-lg p-4 inline-block">
                  <p className="text-theme-800 font-medium">ようこそ、{user.email}さん</p>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleStartQuiz}
                  className="bg-theme-600 hover:bg-theme-700 text-white px-8 py-3"
                >
                  クイズを始める
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">学習を始めるにはログインしてください</p>
                <div className="space-x-4">
                  <Link href="/auth/login">
                    <Button size="lg" className="bg-theme-600 hover:bg-theme-700 text-white">ログイン</Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button variant="outline" size="lg" className="border-theme-600 text-theme-600 hover:bg-theme-50">新規登録</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ダッシュボードグリッド */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" data-testid="dashboard-grid">
            {/* 学習メニュー */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2">学習メニュー</h2>
              <div className="space-y-3">
                <Link href="/quiz" className="block">
                  <Button className="w-full justify-start h-10 text-left bg-theme-50 hover:bg-theme-100 text-theme-700 border-theme-200" variant="outline">
                    問題演習
                  </Button>
                </Link>
                <Link href="/study" className="block">
                  <Button className="w-full justify-start h-10 text-left bg-theme-50 hover:bg-theme-100 text-theme-700 border-theme-200" variant="outline">
                    学習資料
                  </Button>
                </Link>
                <Link href="/results" className="block">
                  <Button className="w-full justify-start h-10 text-left bg-theme-50 hover:bg-theme-100 text-theme-700 border-theme-200" variant="outline">
                    成績確認
                  </Button>
                </Link>
              </div>
            </div>

            {/* 学習進捗 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2">学習進捗</h2>
              {userStats ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-theme-50 rounded">
                    <span className="text-gray-700">総学習時間</span>
                    <span className="font-semibold text-theme-600">{userStats.totalStudyTime}分</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-theme-50 rounded">
                    <span className="text-gray-700">正答率</span>
                    <span className="font-semibold text-theme-600">
                      {userStats.totalAnswers > 0 ? 
                        Math.round((userStats.correctAnswers / userStats.totalAnswers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-theme-50 rounded">
                    <span className="text-gray-700">平均スコア</span>
                    <span className="font-semibold text-theme-600">{userStats.averageScore}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-theme-50 rounded">
                    <span className="text-gray-700">クイズ回数</span>
                    <span className="font-semibold text-theme-600">{userStats.totalQuizzes}回</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">まだ学習データがありません</p>
              )}
            </div>

            {/* 最近の成績 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-2">最近の成績</h2>
              {recentResults.length > 0 ? (
                <div className="space-y-3">
                  {recentResults.slice(0, 3).map((result) => (
                    <div key={result.id} className="flex justify-between items-center py-2 px-3 bg-theme-50 rounded border-l-4 border-theme-500">
                      <span className="text-sm text-gray-600">
                        {new Date(result.created_at).toLocaleDateString()}
                      </span>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">
                          {result.score}/{result.total_questions}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({Math.round((result.score / result.total_questions) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">まだクイズを受けていません</p>
              )}
            </div>
          </div>
        )}


      </main>

      <Footer />
    </div>
  );
}
