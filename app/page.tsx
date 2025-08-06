"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Play, Trophy } from "lucide-react";

interface QuizResult {
  id: number;
  score: number;
  total_questions: number;
  created_at: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [recentResults, setRecentResults] = useState<QuizResult[]>([]);
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
        .limit(3);

      if (results) {
        setRecentResults(results);
      }
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="読み込み中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main role="main" className="flex-1">
        {/* メインコンテンツ */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              野鳥識別士道場
            </h1>
            <p className="text-gray-600">
              野鳥識別士試験の過去問演習サイト
            </p>
          </div>
          
          {user ? (
            <div className="space-y-8">
              {/* メインメニュー */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <Link href="/quiz" className="block">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary hover:shadow-md transition-all text-center">
                    <Play className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">問題演習</h3>
                    <p className="text-sm text-gray-600">過去問に挑戦する</p>
                  </div>
                </Link>
                
                <Link href="/results" className="block">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary hover:shadow-md transition-all text-center">
                    <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">成績確認</h3>
                    <p className="text-sm text-gray-600">学習の成果を確認</p>
                  </div>
                </Link>
              </div>

              
              {/* 最近の成績 */}
              {recentResults.length > 0 && (
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">最近の成績</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="space-y-2">
                      {recentResults.map((result) => {
                        const percentage = Math.round((result.score / result.total_questions) * 100);
                        return (
                          <div key={result.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                            <div className="text-sm text-gray-600">
                              {new Date(result.created_at).toLocaleDateString('ja-JP')}
                            </div>
                            <div className="font-semibold text-gray-800">
                              {result.score}/{result.total_questions} ({percentage}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-6">
              <p className="text-gray-600">
                学習を始めるにはログインしてください
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
                <Link href="/auth/sign-up">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                    新規登録
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                    ログイン
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
