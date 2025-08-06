'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

interface QuizErrorProps {
  error: string;
  onRetry?: () => void;
}

export function QuizError({ error, onRetry }: QuizErrorProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-red-200 shadow-lg">
      <CardContent className="p-8 text-center bg-red-50/50">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-red-800">エラーが発生しました</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={handleRetry} className="bg-red-500 hover:bg-red-600 border border-red-400 shadow-md">
          再試行
        </Button>
      </CardContent>
    </Card>
  );
}