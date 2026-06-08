import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useStore, type AnswerRecord, type DailyTask, type MapGuess } from '../store/useStore';
import { generateDailyTasks, fetchPracticeTasks } from '../services/api';
import { Loader2, CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn, localDateString } from '../lib/utils';
import { MapQuiz } from '../components/MapQuiz';
import { playCorrectSound, triggerHaptic } from '../lib/preferences';
import { storeNewAchievements, storeQuestRecap } from '../lib/questSession';
import { taskCountryCode } from '../lib/progress';

function isDateCompletedInStorage(date: string): boolean {
  try {
    const raw = localStorage.getItem('geodaily-storage');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { state?: { history?: Record<string, { completed?: boolean }> } };
    return Boolean(parsed.state?.history?.[date]?.completed);
  } catch {
    return false;
  }
}

function isMapGuess(guess: AnswerRecord['guess']): guess is MapGuess {
  return typeof guess === 'object' && guess !== null && 'lat' in guess;
}

export function Quiz() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    dailyTasks,
    dailyTasksDate,
    setDailyTasks,
    currentTaskIndex,
    nextTask,
    history,
    saveHistory,
    submitDailyResult,
    submitPracticeResult,
  } = useStore();

  const searchParams = new URLSearchParams(location.search);
  const dateParam = searchParams.get('date');
  const isReview = searchParams.get('review') === 'true';

  const todayStr = localDateString();
  const targetDate = dateParam || todayStr;
  const isToday = targetDate === todayStr;

  const [storeReady, setStoreReady] = useState(() => useStore.persist.hasHydrated());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [mapReviewGuess, setMapReviewGuess] = useState<MapGuess | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [practiceTasks, setPracticeTasks] = useState<DailyTask[]>([]);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);

  const [userAnswers, setUserAnswers] = useState<AnswerRecord[]>([]);
  const [sessionScore, setSessionScore] = useState(0);

  const isDaily = type === 'daily';
  const isPractice = !isDaily;

  const historyData = history[targetDate];
  const alreadyCompleted =
    Boolean(history[targetDate]?.completed) || isDateCompletedInStorage(targetDate);
  const tasks = isReview && historyData ? historyData.tasks : isDaily ? dailyTasks : practiceTasks;
  const currentIndex = isDaily ? currentTaskIndex : currentPracticeIndex;

  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setStoreReady(true));
    setStoreReady(useStore.persist.hasHydrated());
    return unsub;
  }, []);

  useEffect(() => {
    if (isReview && historyData) return;
    if (!storeReady) return;
    if (isDaily && alreadyCompleted) return;

    if (isDaily) {
      if (dailyTasks.length === 0 || dailyTasksDate !== targetDate) {
        loadDailyTasks(targetDate);
      }
    } else {
      loadPracticeTasks();
    }
  }, [type, isDaily, targetDate, storeReady, alreadyCompleted, isReview, historyData]);

  useEffect(() => {
    if (isReview && historyData) {
      const answer = historyData.answers[currentIndex];
      if (answer) {
        if (isMapGuess(answer.guess)) {
          setMapReviewGuess(answer.guess);
          setSelectedAnswer(null);
        } else {
          setSelectedAnswer(String(answer.guess));
          setMapReviewGuess(null);
        }
        setIsCorrect(answer.isCorrect);
        setShowResult(true);
      } else {
        setSelectedAnswer(null);
        setMapReviewGuess(null);
        setIsCorrect(null);
        setShowResult(false);
      }
    }
  }, [isReview, historyData, currentIndex]);

  const loadDailyTasks = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await generateDailyTasks(date);
      setDailyTasks(loaded, date);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadPracticeTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const practiceType = (type === 'capitals' || type === 'map' ? type : 'flags') as
        | 'flags'
        | 'capitals'
        | 'map';
      const loaded = await fetchPracticeTasks(practiceType);
      setPracticeTasks(loaded);
      setCurrentPracticeIndex(0);
      setUserAnswers([]);
      setSessionScore(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load practice tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (
    answer:
      | string
      | { isMap: true; isCorrect: boolean; points: number; distance: number | null; lat: number; lng: number }
  ) => {
    if (selectedAnswer || mapReviewGuess || isReview) return;

    let correct = false;
    let guessValue: AnswerRecord['guess'];
    let pointsEarned = 0;

    if (typeof answer === 'string') {
      setSelectedAnswer(answer);
      const currentTask = tasks[currentIndex];
      correct = answer === currentTask.correctAnswer;
      guessValue = answer;
      if (correct && isDaily) {
        pointsEarned = isToday ? 100 : 50;
      }
    } else {
      setMapReviewGuess({
        lat: answer.lat,
        lng: answer.lng,
        distance: answer.distance,
        points: answer.points,
      });
      correct = answer.isCorrect;
      guessValue = {
        lat: answer.lat,
        lng: answer.lng,
        distance: answer.distance,
        points: answer.points,
      };
      if (isDaily && answer.points > 0) {
        pointsEarned = isToday ? answer.points : Math.round(answer.points / 2);
      }
    }

    setIsCorrect(correct);
    setShowResult(true);

    const newAnswers: AnswerRecord[] = [...userAnswers, { guess: guessValue, isCorrect: correct }];
    setUserAnswers(newAnswers);

    if (pointsEarned > 0) {
      if (isDaily) setSessionScore((prev) => prev + pointsEarned);
      playCorrectSound();
      triggerHaptic();
      confetti({
        particleCount: pointsEarned >= 100 ? 100 : 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#176a21', '#9df197', '#ff9727'],
      });
    }

    if (isDaily && currentIndex === tasks.length - 1) {
      const finalScore = sessionScore + pointsEarned;

      saveHistory(targetDate, {
        date: targetDate,
        tasks,
        answers: newAnswers,
        score: finalScore,
        completed: true,
      });

      const countsForProgress = isToday && !alreadyCompleted;

      if (countsForProgress) {
        const missedCountries = tasks
          .map((task, idx) => ({ task, answer: newAnswers[idx] }))
          .filter(({ answer }) => !answer?.isCorrect)
          .map(({ task }) => ({
            name: task.correctAnswer,
            code: taskCountryCode(task) ?? '',
          }));

        storeQuestRecap({
          missedCountries,
          score: finalScore,
          maxScore: tasks.length * 100,
        });

        const newAchievements = submitDailyResult({
          date: targetDate,
          tasks,
          answers: newAnswers,
          score: finalScore,
          maxScore: tasks.length * 100,
        });
        if (newAchievements.length > 0) {
          storeNewAchievements(newAchievements);
        }
      }
    }
  };

  const handleNext = () => {
    if (!isReview) {
      setSelectedAnswer(null);
      setMapReviewGuess(null);
      setIsCorrect(null);
      setShowResult(false);
    }

    if (currentIndex < tasks.length - 1) {
      if (isDaily) {
        nextTask();
      } else {
        setCurrentPracticeIndex((prev) => prev + 1);
      }
    } else if (isDaily) {
      navigate(isReview ? '/' : isToday ? '/quest-completed' : '/');
    } else {
      submitPracticeResult({ tasks, answers: userAnswers });
      navigate('/');
    }
  };

  if (isDaily && !isReview && alreadyCompleted) {
    return <Navigate to={`/quiz/daily?date=${targetDate}&review=true`} replace />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-on-surface-variant font-medium">
          {isDaily ? 'Loading challenge...' : 'Preparing practice session...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-6">
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-on-surface-variant font-medium mb-4">{error}</p>
        <button
          onClick={() => (isDaily ? loadDailyTasks(targetDate) : loadPracticeTasks())}
          className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-6">
        <p className="text-on-surface-variant font-medium mb-4">Failed to load tasks. Please try again.</p>
        <button
          onClick={() => (isDaily ? loadDailyTasks(targetDate) : loadPracticeTasks())}
          className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentTask = tasks[currentIndex];
  const isMapTask =
    (currentTask.type === 'map' || currentTask.type === 'capital') &&
    Boolean(currentTask.mapCoordinates);
  const progressPct = Math.round(
    ((showResult ? currentIndex + 1 : currentIndex) / tasks.length) * 100
  );

  return (
    <div
      className={cn(
        'p-4 sm:p-6 mx-auto flex flex-col min-h-[80vh]',
        isMapTask ? 'max-w-4xl' : 'max-w-2xl'
      )}
    >
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 mr-4 bg-surface-container-low rounded-full hover:bg-surface-container transition-colors"
        >
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
        {isPractice && (
          <span className="ml-auto bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            No streak
          </span>
        )}
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm font-bold text-on-surface-variant mb-2">
          <span>
            Question {currentIndex + 1} of {tasks.length}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div
        className={cn(
          'bg-surface-container-lowest rounded-3xl p-4 sm:p-6 shadow-sm border border-outline-variant/20 flex flex-col',
          isMapTask ? 'flex-1 min-h-0 mb-4' : 'mb-8'
        )}
      >
        <h2
          className={cn(
            'text-2xl font-headline font-bold text-center',
            isMapTask ? 'mb-4' : 'mb-6'
          )}
        >
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

        {isMapTask ? (
          <MapQuiz
            task={currentTask}
            onAnswer={handleAnswer}
            showResult={showResult}
            initialGuess={mapReviewGuess}
            className="flex-1 min-h-0"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 mt-auto">
            {currentTask.options?.map((option, index) => {
              let buttonClass =
                'bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container';

              if (showResult) {
                if (option === currentTask.correctAnswer) {
                  buttonClass = 'bg-primary-container border-primary text-on-primary-container';
                } else if (option === selectedAnswer) {
                  buttonClass = 'bg-red-100 border-red-500 text-red-900';
                } else {
                  buttonClass =
                    'bg-surface-container-low border-outline-variant/30 text-on-surface opacity-50';
                }
              } else if (selectedAnswer === option) {
                buttonClass = 'bg-secondary-container border-secondary text-on-secondary-container';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult || isReview}
                  className={cn(
                    'p-4 rounded-2xl border-2 text-left font-bold text-lg transition-all flex justify-between items-center',
                    buttonClass,
                    isReview && 'cursor-default'
                  )}
                >
                  <span>{option}</span>
                  {showResult && option === currentTask.correctAnswer && (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  )}
                  {showResult && option === selectedAnswer && option !== currentTask.correctAnswer && (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showResult && (
        <div className="space-y-3">
          <button
            onClick={handleNext}
            className="w-full bg-primary text-on-primary p-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary-dim transition-colors shadow-md animate-in slide-in-from-bottom-4"
          >
            {currentIndex < tasks.length - 1
              ? 'Next Question'
              : isReview
                ? 'Back to Dashboard'
                : 'Finish Challenge'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
