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
import { 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Play, 
  Target,
  Award,
  BarChart3
} from "lucide-react";

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
      
      <main role="main" className="flex-1 container">
        {/* ヘッダーセクション */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                野鳥識別士道場
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                野鳥識別士試験の合格を目指して学習しましょう
              </p>
              
              {user ? (
                <div className="space-y-6">
                  <div className="bg-muted border border-border rounded-lg p-4 inline-block">
                    <p className="text-foreground font-medium">
                      ようこそ、{user.email?.split('@')[0]}さん
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      onClick={handleStartQuiz}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
                    >
                      クイズを始める
                    </Button>
                    <Link href="/study">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="border-border text-foreground hover:bg-muted px-8 py-3"
                      >
                        学習資料を見る
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-muted-foreground">
                    学習を始めるにはログインしてください
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/auth/sign-up">
                      <Button 
                        size="lg" 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
                      >
                        新規登録
                      </Button>
                    </Link>
                    <Link href="/auth/login">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="border-border text-foreground hover:bg-muted px-8 py-3"
                      >
                        ログイン
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 特徴セクション */}
        {!user && (
          <div className="py-12 bg-muted">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  なぜ野鳥識別士道場なのか？
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  効率的な学習システムで、確実に合格へ導きます
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="text-center p-6 bg-card border border-border rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">的確な問題演習</h3>
                  <p className="text-muted-foreground text-sm">
                    試験に出やすい問題を厳選。効率的に実力アップできます。
                  </p>
                </div>
                
                <div className="text-center p-6 bg-card border border-border rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">詳細な進捗管理</h3>
                  <p className="text-muted-foreground text-sm">
                    学習状況を可視化。弱点を把握して効率的に学習できます。
                  </p>
                </div>
                
                <div className="text-center p-6 bg-card border border-border rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">合格サポート</h3>
                  <p className="text-muted-foreground text-sm">
                    豊富な学習資料と実践的な問題で合格まで徹底サポート。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">

        {/* ダッシュボードグリッド */}
        {user && (
          <div className="space-y-8 grid" data-testid="dashboard-grid">
            {/* 学習メニュー */}
            <h2 className="text-2xl font-bold text-foreground">学習メニュー</h2>
            {/* クイックアクション */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <Link href="/quiz" className="group" aria-label="問題演習">
                 <div className="bg-card border border-border rounded-lg p-6 hover:border-border/80 transition-colors">
                   <div className="flex items-center mb-4">
                     <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mr-3">
                       <Play className="w-5 h-5 text-muted-foreground" />
                     </div>
                     <h3 className="text-lg font-semibold text-foreground">問題演習</h3>
                   </div>
                   <p className="text-muted-foreground text-sm">クイズに挑戦して実力をつけよう</p>
                 </div>
               </Link>
               
               <Link href="/study" className="group" aria-label="学習資料">
                 <div className="bg-card border border-border rounded-lg p-6 hover:border-border/80 transition-colors">
                   <div className="flex items-center mb-4">
                     <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mr-3">
                       <BookOpen className="w-5 h-5 text-muted-foreground" />
                     </div>
                     <h3 className="text-lg font-semibold text-foreground">学習資料</h3>
                   </div>
                   <p className="text-muted-foreground text-sm">野鳥の知識を深めよう</p>
                 </div>
               </Link>
               
               <Link href="/results" className="group" aria-label="成績確認">
                 <div className="bg-card border border-border rounded-lg p-6 hover:border-border/80 transition-colors">
                   <div className="flex items-center mb-4">
                     <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mr-3">
                       <Trophy className="w-5 h-5 text-muted-foreground" />
                     </div>
                     <h3 className="text-lg font-semibold text-foreground">成績確認</h3>
                   </div>
                   <p className="text-muted-foreground text-sm">学習の成果をチェック</p>
                 </div>
               </Link>
             </div>

            {/* 統計情報 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 学習進捗 */}
               <div className="bg-card rounded-lg border border-border p-6">
                 <div className="flex items-center mb-4">
                   <TrendingUp className="w-5 h-5 text-muted-foreground mr-2" />
                   <h2 className="text-lg font-semibold text-foreground">学習進捗</h2>
                 </div>
                 {userStats ? (
                   <div className="space-y-3">
                     <div className="flex justify-between items-center py-2 px-3 bg-muted rounded">
                       <span className="text-muted-foreground">総学習時間</span>
                       <span className="font-semibold text-foreground">{userStats.totalStudyTime}分</span>
                     </div>
                     <div className="flex justify-between items-center py-2 px-3 bg-muted rounded">
                       <span className="text-muted-foreground">正答率</span>
                       <span className="font-semibold text-foreground">
                         {userStats.totalAnswers > 0 ? 
                           Math.round((userStats.correctAnswers / userStats.totalAnswers) * 100) : 0}%
                       </span>
                     </div>
                     <div className="flex justify-between items-center py-2 px-3 bg-muted rounded">
                       <span className="text-muted-foreground">平均スコア</span>
                       <span className="font-semibold text-foreground">{userStats.averageScore}%</span>
                     </div>
                     <div className="flex justify-between items-center py-2 px-3 bg-muted rounded">
                       <span className="text-muted-foreground">クイズ回数</span>
                       <span className="font-semibold text-foreground">{userStats.totalQuizzes}回</span>
                     </div>
                   </div>
                 ) : (
                   <div className="text-center py-6">
                     <p className="text-muted-foreground">まだ学習データがありません</p>
                     <p className="text-sm text-muted-foreground/70 mt-1">クイズを始めて進捗を記録しましょう</p>
                   </div>
                 )}
               </div>

              {/* 最近の成績 */}
               <div className="bg-card rounded-lg border border-border p-6">
                 <div className="flex items-center mb-4">
                   <Trophy className="w-5 h-5 text-muted-foreground mr-2" />
                   <h2 className="text-lg font-semibold text-foreground">最近の成績</h2>
                 </div>
                 {recentResults.length > 0 ? (
                   <div className="space-y-3">
                     {recentResults.slice(0, 4).map((result) => {
                       const percentage = Math.round((result.score / result.total_questions) * 100);
                       
                       return (
                         <div key={result.id} className="flex justify-between items-center py-2 px-3 bg-muted rounded border-l-4 border-border">
                           <div>
                             <div className="text-sm text-muted-foreground">
                               {new Date(result.created_at).toLocaleDateString('ja-JP')}
                             </div>
                             <div className="font-semibold text-foreground">
                               {result.score}/{result.total_questions}
                             </div>
                           </div>
                           <div className="text-right font-bold text-foreground">
                             {percentage}%
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 ) : (
                   <div className="text-center py-6">
                     <p className="text-muted-foreground">まだクイズを受けていません</p>
                     <p className="text-sm text-muted-foreground/70 mt-1">最初のクイズに挑戦してみましょう</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}


        </div>
      </main>

      <Footer />
    </div>
  );
}
