'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { STATS_COLORS } from '@/lib/colors';
import { calculateUserStats, getRecentAnswerHistory, UserStats, UserAnswerHistory } from '@/lib/answer-service';
import { useUser } from '@/hooks/use-user';
// date-fnsの代わりに標準のDate機能を使用
import Image from 'next/image';

interface AnswerHistoryProps {
  limit?: number;
  showStats?: boolean;
}

export function AnswerHistory({ limit = 10, showStats = true }: AnswerHistoryProps) {
  const { user } = useUser();
  const [history, setHistory] = useState<UserAnswerHistory[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        // 回答履歴を取得
        const { data: historyData, error: historyError } = await getRecentAnswerHistory(user.id, limit);
        if (historyError) {
          throw new Error(typeof historyError === 'string' ? historyError : 'データの取得に失敗しました');
        }
        setHistory(historyData || []);

        // 統計を取得
        if (showStats) {
          const statsData = await calculateUserStats(user.id);
          setStats(statsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '履歴の読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, limit, showStats]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">ログインが必要です</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-500">エラー: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計表示 */}
      {showStats && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              学習統計
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalAnswers}</div>
                <div className="text-sm text-muted-foreground">総回答数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.correctAnswers}</div>
                <div className="text-sm text-muted-foreground">正解数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: STATS_COLORS.accuracy.purple }}>{stats.accuracy}%</div>
                <div className="text-sm text-muted-foreground">正解率</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 回答履歴 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            最近の回答履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              まだ回答履歴がありません
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((answer) => (
                <div
                  key={answer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* 正解/不正解アイコン */}
                    <div className="flex-shrink-0">
                      {answer.is_correct ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>

                    {/* 問題情報 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          問題 #{answer.question_id}
                        </span>
                        {answer.questions?.bird_name && (
                          <Badge variant="outline">
                            {answer.questions.bird_name}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        あなたの回答: <span className="font-medium">{answer.user_answer}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(answer.answered_at).toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* 問題画像（あれば） */}
                    {answer.questions?.image_url && (
                      <div className="flex-shrink-0">
                        <Image
                          src={answer.questions.image_url}
                          alt="問題画像"
                          width={60}
                          height={60}
                          className="rounded-md object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}