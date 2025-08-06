'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, ArrowRight } from 'lucide-react';
import { Question } from '@/types/quiz';
import { formatTime } from '@/utils/quiz';
import { QuizImage } from './quiz-image';

interface QuizQuestionProps {
  question: Question;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeElapsed: number;
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy': return 'bg-theme-100 text-theme-800 border-theme-200';
    case 'medium': return 'bg-theme-200 text-theme-900 border-theme-300';
    case 'hard': return 'bg-theme-300 text-theme-900 border-theme-400';
    default: return 'bg-theme-100 text-theme-800 border-theme-200';
  }
}

export function QuizQuestion({
  question,
  currentQuestionIndex,
  totalQuestions,
  timeElapsed,
  selectedAnswer,
  onAnswerChange,
  onSubmit,
  isSubmitting
}: QuizQuestionProps) {
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const isLastQuestion = currentQuestionIndex + 1 >= totalQuestions;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedAnswer.trim() && !isSubmitting) {
      onSubmit();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-primary/20 shadow-lg bg-card">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              問題 {currentQuestionIndex + 1} / {totalQuestions}
            </span>
            <Badge className={`${getDifficultyColor(question.difficulty)} border`}>
              {question.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatTime(timeElapsed)}
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-3 mb-4 border border-border shadow-inner">
          <div 
            className="bg-primary h-3 rounded-full transition-all duration-300 shadow-sm" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <CardTitle className="text-lg">{question.question_text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {question.image_url && (
          <QuizImage 
            imageUrl={question.image_url} 
            alt="問題画像" 
            credit="Photo by Unsplash"
          />
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="answer-input" className="block text-base font-semibold text-foreground mb-3">
              この鳥の名前を入力してください
            </label>
            <Input
              id="answer-input"
              type="text"
              value={selectedAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="鳥の名前を入力..."
              disabled={isSubmitting}
              className="w-full border-2 border-primary/30 bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onSubmit}
            disabled={!selectedAnswer.trim() || isSubmitting}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold border-2 border-primary shadow-lg hover:shadow-xl transition-all"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {isLastQuestion ? '結果を見る' : '次の問題'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}