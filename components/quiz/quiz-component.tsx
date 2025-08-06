'use client';

import { useState, useEffect } from 'react';
import { UserAnswer, QuizSession, QuizResult } from '@/types/quiz';
import { validateAnswer, calculateScore } from '@/utils/quiz';
import { getRandomQuestions, saveUserAnswer, saveQuizResult } from '@/lib/quiz-service';
import { useUser } from '@/hooks/use-user';
import { QuizError } from './quiz-error';
import { QuizResult as QuizResultComponent } from './quiz-result';
import { QuizQuestion } from './quiz-question';
import { QuizLoading } from './quiz-loading';

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
      setIsLoading(true);
      setError(null);

      const { data: questions, error: fetchError } = await getRandomQuestions(questionCount);

      if (fetchError || !questions) {
        setError(fetchError || '問題の読み込みに失敗しました');
        setIsLoading(false);
        return;
      }

      const newSession: QuizSession = {
        id: Date.now(),
        user_id: user ? parseInt(user.id) || 0 : 0,
        questions,
        answers: [],
        current_question_index: 0,
        score: 0,
        total_questions: questionCount,
        started_at: new Date().toISOString()
      };

      setSession(newSession);
      setIsLoading(false);
    }

    loadQuestions();
  }, [user, questionCount]);

  const currentQuestion = session?.questions[currentQuestionIndex];



  const handleSubmitAnswer = async () => {
    if (!session || !currentQuestion || !selectedAnswer.trim()) return;

    setIsSubmitting(true);

    // 回答を検証
    const validation = validateAnswer(selectedAnswer, currentQuestion.correct_answer);
    
    const userAnswer: Omit<UserAnswer, 'id' | 'answered_at'> = {
      user_id: user?.id || '',
      bird_id: currentQuestion.bird_id || '',
      bird_image_id: currentQuestion.image_id || '',
      selected_answer: selectedAnswer,
      correct_answer: currentQuestion.correct_answer,
      is_correct: validation.isCorrect,
      time_taken: timeElapsed - (session.answers.length > 0 ? 
        session.answers.reduce((sum, a) => sum + (a.time_taken || 0), 0) : 0)
    };

    // ログインしている場合のみ回答を保存
    if (user) {
      const { error: saveError } = await saveUserAnswer(userAnswer);
      if (saveError) {
        console.error('回答の保存に失敗:', saveError);
      }
    }

    // セッションを更新
    const updatedAnswers: UserAnswer[] = [...session.answers, {
      ...userAnswer,
      id: Date.now().toString(), // 仮のID
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
    const correctAnswers = finalSession.answers.filter(a => a.is_correct).length;
    const totalQuestions = finalSession.questions.length;
    const score = calculateScore(finalSession.answers, finalSession.questions);

    // ログインしている場合のみ結果を保存
    if (user) {
      const result: Omit<QuizResult, 'id' | 'created_at'> = {
        user_id: user.id,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        score,
        time_taken: timeElapsed,
        difficulty_level: 'mixed',
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
      
      if (onComplete && savedResult) {
        onComplete(savedResult);
      }
    }

    setShowResult(true);
  };



  if (isLoading) {
    return <QuizLoading />;
  }

  if (error) {
    return <QuizError error={error} onRetry={() => window.location.reload()} />;
  }

  if (showResult && session) {
    return (
      <QuizResultComponent
        session={session}
        timeElapsed={timeElapsed}
        user={user}
        onRetry={() => window.location.reload()}
        onGoHome={() => window.history.back()}
      />
    );
  }

  if (!session || !currentQuestion) {
    return null;
  }

  return (
    <QuizQuestion
      question={currentQuestion}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={session.questions.length}
      timeElapsed={timeElapsed}
      selectedAnswer={selectedAnswer}
      onAnswerChange={setSelectedAnswer}
      onSubmit={handleSubmitAnswer}
      isSubmitting={isSubmitting}
    />
  );
}