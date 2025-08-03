import { Suspense } from 'react';
import { QuizComponent } from '@/components/quiz/quiz-component';
import { Card, CardContent } from '@/components/ui/card';

export default function QuizPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">野鳥識別クイズ</h1>
          <p className="text-gray-600">
            野鳥の知識をテストして、識別スキルを向上させましょう
          </p>
        </div>

        <Suspense fallback={<QuizLoadingFallback />}>
          <QuizComponent questionCount={10} />
        </Suspense>
      </div>
    </div>
  );
}

function QuizLoadingFallback() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>クイズを準備しています...</p>
      </CardContent>
    </Card>
  );
}