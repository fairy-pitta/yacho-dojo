// 野鳥関連の型定義
export interface Bird {
  id: string
  name: string
  scientific_name: string
  family: string
  order: string
  description?: string
  habitat?: string
  size?: string
  created_at: string
  updated_at: string
}

// 野鳥画像の型定義
export interface BirdImage {
  id: string
  bird_id: string
  image_url: string
  alt_text?: string
  photographer?: string
  license?: string
  created_at: string
}

// 問題の型定義
export interface Question {
  id: string
  bird_id: string
  question_type: 'multiple_choice' | 'image_identification'
  question_text: string
  options: string[]
  correct_answer: number
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
  updated_at: string
}

// ユーザー回答の型定義
export interface UserAnswer {
  id: string
  user_id: string
  question_id: string
  selected_answer: number
  is_correct: boolean
  answer_time_ms: number
  answered_at: string
}

// ユーザープロフィールの型定義
export interface UserProfile {
  id: string
  user_id: string
  display_name?: string
  avatar_url?: string
  total_questions_answered: number
  correct_answers: number
  study_streak_days: number
  last_study_date?: string
  created_at: string
  updated_at: string
}

// クイズセッションの型定義
export interface QuizSession {
  id: string
  user_id: string
  questions: Question[]
  current_question_index: number
  score: number
  start_time: string
  end_time?: string
  completed: boolean
}

// 成績統計の型定義
export interface UserStats {
  total_questions: number
  correct_answers: number
  accuracy_rate: number
  average_answer_time: number
  study_streak: number
  last_study_date?: string
  weak_categories: string[]
  strong_categories: string[]
}