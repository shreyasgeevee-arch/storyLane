import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, TrendingUp, Zap, Target, Award, Briefcase,
  Video, GraduationCap, ChevronRight, ChevronLeft, CheckCircle2,
  XCircle, Mail, Phone, Calendar, ArrowRight, Heart, Home
} from 'lucide-react';
import './index.css'

// --- DATA & CONSTANTS ---

const OBJECTIONS = [
  {
    gatekeeper: "He's in a meeting.",
    wrong: "I'll call back later.",
    correct: "When's a good window — morning or afternoon?"
  },
  {
    gatekeeper: "Just send an email.",
    wrong: "Sure, what's his email?",
    correct: "I will — and to make it relevant, can I ask you one thing?"
  },
  {
    gatekeeper: "We're not interested.",
    wrong: "Oh okay, sorry to bother.",
    correct: "Totally fair — what would make it worth 10 minutes?"
  },
  {
    gatekeeper: "What's this regarding?",
    wrong: "It's a sales call.",
    correct: "A way to increase conversion using interactive product demos."
  },
  {
    gatekeeper: "She handles that, not him.",
    wrong: "Can I have her number?",
    correct: "Perfect — could you connect me, or should I reach her directly?"
  },
  {
    gatekeeper: "We already have a solution.",
    wrong: "Okay, no problem.",
    correct: "Good to know — how long have you been using it?"
  },
  {
    gatekeeper: "He's not taking cold calls.",
    wrong: "I understand, thanks.",
    correct: "Appreciate that — would a warm intro from a mutual contact help?"
  },
  {
    gatekeeper: "Can you call back tomorrow?",
    wrong: "Sure, same time?",
    correct: "Absolutely — is 10am good, or does afternoon work better for him?"
  }
];

const TOUR_STEPS = [
  {
    id: 'intro',
    title: 'Meet Shreyas.',
    content: "Hey, I'm Shreyas. I'm an SDR, a content creator, and I love pizza. Welcome to my interactive resume.",
    buttonText: "See the numbers",
    icon: <Heart className="w-6 h-6 text-purple-500" />
  },
  {
    id: 'spotdraft',
    title: 'The Proof of Work.',
    content: "At SpotDraft, I built a $1.1 million allbound and outbound pipeline resulting in $312K of closed-won revenue. I averaged 95% attainment across my tenure, peaking at 150% in my best quarter. In another quarter, I was the only SDR to hit 100%.",
    buttonText: "How I did it",
    icon: <TrendingUp className="w-6 h-6 text-emerald-500" />
  },
  {
    id: 'workflows',
    title: 'How I use AI.',
    content: "I solo-built AI prospecting workflows using Comet, Claude, and Wispr Flow. Then, I trained my entire team on them.",
    buttonText: "Past quests",
    icon: <Zap className="w-6 h-6 text-blue-500" />
  },
  {
    id: 'experience',
    title: 'I wear many hats.',
    content: "Before SpotDraft, I was helping my AEs close $10K deals at Quintype, creating hyper-personalized AI videos at Rephrase.ai, and scaling my own D2C brand to 16.7L in revenue.",
    buttonText: "The Creator Side",
    icon: <Briefcase className="w-6 h-6 text-orange-500" />
  },
  {
    id: 'creator',
    title: 'Storytelling is my DNA.',
    content: "I grew my YouTube channel to 15.5K subs and 2M views through pure SEO. Picked for exclusive cohorts by Ankur Warikoo and Graphy. I know how to hold attention.",
    buttonText: "Why Storylane?",
    icon: <Video className="w-6 h-6 text-red-500" />
  },
  {
    id: 'storylane',
    title: 'Why I am here.',
    content: "I love explaining things visually. PLG and interactive demos are the future. Also, parking a massive truck with a Storylane poster outside an event?",
    buttonText: "Play a game",
    icon: <Target className="w-6 h-6 text-purple-500" />
  },
  {
    id: 'game',
    title: 'Gatekeeper Run.',
    content: "Theory is great, but let's see it in action. Dodge the gatekeepers, pick the right rebuttals, and book the meeting.",
    buttonText: "Start Run",
    icon: <Play className="w-6 h-6 text-green-500" />
  }
];

