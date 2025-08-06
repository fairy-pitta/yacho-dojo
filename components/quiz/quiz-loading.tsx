'use client';

import { Card, CardContent } from '@/components/ui/card';

interface QuizLoadingProps {
  message?: string;
}

export function QuizLoading({ message = '問題を読み込んでいます...' }: QuizLoadingProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-primary/20 shadow-lg">
      <CardContent className="p-8 text-center bg-primary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4 shadow-sm"></div>
        <p className="text-primary/80 font-medium">{message}</p>
      </CardContent>
    </Card>
  );
}