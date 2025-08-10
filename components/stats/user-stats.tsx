'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Clock, TrendingUp } from 'lucide-react';
import { STATS_COLORS } from '@/lib/colors';
import { getUserQuizHistory } from '@/lib/quiz-service';
import { QuizResult } from '@/types/quiz';
import { formatTime } from '@/utils/quiz';

interface UserStatsProps {
  userId: string;
}

interface UserStatistics {
  totalQuizzes: number;
  averageScore: number;
  totalStudyTime: number;
  correctAnswers: number;
  totalAnswers: number;
  bestScore: number;
  recentTrend: 'up' | 'down' | 'stable';
}

export function UserStats({ userId }: UserStatsProps) {
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [recentResults, setRecentResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const { data: results, error: fetchError } = await getUserQuizHistory(userId, 20);
        
        if (fetchError) {
          setError(fetchError);
          return;
        }

        if (!results || results.length === 0) {
          setStats({
            totalQuizzes: 0,
            averageScore: 0,
            totalStudyTime: 0,
            correctAnswers: 0,
            totalAnswers: 0,
            bestScore: 0,
            recentTrend: 'stable',
          });
          setRecentResults([]);
          return;
        }

        setRecentResults(results.slice(0, 5));

        // 統計を計算
        const totalQuizzes = results.length;
        const totalCorrect = results.reduce((sum, r) => sum + r.correct_answers, 0);
        const totalQuestions = results.reduce((sum, r) => sum + r.total_questions, 0);
        const totalTime = results.reduce((sum, r) => sum + r.time_taken, 0);
        const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        const bestScore = Math.max(...results.map(r => Math.round((r.correct_answers / r.total_questions) * 100)));

        // 最近のトレンドを計算（最新5件と前5件を比較）
        let recentTrend: 'up' | 'down' | 'stable' = 'stable';
        if (results.length >= 6) {
          const recent5 = results.slice(0, 5);
          const previous5 = results.slice(5, 10);
          
          const recentAvg = recent5.reduce((sum, r) => sum + (r.correct_answers / r.total_questions), 0) / recent5.length;
          const previousAvg = previous5.reduce((sum, r) => sum + (r.correct_answers / r.total_questions), 0) / previous5.length;
          
          if (recentAvg > previousAvg + 0.05) {
            recentTrend = 'up';
          } else if (recentAvg < previousAvg - 0.05) {
            recentTrend = 'down';
          }
        }

        setStats({
          totalQuizzes,
          averageScore,
          totalStudyTime: totalTime,
          correctAnswers: totalCorrect,
          totalAnswers: totalQuestions,
          bestScore,
          recentTrend,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '統計の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const getTrendIcon = () => {
    switch (stats.recentTrend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (stats.recentTrend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総クイズ数</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
            <p className="text-xs text-muted-foreground">
              これまでに挑戦したクイズ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均正解率</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <p className={`text-xs ${getTrendColor()}`}>
                {stats.recentTrend === 'up' && '上昇傾向'}
                {stats.recentTrend === 'down' && '下降傾向'}
                {stats.recentTrend === 'stable' && '安定'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総学習時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(stats.totalStudyTime)}</div>
            <p className="text-xs text-muted-foreground">
              累計学習時間
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最高スコア</CardTitle>
            <Trophy className="h-4 w-4" style={{ color: STATS_COLORS.trophy.gold }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bestScore}%</div>
            <p className="text-xs text-muted-foreground">
              ベストパフォーマンス
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 進捗バー */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">学習進捗</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>正解率</span>
              <span>{stats.averageScore}%</span>
            </div>
            <Progress value={stats.averageScore} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>総回答数</span>
              <span>{stats.correctAnswers}/{stats.totalAnswers}</span>
            </div>
            <Progress 
              value={stats.totalAnswers > 0 ? (stats.correctAnswers / stats.totalAnswers) * 100 : 0} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>

      {/* 最近の結果 */}
      {recentResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">最近の結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentResults.map((result) => {
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
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatTime(result.time_taken)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}