
import React, { useState, useEffect } from 'react';
import { RAW_QUESTIONS, SECTIONS } from './constants';
import { Question, UserData, QuizResult } from './types';
import { saveResult, getTopScores } from './services/dbService';

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
  const [topScores, setTopScores] = useState<QuizResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startQuiz = () => {
    if (!userData.firstName.trim() || !userData.lastName.trim()) {
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
    setSelectedOption(null);
    setView('quiz');
  };

  const handleOptionClick = (option: string) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(option);
    const isCorrect = option === questions[currentIndex].correctAnswer;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Delay for transition without showing the correct answer
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
      } else {
        finishQuiz();
      }
    }, 1000);
  };

  const finishQuiz = async () => {
    setIsSubmitting(true);
    const result: QuizResult = {
      ...userData,
      score: score,
      totalQuestions: questions.length,
      timestamp: Date.now()
    };
    
    await saveResult(result);
    
    if (score >= questions.length * 0.8) {
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
    setIsSubmitting(true);
    const scores = await getTopScores(10);
    setTopScores(scores);
    setIsSubmitting(false);
    setView('leaderboard');
  };

  const renderRegister = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-slide-up">
      <div className="glass p-8 md:p-12 rounded-[30px] w-full max-w-lg text-center shadow-xl">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Online Long Test</h1>
        <p className="text-slate-500 mb-8 font-medium">Family and Consumers Science</p>
        
        <div className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">First Name</label>
              <input 
                type="text" 
                className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200 transition-all text-slate-700"
                placeholder="Jane"
                value={userData.firstName}
                onChange={e => setUserData({...userData, firstName: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Last Name</label>
              <input 
                type="text" 
                className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200 transition-all text-slate-700"
                placeholder="Doe"
                value={userData.lastName}
                onChange={e => setUserData({...userData, lastName: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Section</label>
            <select 
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200 transition-all appearance-none cursor-pointer text-slate-700"
              value={userData.section}
              onChange={e => setUserData({...userData, section: e.target.value})}
            >
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={startQuiz}
          className="w-full mt-10 bg-slate-800 text-white font-semibold py-4 rounded-xl haptic-btn shadow-lg shadow-slate-200 hover:bg-slate-700 transition-all tracking-wide"
        >
          START ASSESSMENT
        </button>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-slide-up" key={currentIndex}>
        <div className="w-full bg-white/30 h-1.5 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-rose-300 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center mb-6 px-2">
          <span className="text-[10px] font-bold text-rose-400 tracking-[0.2em] uppercase">Part {currentIndex + 1} / {questions.length}</span>
          <span className="text-[10px] font-bold text-slate-300 tracking-[0.2em] uppercase italic">Assessment in Progress</span>
        </div>

        <div className="glass p-8 md:p-12 rounded-[40px] shadow-2xl relative">
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-12 leading-relaxed">
            {currentQuestion.text}
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              let btnClass = "bg-white/50 border-slate-100 hover:border-rose-200 hover:bg-white";
              
              if (isSelected) {
                btnClass = "bg-rose-50 border-rose-300 shadow-lg shadow-rose-100 ring-2 ring-rose-100";
              }

              return (
                <button
                  key={idx}
                  disabled={selectedOption !== null}
                  onClick={() => handleOptionClick(option)}
                  className={`flex items-center text-left p-6 border-2 rounded-[25px] haptic-btn transition-all-custom group ${btnClass}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 text-[10px] font-bold transition-all ${isSelected ? 'bg-rose-200 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-400'}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`font-medium text-sm md:text-base ${isSelected ? 'text-rose-600' : 'text-slate-600'}`}>{option}</span>
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
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-100 via-rose-300 to-rose-100"></div>
        <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-rose-50 rounded-full border-4 border-white shadow-inner">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Test Completed</h2>
        <p className="text-slate-400 mb-8 font-medium italic">Good luck with your final results, {userData.firstName}.</p>
        
        <div className="bg-white/40 p-10 rounded-[35px] border border-white/50 mb-10 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Score Achieved</p>
          <div className="text-7xl font-black text-slate-800 tracking-tighter">
            {score}<span className="text-3xl font-medium text-slate-200 ml-1">/50</span>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={showLeaderboard}
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl haptic-btn shadow-xl shadow-slate-200 hover:bg-slate-700 transition-all tracking-widest text-xs"
          >
            VIEW RANKINGS
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="w-full text-slate-400 font-bold py-4 rounded-2xl hover:bg-white/50 transition-all text-[10px] tracking-widest uppercase"
          >
            Refresh & Restart
          </button>
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-slide-up">
      <div className="glass p-8 md:p-12 rounded-[40px] shadow-2xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 leading-none mb-2">Top 10</h2>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Global Standings</p>
          </div>
          <button onClick={() => setView('register')} className="text-rose-400 font-bold text-xs uppercase tracking-wider hover:text-rose-600 transition-colors">Exit</button>
        </div>

        <div className="space-y-3">
          {topScores.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-300">∅</span>
              </div>
              <p className="text-slate-400 font-medium italic">No scores logged yet.</p>
            </div>
          ) : (
            topScores.map((res, i) => (
              <div key={i} className={`flex items-center justify-between p-5 rounded-[22px] border transition-all ${i === 0 ? 'bg-white border-rose-200 shadow-md scale-[1.02]' : 'bg-white/30 border-transparent shadow-sm'}`}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black mr-4 text-sm ${
                    i === 0 ? 'bg-rose-100 text-rose-500' : 
                    i === 1 ? 'bg-slate-100 text-slate-500' : 
                    i === 2 ? 'bg-orange-50 text-orange-400' : 
                    'text-slate-300'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base">{res.firstName} {res.lastName}</h4>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{res.section}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-700 text-lg">{res.score}<span className="text-[10px] text-slate-300 ml-0.5">/50</span></div>
                  <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{new Date(res.timestamp).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <button 
          onClick={() => setView('register')}
          className="w-full mt-10 bg-white border border-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all haptic-btn text-xs tracking-widest"
        >
          BACK TO START
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Decorative Blur Elements */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-rose-200/20 rounded-full blur-[140px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-white rounded-full blur-[120px] -z-10 -translate-x-1/4 translate-y-1/4"></div>
      
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] glass flex items-center justify-center animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Processing Securely...</p>
          </div>
        </div>
      )}

      <nav className="p-8 flex justify-center">
        <div className="glass px-6 py-2 rounded-full border border-white/80 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></div>
        </div>
      </nav>
      
      {view === 'register' && renderRegister()}
      {view === 'quiz' && renderQuiz()}
      {view === 'result' && renderResult()}
      {view === 'leaderboard' && renderLeaderboard()}
    </div>
  );
};

export default App;
