'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { QuizSession } from '@/types/quiz';
import { calculateScore, formatTime } from '@/utils/quiz';
import { User } from '@supabase/supabase-js';

interface QuizResultProps {
  session: QuizSession;
  timeElapsed: number;
  user: User | null;
  onRetry: () => void;
  onGoHome: () => void;
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 text-green-800 border-green-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'hard': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function QuizResult({ session, timeElapsed, user, onRetry, onGoHome }: QuizResultProps) {
  const correctAnswers = session.answers.filter(a => a.is_correct).length;
  const totalQuestions = session.questions.length;
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
  const score = calculateScore(session.answers, session.questions);

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          クイズ完了！
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">{score}点</div>
          <div className="text-lg text-gray-600">
            {correctAnswers}/{totalQuestions}問正解 ({accuracy}%)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="font-semibold">{formatTime(timeElapsed)}</div>
            <div className="text-sm text-gray-600">所要時間</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <div className="font-semibold">{Math.round(timeElapsed / totalQuestions)}秒</div>
            <div className="text-sm text-gray-600">平均回答時間</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">問題別結果</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {session.answers.map((answer, index) => {
              const question = session.questions[index];
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    {answer.is_correct ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">問題 {index + 1}</span>
                    <Badge className={`${getDifficultyColor(question.difficulty)} border`}>
                      {question.difficulty}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTime(answer.time_taken || 0)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!user && (
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200 shadow-sm">
            <p className="text-sm text-blue-800 mb-2">
              📝 ログインすると回答履歴が保存され、成績を追跡できます
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/auth/login'}
              className="text-blue-700 border-2 border-blue-300 hover:bg-blue-100 shadow-sm"
            >
              ログインする
            </Button>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={onRetry} className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold border-2 border-primary shadow-lg hover:shadow-xl transition-all">
            もう一度挑戦
          </Button>
          <Button variant="outline" onClick={onGoHome} className="flex-1 border-2 border-primary bg-white hover:bg-primary/10 text-primary font-semibold shadow-lg hover:shadow-xl transition-all">
            ホームに戻る
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}