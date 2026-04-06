import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStore, DailyTask, DailyHistory } from '../store/useStore';
import { generateDailyTasks } from '../services/api';
import { Loader2, CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';
import { MapQuiz } from '../components/MapQuiz';

async function fetchPracticeTasks(type: string): Promise<DailyTask[]> {
  try {
    const response = await fetch(`/api/practice?type=${type}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch practice tasks:", error);
    return [];
  }
}

export function Quiz() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { dailyTasks, setDailyTasks, currentTaskIndex, nextTask, completeDaily, addPoints, incrementStreak, history, saveHistory } = useStore();
  
  const searchParams = new URLSearchParams(location.search);
  const dateParam = searchParams.get('date');
  const isReview = searchParams.get('review') === 'true';
  
  const todayStr = new Date().toISOString().split('T')[0];
  const targetDate = dateParam || todayStr;
  const isToday = targetDate === todayStr;

  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [practiceTasks, setPracticeTasks] = useState<DailyTask[]>([]);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  
  // Track answers for history
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [sessionScore, setSessionScore] = useState(0);

  const isDaily = type === 'daily';
  
  // If in review mode, use the tasks from history
  const historyData = history[targetDate];
  const tasks = isReview && historyData ? historyData.tasks : (isDaily ? dailyTasks : practiceTasks);
  const currentIndex = isDaily ? currentTaskIndex : currentPracticeIndex;

  useEffect(() => {
    if (isReview && historyData) {
      // Setup review mode state
      const answer = historyData.answers[currentIndex];
      if (answer) {
        setSelectedAnswer(answer.guess);
        setIsCorrect(answer.isCorrect);
        setShowResult(true);
      }
      return;
    }

    if (isDaily) {
      if (dailyTasks.length === 0 || dateParam) {
        loadDailyTasks(targetDate);
      }
    } else {
      loadPracticeTasks();
    }
  }, [type, isDaily, isReview, currentIndex, targetDate]);

  const loadDailyTasks = async (date: string) => {
    setLoading(true);
    const tasks = await generateDailyTasks(date);
    setDailyTasks(tasks);
    setLoading(false);
  };

  const loadPracticeTasks = async () => {
    setLoading(true);
    const tasks = await fetchPracticeTasks(type || 'flags');
    setPracticeTasks(tasks);
    setCurrentPracticeIndex(0);
    setLoading(false);
  };

  const handleAnswer = (answer: string | { isMap: true, isCorrect: boolean, distance: number }) => {
    if (selectedAnswer || isReview) return; // Prevent multiple clicks or clicks in review mode
    
    let correct = false;
    let guessValue: any = answer;
    
    if (typeof answer === 'string') {
      setSelectedAnswer(answer);
      const currentTask = tasks[currentIndex];
      correct = answer === currentTask.correctAnswer;
    } else {
      setSelectedAnswer('MAP_GUESS');
      correct = answer.isCorrect;
      guessValue = 'MAP_GUESS';
    }

    setIsCorrect(correct);
    setShowResult(true);
    
    // Save answer for history
    const newAnswers = [...userAnswers, { guess: guessValue, isCorrect: correct }];
    setUserAnswers(newAnswers);
    
    let pointsEarned = 0;
    if (correct) {
      pointsEarned = isDaily ? (isToday ? 100 : 50) : 10; // Less points for past dailies or practice
      addPoints(pointsEarned);
      setSessionScore(prev => prev + pointsEarned);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#176a21', '#9df197', '#ff9727']
      });
    }
    
    // If it's the last question of a daily challenge, save to history
    if (isDaily && currentIndex === tasks.length - 1) {
      saveHistory(targetDate, {
        date: targetDate,
        tasks: tasks,
        answers: newAnswers,
        score: sessionScore + pointsEarned,
        completed: true
      });
    }
  };

  const handleNext = () => {
    if (!isReview) {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setShowResult(false);
    }
    
    if (currentIndex < tasks.length - 1) {
      if (isDaily) {
        nextTask();
      } else {
        setCurrentPracticeIndex(prev => prev + 1);
      }
    } else {
      if (isDaily) {
        if (!isReview && isToday) {
          completeDaily();
          incrementStreak();
        }
        navigate(isReview ? '/' : '/quest-completed');
      } else {
        // Practice completed
        navigate('/');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-on-surface-variant font-medium">
          {isDaily ? "Loading challenge..." : "Preparing practice session..."}
        </p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-6">
        <p className="text-on-surface-variant font-medium mb-4">Failed to load tasks. Please try again.</p>
        <button 
          onClick={() => isDaily ? loadDailyTasks(targetDate) : loadPracticeTasks()}
          className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentTask = tasks[currentIndex];

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col min-h-[80vh]">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 mr-4 bg-surface-container-low rounded-full hover:bg-surface-container transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-headline font-bold capitalize">
          {isDaily ? (isReview ? 'Review Challenge' : 'Daily Challenge') : `${type} Practice`}
        </h1>
        {isReview && (
          <span className="ml-auto bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Review Mode
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-bold text-on-surface-variant mb-2">
          <span>Question {currentIndex + 1} of {tasks.length}</span>
          <span>{Math.round(((currentIndex) / tasks.length) * 100)}%</span>
        </div>
        <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentIndex) / tasks.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/20 mb-8 flex-1 flex flex-col">
        <h2 className="text-2xl font-headline font-bold mb-6 text-center">
          {currentTask.question}
        </h2>
        
        {currentTask.type === 'flag' && currentTask.imageUrl && (
          <div className="flex justify-center mb-8">
            <img 
              src={`https://flagcdn.com/w320/${currentTask.imageUrl.toLowerCase()}.png`}
              alt="Flag"
              className="rounded-xl shadow-md border border-outline-variant/20 max-h-48 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {currentTask.type === 'map' ? (
          <MapQuiz task={currentTask} onAnswer={handleAnswer} showResult={showResult} />
        ) : (
          <div className="grid grid-cols-1 gap-3 mt-auto">
            {currentTask.options?.map((option, index) => {
              let buttonClass = "bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container";
              
              if (showResult) {
                if (option === currentTask.correctAnswer) {
                  buttonClass = "bg-primary-container border-primary text-on-primary-container";
                } else if (option === selectedAnswer) {
                  buttonClass = "bg-red-100 border-red-500 text-red-900";
                } else {
                  buttonClass = "bg-surface-container-low border-outline-variant/30 text-on-surface opacity-50";
                }
              } else if (selectedAnswer === option) {
                 buttonClass = "bg-secondary-container border-secondary text-on-secondary-container";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult || isReview}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left font-bold text-lg transition-all flex justify-between items-center",
                    buttonClass,
                    isReview && "cursor-default"
                  )}
                >
                  <span>{option}</span>
                  {showResult && option === currentTask.correctAnswer && <CheckCircle2 className="w-6 h-6 text-primary" />}
                  {showResult && option === selectedAnswer && option !== currentTask.correctAnswer && <XCircle className="w-6 h-6 text-red-500" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Button */}
      {showResult && (
        <button
          onClick={handleNext}
          className="w-full bg-primary text-on-primary p-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary-dim transition-colors shadow-md animate-in slide-in-from-bottom-4"
        >
          {currentIndex < tasks.length - 1 ? 'Next Question' : (isReview ? 'Back to Dashboard' : 'Finish Challenge')}
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
