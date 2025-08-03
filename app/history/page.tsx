import { AnswerHistory } from '@/components/answer-history/answer-history';
import { History } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <History className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">回答履歴</h1>
        </div>
        <p className="text-muted-foreground">
          これまでの学習記録と成績を確認できます。
        </p>
      </div>

      <AnswerHistory limit={20} showStats={true} />
    </div>
  );
}