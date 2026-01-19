
import React, { useState, useEffect, useCallback } from 'react';
import { RAW_QUESTIONS, SECTIONS } from './constants';
import { Question, UserData, QuizResult } from './types';
import { saveResult, getTopScores } from './services/dbService';

// Utility for shuffling
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const App: React.FC = () => {
  const [view, setView] = useState<'register' | 'quiz' | 'result' | 'leaderboard'>('register');
  const [userData, setUserData] = useState<UserData>({ firstName: '', lastName: '', section: SECTIONS[0] });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [topScores, setTopScores] = useState<QuizResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Quiz
  const startQuiz = () => {
    if (!userData.firstName || !userData.lastName) {
      alert("Please enter your full name.");
      return;
    }
    const shuffledQs = shuffleArray(RAW_QUESTIONS).map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));
    setQuestions(shuffledQs);
    setCurrentIndex(0);
    setScore(0);
    setView('quiz');
  };

  const handleOptionClick = (option: string) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(option);
    const isCorrect = option === questions[currentIndex].correctAnswer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setFeedback(null);
      } else {
        finishQuiz();
      }
    }, 1500);
  };

  const finishQuiz = async () => {
    setIsSubmitting(true);
    const finalScore = score + (feedback === 'correct' ? 1 : 0);
    const result: QuizResult = {
      ...userData,
      score: finalScore,
      totalQuestions: RAW_QUESTIONS.length,
      timestamp: Date.now()
    };
    
    await saveResult(result);
    
    if (finalScore >= RAW_QUESTIONS.length * 0.8) {
      // @ts-ignore
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e2d1c3', '#fdfcfb', '#d4af37']
      });
    }
    
    setIsSubmitting(false);
    setView('result');
  };

  const showLeaderboard = async () => {
    const scores = await getTopScores(10);
    setTopScores(scores);
    setView('leaderboard');
  };

  const renderRegister = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-slide-up">
      <div className="glass p-8 md:p-12 rounded-[30px] w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Ethereal Reviewer</h1>
        <p className="text-slate-500 mb-8">Enter your details to start the session</p>
        
        <div className="space-y-4 text-left">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-400 mb-1 block">First Name</label>
            <input 
              type="text" 
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200 transition-all"
              placeholder="e.g. Jane"
              value={userData.firstName}
              onChange={e => setUserData({...userData, firstName: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-400 mb-1 block">Last Name</label>
            <input 
              type="text" 
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200 transition-all"
              placeholder="e.g. Doe"
              value={userData.lastName}
              onChange={e => setUserData({...userData, lastName: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-400 mb-1 block">Section</label>
            <select 
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200 transition-all appearance-none cursor-pointer"
              value={userData.section}
              onChange={e => setUserData({...userData, section: e.target.value})}
            >
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={startQuiz}
          className="w-full mt-10 bg-slate-800 text-white font-semibold py-4 rounded-xl haptic-btn shadow-lg shadow-slate-200 hover:bg-slate-700 transition-all"
        >
          Begin Review
        </button>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-slide-up" key={currentIndex}>
        {/* Progress Bar */}
        <div className="w-full bg-white/30 h-1.5 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-rose-300 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-rose-400 tracking-widest uppercase">Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Score: {score}</span>
        </div>

        <div className="glass p-8 md:p-12 rounded-[40px] shadow-2xl">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-10 leading-relaxed">
            {currentQuestion.text}
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              let bgClass = "bg-white/50 border-slate-100 hover:border-rose-200 hover:bg-white";
              
              if (isSelected) {
                if (feedback === 'correct') bgClass = "bg-green-100 border-green-500 shadow-lg shadow-green-100 text-green-700";
                else if (feedback === 'wrong') bgClass = "bg-red-100 border-red-500 shadow-lg shadow-red-100 text-red-700";
              }

              return (
                <button
                  key={idx}
                  disabled={selectedOption !== null}
                  onClick={() => handleOptionClick(option)}
                  className={`flex items-center text-left p-6 border-2 rounded-[25px] haptic-btn transition-all-custom group ${bgClass}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 text-xs font-bold transition-all ${isSelected ? 'bg-white/50' : 'bg-slate-100 text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-400'}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-medium">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderResult = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-slide-up">
      <div className="glass p-12 rounded-[40px] w-full max-w-lg text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-200 via-rose-300 to-rose-200"></div>
        <div className="mb-6 inline-flex items-center justify-center w-24 h-24 bg-rose-50 rounded-full border-4 border-white shadow-sm">
          <span className="text-4xl">✨</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Review Complete!</h2>
        <p className="text-slate-400 mb-8">Excellent effort, {userData.firstName}.</p>
        
        <div className="bg-white/40 p-8 rounded-[30px] border border-white/50 mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-1">Final Score</p>
          <div className="text-6xl font-black text-slate-800">
            {score}<span className="text-2xl font-medium text-slate-300">/{questions.length}</span>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={showLeaderboard}
            className="w-full bg-slate-800 text-white font-semibold py-4 rounded-xl haptic-btn shadow-lg hover:bg-slate-700 transition-all"
          >
            View Leaderboard
          </button>
          <button 
            onClick={() => setView('register')}
            className="w-full text-slate-500 font-semibold py-4 rounded-xl hover:bg-white/50 transition-all"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-slide-up">
      <div className="glass p-8 md:p-12 rounded-[40px] shadow-2xl">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-slate-800">Top Performers</h2>
          <button onClick={() => setView('register')} className="text-rose-400 font-semibold text-sm hover:underline">Back Home</button>
        </div>

        <div className="space-y-3">
          {topScores.length === 0 ? (
            <p className="text-center text-slate-400 py-12">No records found yet.</p>
          ) : (
            topScores.map((res, i) => (
              <div key={i} className={`flex items-center justify-between p-5 rounded-[22px] border ${i < 3 ? 'bg-white border-rose-100 shadow-sm' : 'bg-white/30 border-transparent'}`}>
                <div className="flex items-center">
                  <span className={`w-10 h-10 flex items-center justify-center rounded-full font-bold mr-4 ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-slate-100 text-slate-500' : i === 2 ? 'bg-orange-50 text-orange-400' : 'text-slate-300'}`}>
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800">{res.firstName} {res.lastName}</h4>
                    <p className="text-xs text-slate-400 font-medium">{res.section}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-700">{res.score}/{res.totalQuestions}</div>
                  <div className="text-[10px] text-slate-300 uppercase tracking-widest">{new Date(res.timestamp).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <button 
          onClick={() => setView('register')}
          className="w-full mt-10 bg-rose-50 text-rose-500 font-bold py-4 rounded-2xl hover:bg-rose-100 transition-all haptic-btn"
        >
          Return to Hub
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Decorative Blur Elements */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-rose-100/30 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-white rounded-full blur-[100px] -z-10 -translate-x-1/4 translate-y-1/4"></div>
      
      {view === 'register' && renderRegister()}
      {view === 'quiz' && renderQuiz()}
      {view === 'result' && renderResult()}
      {view === 'leaderboard' && renderLeaderboard()}
    </div>
  );
};

export default App;
