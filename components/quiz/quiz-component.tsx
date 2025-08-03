'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { UserAnswer, QuizSession, QuizResult } from '@/types/quiz';
import { validateAnswer, calculateScore, formatTime } from '@/utils/quiz';
import { getRandomQuestions, saveUserAnswer, saveQuizResult } from '@/lib/quiz-service';
import { useUser } from '@/hooks/use-user';
import Image from 'next/image';

interface QuizComponentProps {
  questionCount?: number;
  onComplete?: (result: QuizResult) => void;
}

export function QuizComponent({ questionCount = 10, onComplete }: QuizComponentProps) {
  const { user } = useUser();
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // タイマー
  useEffect(() => {
    if (!session || showResult) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [session, showResult]);

  // 問題を読み込み
  useEffect(() => {
    async function loadQuestions() {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      const { data: questions, error: fetchError } = await getRandomQuestions(questionCount);

      if (fetchError || !questions) {
        setError(fetchError || '問題の読み込みに失敗しました');
        setIsLoading(false);
        return;
      }

      const newSession: QuizSession = {
        id: `quiz_${Date.now()}`,
        user_id: parseInt(user.id) || 0,
        questions,
        answers: [],
        current_question_index: 0,
        start_time: new Date(),
        settings: {
          question_count: questionCount,
          time_limit: null,
          difficulty: 'mixed',
          shuffle_questions: true,
          shuffle_options: true,
          include_images: true
        }
      };

      setSession(newSession);
      setIsLoading(false);
    }

    loadQuestions();
  }, [user, questionCount]);

  const currentQuestion = session?.questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!session || !currentQuestion || !selectedAnswer || !user) return;

    setIsSubmitting(true);

    // 回答を検証
    const validation = validateAnswer(selectedAnswer, currentQuestion.correct_answer);
    
    const userAnswer: Omit<UserAnswer, 'id' | 'answered_at'> = {
      user_id: user.id,
      question_id: currentQuestion.id,
      user_answer: selectedAnswer,
      is_correct: validation.isCorrect,
      time_taken: timeElapsed - (session.answers.length > 0 ? 
        session.answers.reduce((sum, a) => sum + (a.time_taken || 0), 0) : 0)
    };

    // 回答を保存
    const { error: saveError } = await saveUserAnswer(userAnswer);
    if (saveError) {
      console.error('回答の保存に失敗:', saveError);
    }

    // セッションを更新
    const updatedAnswers = [...session.answers, {
      ...userAnswer,
      id: Date.now(), // 仮のID
      answered_at: new Date().toISOString()
    }];

    const updatedSession = {
      ...session,
      answers: updatedAnswers,
      current_question_index: currentQuestionIndex + 1
    };

    setSession(updatedSession);
    setSelectedAnswer('');
    setIsSubmitting(false);

    // 次の問題へ、または結果表示
    if (currentQuestionIndex + 1 >= session.questions.length) {
      await handleQuizComplete(updatedSession);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleQuizComplete = async (finalSession: QuizSession) => {
    if (!user) return;

    const correctAnswers = finalSession.answers.filter(a => a.is_correct).length;
    const totalQuestions = finalSession.questions.length;
    const score = calculateScore(finalSession.answers, finalSession.questions);

    const result: Omit<QuizResult, 'id' | 'created_at'> = {
      user_id: user.id,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      score,
      time_taken: timeElapsed,
      metadata: {
        difficulty_distribution: {
          easy: finalSession.questions.filter(q => q.difficulty === 'easy').length,
          medium: finalSession.questions.filter(q => q.difficulty === 'medium').length,
          hard: finalSession.questions.filter(q => q.difficulty === 'hard').length
        }
      }
    };

    // 結果を保存
    const { data: savedResult, error: saveError } = await saveQuizResult(result);
    if (saveError) {
      console.error('結果の保存に失敗:', saveError);
    }

    setShowResult(true);
    
    if (onComplete && savedResult) {
      onComplete(savedResult);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>問題を読み込んでいます...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">エラーが発生しました</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>再試行</Button>
        </CardContent>
      </Card>
    );
  }

  if (showResult && session) {
    const correctAnswers = session.answers.filter(a => a.is_correct).length;
    const totalQuestions = session.questions.length;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    const score = calculateScore(session.answers, session.questions);

    return (
      <Card className="w-full max-w-2xl mx-auto">
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
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <div className="font-semibold">{formatTime(timeElapsed)}</div>
              <div className="text-sm text-gray-600">所要時間</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold">{Math.round(timeElapsed / totalQuestions)}秒</div>
              <div className="text-sm text-gray-600">平均回答時間</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">問題別結果</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {session.answers.map((answer, index) => {
                const question = session.questions[index];
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {answer.is_correct ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">問題 {index + 1}</span>
                      <Badge className={getDifficultyColor(question.difficulty)}>
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

          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()} className="flex-1">
              もう一度挑戦
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
              ホームに戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session || !currentQuestion) {
    return null;
  }

  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              問題 {currentQuestionIndex + 1} / {session.questions.length}
            </span>
            <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
              {currentQuestion.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            {formatTime(timeElapsed)}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <CardTitle className="text-lg">{currentQuestion.question_text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentQuestion.image_url && (
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image
              src={currentQuestion.image_url}
              alt="問題画像"
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="space-y-2">
          {currentQuestion.options?.map((option, index) => (
            <Button
              key={index}
              variant={selectedAnswer === option ? "default" : "outline"}
              className="w-full justify-start text-left h-auto p-4"
              onClick={() => handleAnswerSelect(option)}
              disabled={isSubmitting}
            >
              <span className="mr-3 font-semibold">{String.fromCharCode(65 + index)}.</span>
              {option}
            </Button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer || isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {currentQuestionIndex + 1 >= session.questions.length ? '結果を見る' : '次の問題'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}