// --- COMPONENTS ---

const Hotspot = ({ className }) => (
  <div className={`absolute flex items-center justify-center ${className}`}>
    <div className="absolute w-4 h-4 bg-purple-500 rounded-full animate-ping opacity-75"></div>
    <div className="relative w-3 h-3 bg-purple-600 rounded-full border-2 border-white shadow-lg"></div>
  </div>
);

const GameCanvas = ({ onGameOver, onWin, onHome }) => {
  const canvasRef = useRef(null);
  const remainingObjectionsRef = useRef([]);
  const [gameState, setGameState] = useState('start'); // start, playing, won, lost
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);
  const [currentObjection, setCurrentObjection] = useState(null);
  const [options, setOptions] = useState([]);

  // Audio contexts (using synthetic beeps for zero dependencies)
  const playSound = useCallback((type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.log("Audio not supported or interaction needed");
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (gameState !== 'playing' || !currentObjection) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          handleWrongAnswer("Timeout!");
          return 12;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [gameState, currentObjection]);

  // Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let offset = 0;

    const drawBackground = () => {
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

      // Scrolling elements (cubicles/watercoolers)
      ctx.fillStyle = '#334155';
      for (let i = 0; i < 5; i++) {
        const x = ((i * 300) - offset) % (canvas.width + 300);
        const actualX = x < -300 ? x + canvas.width + 300 : x;
        // Desk
        ctx.fillRect(actualX, canvas.height - 120, 80, 80);
        // Computer
        ctx.fillStyle = '#475569';
        ctx.fillRect(actualX + 20, canvas.height - 150, 40, 30);
        ctx.fillStyle = '#334155';
      }
    };

    const drawPlayer = () => {
      const bounce = gameState === 'playing' ? Math.sin(Date.now() / 100) * 5 : 0;
      const x = 100;
      const y = canvas.height - 100 + bounce;

      // Simple silhouette
      ctx.fillStyle = '#8b5cf6'; // purple
      // Head
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.fillRect(x - 10, y + 15, 20, 35);
      // Legs (animating)
      const legSpread = gameState === 'playing' ? Math.sin(Date.now() / 100) * 15 : 0;
      ctx.beginPath();
      ctx.moveTo(x, y + 50);
      ctx.lineTo(x - legSpread, y + 75);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + 50);
      ctx.lineTo(x + legSpread, y + 75);
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 4;
      ctx.stroke();
    };

    const drawGatekeeper = () => {
      if (!currentObjection) return;
      const x = canvas.width - 150;
      const y = canvas.height - 110;

      ctx.fillStyle = '#ef4444'; // red
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 10, y + 15, 20, 35);
    };

    const render = () => {
      if (gameState === 'playing' && !currentObjection) {
        offset += 4; // Running speed
      }
      drawBackground();
      drawPlayer();
      if (currentObjection) drawGatekeeper();

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, currentObjection]);

  const nextObjection = (currentScore = score) => {
    if (currentScore >= 800 || remainingObjectionsRef.current.length === 0) {
      setGameState('won');
      return;
    }

    // Pop the last objection from our shuffled deck so they never repeat
    const randomObj = remainingObjectionsRef.current.pop();
    const shuffledOptions = [
      { text: randomObj.correct, isCorrect: true },
      { text: randomObj.wrong, isCorrect: false }
    ].sort(() => Math.random() - 0.5);

    setCurrentObjection(randomObj);
    setOptions(shuffledOptions);
    setTimeLeft(12);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setStreak(0);
    // Shuffle the objections at the start of every new run
    remainingObjectionsRef.current = [...OBJECTIONS].sort(() => Math.random() - 0.5);
    setTimeout(() => nextObjection(0), 1500);
  };

  const handleCorrectAnswer = () => {
    playSound('correct');
    const multiplier = streak >= 3 ? 2 : streak >= 1 ? 1.5 : 1;
    const addedScore = 100 * multiplier;
    const newScore = score + addedScore;

    setScore(prev => prev + addedScore);
    setStreak(prev => prev + 1);
    setCurrentObjection(null);
    setTimeout(() => nextObjection(newScore), 2000);
  };

  const handleWrongAnswer = () => {
    playSound('wrong');
    setStreak(0);
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameState('lost');
        setCurrentObjection(null);
      } else {
        setCurrentObjection(null);
        setTimeout(() => nextObjection(score), 2000);
      }
      return newLives;
    });
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900 h-full flex flex-col">
      {/* Game Header */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 text-white font-mono bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <div className="flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-600'}`} />
          ))}
        </div>
        <div className="text-xl font-bold text-purple-400">Score: {score}</div>
        <div className="text-sm font-semibold">Connect Rate: {score > 0 ? Math.min(100, Math.floor((score / 800) * 100)) : 0}%</div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full h-full object-cover flex-1"
      />

      {/* Overlays */}
      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20">
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Gatekeeper Run</h2>
          <p className="text-slate-300 mb-8 max-w-md text-center">Dodge the objections. Pick the right response. Book the meeting. You have 12 seconds per objection.</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all transform hover:scale-105"
          >
            Start Dialing
          </button>
          <button
            onClick={onHome}
            className="mt-6 flex items-center text-slate-400 hover:text-white transition-colors font-medium"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </button>
        </div>
      )}

      {gameState === 'playing' && currentObjection && (
        <div className="absolute inset-0 flex flex-col justify-end pb-8 px-4 z-20">
          {/* Objection Bubble */}
          <div className="absolute top-24 right-16 bg-white text-slate-900 p-4 rounded-2xl rounded-br-none font-bold shadow-xl max-w-xs animate-bounce">
            "{currentObjection.gatekeeper}"
          </div>

          {/* Timer bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-100 ease-linear"
              style={{ width: `${(timeLeft / 12) * 100}%` }}
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => opt.isCorrect ? handleCorrectAnswer() : handleWrongAnswer()}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white p-4 rounded-xl text-left transition-colors font-medium shadow-lg"
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'won' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-20 text-center px-4">
          <Award className="w-20 h-20 text-yellow-400 mb-6" />
          <h2 className="text-5xl font-bold text-white mb-2">Meeting Booked!</h2>
          <p className="text-xl text-slate-300 mb-8">Final Connect Rate: {Math.min(100, Math.floor((score / 800) * 100))}%</p>
          <button
            onClick={onWin}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center shadow-lg transition-transform hover:scale-105"
          >
            See how I do this for real <ArrowRight className="ml-2 w-5 h-5" />
          </button>
          <button
            onClick={onHome}
            className="mt-6 flex items-center text-slate-400 hover:text-white transition-colors font-medium"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </button>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-20 text-center px-4">
          <Phone className="w-20 h-20 text-red-500 mb-6 opacity-50" />
          <h2 className="text-4xl font-bold text-white mb-2">Sent to Voicemail.</h2>
          <p className="text-slate-400 mb-8">Even the best get blocked sometimes.</p>
          <div className="flex space-x-4">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              Dial Again
            </button>
            <button
              onClick={onWin}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-colors"
            >
              See my actual stats →
            </button>
          </div>
          <button
            onClick={onHome}
            className="mt-6 flex items-center text-slate-400 hover:text-white transition-colors font-medium"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showCTA, setShowCTA] = useState(false);

  const currentStep = TOUR_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setShowCTA(true);
    }
  };

  const DashboardContent = () => {
    switch (currentStep.id) {
      case 'intro':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <img
              src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/934159fc-08c1-404e-8b76-d31a2ea694b9/dp2_gv/w=1920,quality=90,fit=scale-down"
              alt="Shreyas GV"
              className="w-32 h-32 rounded-full object-cover shadow-2xl mb-4 border-4 border-slate-800"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://ui-avatars.com/api/?name=SG&background=8b5cf6&color=fff&size=128";
              }}
            />
            <h1 className="text-5xl font-bold text-white tracking-tight">Shreyas GV</h1>
            <p className="text-xl text-slate-400">Senior SDR at SpotDraft</p>
            <div className="flex space-x-4 mt-8">
              <span className="px-4 py-2 bg-slate-800 rounded-full text-sm font-medium border border-slate-700 text-slate-300">🎥 Content</span>
              <span className="px-4 py-2 bg-slate-800 rounded-full text-sm font-medium border border-slate-700 text-slate-300">📈 Sales</span>
              <span className="px-4 py-2 bg-slate-800 rounded-full text-sm font-medium border border-slate-700 text-slate-300">🍕 Pizza</span>
            </div>
            <Hotspot className="top-1/4 right-1/4" />
          </div>
        );

      case 'spotdraft':
        return (
          <div className="grid grid-cols-2 gap-6 p-8 h-full w-full">
            <div className="col-span-2 bg-slate-800/50 rounded-2xl p-6 border border-slate-700 flex items-center justify-between relative">
              <div>
                <p className="text-slate-400 font-medium mb-1">Total Outbound Pipeline Built</p>
                <h2 className="text-5xl font-bold text-emerald-400">$1M</h2>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-medium mb-1">Closed Won Revenue</p>
                <h2 className="text-5xl font-bold text-white">$312K</h2>
              </div>
              <Hotspot className="bottom-0 right-1/2 translate-y-1/2" />
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 flex flex-col justify-between">
              <h3 className="text-lg font-semibold text-slate-200 mb-6">Quota Attainment</h3>
              <div className="flex items-end space-x-2 h-28 mb-2 mt-4">
                <div className="w-1/3 bg-purple-900/50 h-[60%] rounded-t-lg relative group"></div>
                <div className="w-1/3 bg-purple-600 h-[80%] rounded-t-lg relative">
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-purple-300">100%</span>
                </div>
                <div className="w-1/3 bg-emerald-500 h-[100%] rounded-t-lg relative shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-emerald-300">150%</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center mt-4">Top 3 SDR in North America Region &amp; Qualified for President's Club</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 flex flex-col justify-center relative">
              <Award className="w-12 h-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Email Wizard Award</h3>
              <p className="text-sm text-slate-400">Awarded for the most creative outbound emails across NA + India.</p>
              <Hotspot className="top-4 right-4" />
            </div>
          </div>
        );

      case 'workflows':
        return (
          <div className="flex items-center justify-center h-full p-8 relative w-full">
            <div className="w-full max-w-2xl bg-slate-900 rounded-xl border border-slate-700 p-8">
              <h3 className="text-white font-semibold mb-8 text-center">How I use AI</h3>
              <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-700 -translate-y-1/2 -z-10"></div>

                {/* Nodes */}
                <div className="bg-slate-800 border-2 border-purple-500 rounded-lg p-4 flex flex-col items-center shadow-lg relative">
                  <Hotspot className="-top-2 -right-2" />
                  <img src="https://cdn.prod.website-files.com/6748a0499432e81f3a029ef8/697fc3ac9bf4516c2e56d242_685d67a7974eb0dc5cbaaded_Perplexity-Comet.jpeg" alt="Comet" className="w-10 h-10 rounded-full object-cover mb-2" />
                  <span className="text-xs font-bold text-slate-300">Comet</span>
                </div>
                <ArrowRight className="text-slate-500" />
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 flex flex-col items-center relative">
                  <Hotspot className="-top-2 -right-2" />
                  <img src="https://media.licdn.com/dms/image/v2/D4E0BAQFko-zWIZk_pw/company-logo_200_200/B4EZhiRWKvHgAI-/0/1753995371543/claude_logo?e=2147483647&v=beta&t=CVNmFKyWig0Uo78oAr3II6KVLu_o0aXPtnt4S6XgOr8" alt="Claude" className="w-10 h-10 rounded-full object-cover mb-2" />
                  <span className="text-xs font-bold text-slate-300">Claude</span>
                </div>
                <ArrowRight className="text-slate-500" />
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 flex flex-col items-center">
                  <img src="https://store-images.s-microsoft.com/image/apps.40749.13908841991970612.40536875-f2f0-4bda-90ba-7f257692767b.e2e21593-028d-4a03-9030-a6a5cd48c229" alt="Wispr" className="w-10 h-10 rounded-full object-cover mb-2" />
                  <span className="text-xs font-bold text-slate-300">Wispr</span>
                </div>
              </div>
              <p className="text-center text-slate-400 text-sm mt-12">I didn't just use these; I trained the entire SDR team on how to build them.</p>
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="p-8 h-full flex flex-col justify-center max-w-3xl mx-auto w-full">
            <div className="space-y-6">
              <div className="relative pl-8 border-l-2 border-slate-700">
                <div className="absolute w-4 h-4 bg-purple-500 rounded-full -left-[9px] top-1"></div>
                <h3 className="text-xl font-bold text-white">Senior SDR @ SpotDraft</h3>
                <p className="text-sm text-slate-400 mb-2">Oct 2024 - Present</p>
                <p className="text-sm text-slate-300">Generated $1M pipeline and $312K won revenue (outbound & allbound) over 1.5 years. Averaged 95% attainment, peaking at 150%.</p>
              </div>
              <div className="relative pl-8 border-l-2 border-slate-700">
                <Hotspot className="absolute -left-[9px] top-1" />
                <div className="absolute w-4 h-4 bg-slate-600 rounded-full -left-[9px] top-1"></div>
                <h3 className="text-xl font-bold text-white">Pre-Sales Associate @ Quintype</h3>
                <p className="text-sm text-slate-400 mb-2">Nov 2022 - Oct 2024</p>
                <p className="text-sm text-slate-300">Managed full sales cycle. Helped my AE close multiple accounts with $10,000 ACV. Broke into U.S. market securing first luxury magazine client through outbound.</p>
              </div>
              <div className="relative pl-8 border-l-2 border-slate-700">
                <div className="absolute w-4 h-4 bg-slate-600 rounded-full -left-[9px] top-1"></div>
                <h3 className="text-xl font-bold text-white">Content Creator @ Rephrase.ai</h3>
                <p className="text-sm text-slate-400 mb-2">Jun 2022 - Sep 2022</p>
                <p className="text-sm text-slate-300">Created hyper-personalized video content. Managed 'lifeatrephrase' brand culture page.</p>
              </div>
              <div className="relative pl-8 border-l-2 border-transparent">
                <div className="absolute w-4 h-4 bg-slate-600 rounded-full -left-[9px] top-1"></div>
                <h3 className="text-xl font-bold text-white">Founder @ Humble Panda</h3>
                <p className="text-sm text-slate-400 mb-2">Jan 2021 - Apr 2022</p>
                <p className="text-sm text-slate-300">Managed D2C e-commerce operations. Generated 16.7L net revenue via performance marketing with 4X ROI.</p>
              </div>
            </div>
          </div>
        );

      case 'creator':
        return (
          <div className="p-8 h-full grid grid-cols-2 gap-6 relative w-full">
            <Hotspot className="top-1/2 left-1/2" />
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 flex flex-col justify-center">
              <Video className="w-10 h-10 text-red-500 mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">15.5K Subs</h2>
              <h3 className="text-xl font-semibold text-slate-300 mb-4">2 Million Views</h3>
              <p className="text-sm text-slate-400">Pioneered the "How I studied in two days" genre on YouTube India. Heavily SEO driven.</p>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h4 className="font-bold text-white text-sm mb-1">Graphy Select 50</h4>
                <p className="text-xs text-slate-400">Top 50 chosen out of 10K+. Mentored by Ankur Warikoo, BeerBiceps. Received $2600 seed funding.</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h4 className="font-bold text-white text-sm mb-1">How to YouTube by Ankur Warikoo</h4>
                <p className="text-xs text-slate-400">Selected from 6K+ applicants to learn direct audience retention & growth strategies.</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 relative">
                <Hotspot className="top-2 right-2" />
                <h4 className="font-bold text-white text-sm mb-1">Notable Collabs</h4>
                <p className="text-xs text-slate-400">Vedant Rusty (150K+), Abhi&Niyu (6M+ followers).</p>
              </div>
            </div>
          </div>
        );

      case 'storylane':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 relative w-full">
            <Target className="w-16 h-16 text-purple-500 mb-4" />
            <h2 className="text-4xl font-bold text-white">Visual {'>'} Text</h2>
            <p className="text-xl text-slate-300 max-w-2xl">
              I've built my career on explaining things and holding attention. What Storylane is doing with interactive demos is the exact future of PLG software sales.
            </p>
            <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl max-w-2xl mt-6 text-left">
              <p className="text-base text-slate-400 italic">
                "I've also been following the marketing... that massive truck with the Storylane poster parked outside the event? That's how I got to know about Storylane; love the ambush marketing there. Not to mention Akshaya's killer content."
              </p>
            </div>
            <Hotspot className="bottom-1/4 right-1/4" />
          </div>
        );

      case 'game':
        return (
          <div className="flex items-center justify-center h-full w-full p-4">
            <GameCanvas onGameOver={() => { }} onWin={() => setShowCTA(true)} onHome={() => setCurrentStepIndex(0)} />
          </div>
        );

      default:
        return null;
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 font-sans selection:bg-purple-500/30 flex items-center justify-center p-4 md:p-8">

      {/* Main "Demo" Container */}
      <div className="w-full max-w-6xl aspect-[16/9] min-h-[600px] bg-slate-900 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 flex flex-col overflow-hidden relative">

        {/* Browser Mockup Header */}
        <div className="h-12 bg-slate-950 flex items-center px-4 border-b border-slate-800 shrink-0">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="mx-auto bg-slate-900 border border-slate-800 rounded-md px-16 md:px-32 py-1 text-xs text-slate-500 flex items-center">
            storylane.io/demo/shreyas-gv
          </div>
        </div>

        {/* Demo Content Area - Added padding to prevent overlap with the modal */}
        <div className={`flex-1 relative bg-gradient-to-br from-slate-900 to-slate-950 overflow-y-auto flex items-center justify-center ${!showCTA && currentStep.id !== 'game' ? 'pb-72 md:pb-0 md:pr-[420px]' : ''}`}>
          {DashboardContent()}
        </div>

        {/* Floating Storylane-style Tour Guide Card */}
        {!showCTA && currentStep.id !== 'game' && (
          <div className="absolute bottom-8 right-8 w-[92%] md:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-6 z-50 transform transition-all animate-in fade-in slide-in-from-bottom-4 flex flex-col">
            <div className="flex items-center mb-4">
              {currentStep.icon}
              <span className="ml-3 font-semibold text-slate-900">{currentStep.title}</span>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed flex-1">
              {currentStep.content}
            </p>
            <div className="flex flex-col mt-auto pt-4 border-t border-slate-100 gap-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className={`flex items-center text-sm font-semibold transition-colors ${currentStepIndex === 0 ? 'text-slate-300 cursor-not-allowed opacity-50' : 'text-slate-600 hover:text-purple-600'}`}
                >
                  <ChevronLeft className="w-4 h-4 mr-0.5" />
                  Back
                </button>

                <div className="flex space-x-1 shrink-0">
                  {TOUR_STEPS.slice(0, -1).map((_, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${idx === currentStepIndex ? 'bg-purple-600' : 'bg-slate-200'}`} />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center shrink-0"
                >
                  {currentStep.buttonText}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              {currentStepIndex > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setCurrentStepIndex(0)}
                    className="flex items-center text-xs font-semibold text-slate-400 hover:text-purple-600 transition-colors"
                  >
                    <Home className="w-3 h-3 mr-1" />
                    Home
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CTA Overlay Modal */}
      {showCTA && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Demo Completed.</h2>
            <p className="text-slate-400 mb-8">
              Thanks for making it all the way to the end! Let's connect.
            </p>
            <div className="space-y-4">
              <a href="mailto:gvshreyas2000@gmail.com" className="w-full flex items-center justify-center px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors">
                <Mail className="w-5 h-5 mr-2" />
                gvshreyas2000@gmail.com
              </a>
              <div className="flex justify-center space-x-4 pt-4 border-t border-slate-800">
                <a href="https://www.linkedin.com/in/shreyasgv/" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors">LinkedIn</a>
              </div>
            </div>
            <button
              onClick={() => setShowCTA(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}