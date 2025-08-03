export interface Question {
  id: string;
  question_text: string;
  image_url?: string;
  correct_answer: string;
  options: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  bird_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserAnswer {
  id?: string;
  user_id: string;
  bird_id: string;
  bird_image_id: string;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
  answered_at: string;
  time_taken?: number; // seconds
}

export interface QuizSession {
  id?: number;
  user_id: number;
  questions: Question[];
  current_question_index: number;
  score: number;
  total_questions: number;
  started_at: string;
  completed_at?: string;
  answers: UserAnswer[];
}

export interface QuizResult {
  id?: number;
  user_id: string;
  session_id?: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number; // total time in seconds
  difficulty_level: string;
  category?: string;
  metadata?: {
    difficulty_distribution?: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
  created_at: string;
}

export interface QuizSettings {
  questionCount: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  category?: string;
  timeLimit?: number; // seconds per question
  includeImages: boolean;
}

export interface AnswerValidationResult {
  isCorrect: boolean;
  normalizedAnswer: string;
  matchType: 'exact' | 'partial' | 'fuzzy';
  confidence: number;
}