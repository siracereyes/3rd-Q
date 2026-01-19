
export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface UserData {
  firstName: string;
  lastName: string;
  section: string;
}

export interface QuizResult extends UserData {
  score: number;
  totalQuestions: number;
  timestamp: number;
}

export type Section = 
  | '8-Carnation'
  | '8-Daffodil'
  | '8-Daisy'
  | '8-Sampaguita'
  | '8-Allium'
  | '8-Begonia'
  | '8-Catleya'
  | '8-Callalily'
  | '8-Anthurium';
