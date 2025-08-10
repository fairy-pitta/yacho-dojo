'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserAnswerHistory, calculateUserStats } from '@/lib/answer-service';
import { getUserQuizHistory } from '@/lib/quiz-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, TrendingUp, BookOpen } from 'lucide-react';
import { formatTime } from '@/utils/quiz';
import { UserStats, UserAnswerHistory } from '@/lib/answer-service';
import { QuizResult } from '@/types/quiz';
import { User } from '@supabase/supabase-js';

export default function ResultsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentHistory, setRecentHistory] = useState<UserAnswerHistory[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setUser(user);

        // ユーザー統計を取得
        const userStats = await calculateUserStats(user.id);
        setStats(userStats);

        // 最近の回答履歴を取得
        const { data: history } = await getUserAnswerHistory(user.id);
        setRecentHistory(history?.slice(0, 10) || []);

        // クイズ履歴を取得
        const { data: quizData } = await getUserQuizHistory(user.id, 5);
        setQuizHistory(quizData || []);
      } catch (error) {
        console.error('データの読み込みに失敗しました:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-4">成績を確認するにはログインしてください。</p>
          <a href="/auth/login" className="text-primary hover:underline">
            ログインページへ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">学習成績</h1>
        <p className="text-gray-600">あなたの学習進捗と成績を確認できます</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総回答数</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAnswers || 0}</div>
            <p className="text-xs text-muted-foreground">
              これまでに回答した問題数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">正解数</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.correctAnswers || 0}</div>
            <p className="text-xs text-muted-foreground">
              正解した問題数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">正答率</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.accuracy || 0}%</div>
            <p className="text-xs text-muted-foreground">
              全体の正答率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">クイズ回数</CardTitle>
            <Trophy className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizHistory.length}</div>
            <p className="text-xs text-muted-foreground">
              完了したクイズ数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 進捗バー */}
      {stats && stats.totalAnswers > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">学習進捗</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>正答率</span>
                <span>{stats.accuracy}%</span>
              </div>
              <Progress 
                value={stats.accuracy} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 最近のクイズ結果 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">最近のクイズ結果</CardTitle>
          </CardHeader>
          <CardContent>
            {quizHistory.length > 0 ? (
              <div className="space-y-3">
                {quizHistory.map((result) => {
                  const scorePercentage = Math.round((result.correct_answers / result.total_questions) * 100);
                  const date = new Date(result.created_at).toLocaleDateString('ja-JP');
                  
                  return (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={scorePercentage >= 80 ? 'default' : scorePercentage >= 60 ? 'secondary' : 'destructive'}>
                          {scorePercentage}%
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {result.correct_answers}/{result.total_questions}問正解
                          </p>
                          <p className="text-xs text-muted-foreground">{date}</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(result.time_taken || 0)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">まだクイズを完了していません</p>
            )}
          </CardContent>
        </Card>

        {/* 最近の回答履歴 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">最近の回答履歴</CardTitle>
          </CardHeader>
          <CardContent>
            {recentHistory.length > 0 ? (
              <div className="space-y-3">
                {recentHistory.map((answer) => {
                  const date = new Date(answer.answered_at).toLocaleDateString('ja-JP');
                  
                  return (
                    <div key={answer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={answer.is_correct ? 'default' : 'destructive'}>
                          {answer.is_correct ? '正解' : '不正解'}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            回答: {answer.user_answer}
                          </p>
                          <p className="text-xs text-muted-foreground">{date}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">まだ回答履歴がありません</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}