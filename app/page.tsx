'use client';

import { useState, useEffect } from 'react';
import { supabase } from "@/src/utils/supabase";

type StepType = 'INPUT' | 'BAKING' | 'RESULTS';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [step, setStep] = useState<StepType>('INPUT');
  const [tokens, setTokens] = useState(0); // number 타입
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackEmail = "micka.vocal@gmail.com";
  const mailSubject = encodeURIComponent("[News Cookie] Feedback & Suggestions");
  const mailBody = encodeURIComponent("Hello Chef!\n\nHere is my feedback about News Cookie:\n\n");

  // 토큰 가져오는 함수 수정
  const fetchUserTokens = async (uid: string) => {
    try {
      const { data, error } = await supabase
      .from('users')
      .select('cookie_token')
      .eq('id', uid)
      .single();

      if (error) throw error;

      if (data) {
        const tokenCount = data.cookie_token ? Number(data.cookie_token) : 0;
        setTokens(tokenCount);
      }
    } catch (error) {
      console.error('Error fetching user tokens:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const voted = localStorage.getItem('news_cookie_voted_waitlist');
      if (voted === 'true') {
        setHasVoted(true);
      }
    }
  }, []);

  // 하나의 useEffect로 인증 상태 및 토큰 조회 통합 관리
  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || '');
        setUserId(session.user.id);
        fetchUserTokens(session.user.id); // 로그인 정보가 있다면 즉시 DB 값 조회
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || '');
        setUserId(session.user.id);
        fetchUserTokens(session.user.id); // 상태가 바뀔 때도 DB 동기화
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
        setUserId('');
        setTokens(0);
        setStep('INPUT');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ⚠️ [삭제됨] 하드코딩으로 setTokens(3) 하던 두 번째 useEffect 제거

  const mockRefinedCookies = [
    { id: 1, shapeClass: "bg-[#8D6E63]", clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)", text: "🔍 Analyze the core impact of recent tech changes with a timeline." },
    { id: 2, shapeClass: "bg-[#C68B59]", clipPath: "circle(50% at 50% 50%)", text: "💡 Summarize the industry pros and cons in a simple 3-line breakdown." },
    { id: 3, shapeClass: "bg-[#D7A15C]", clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)", text: "📊 Extract visual statistics and data points from this trend." }
  ];

  const handleInteraction = () => {
    if (!isLoggedIn) {
      setIsModalOpen(true);
      return false;
    }
    return true;
  };

  const handleBakeSubmit = () => {
    if (!handleInteraction()) return;
    if (!query.trim()) return;

    setStep('BAKING');
    setTimeout(() => {
      setStep('RESULTS');
    }, 1500);
  };

  const handleSelectQuery = (refinedText: string) => {
    if (tokens >= 1) {
      setTokens((prev) => prev - 1);
      alert(`🍪 [1 Token Used!] Opening result for:\n"${refinedText}"`);
    } else {
      setIsWaitlistModalOpen(true);
    }
  };

  const handleWaitlistSubmit = async () => {
    if (hasVoted || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      localStorage.setItem('news_cookie_voted_waitlist', 'true');
      setHasVoted(true);
      alert("💖 Thank you for voting! Your interest speeds up our official launch.");
      setIsWaitlistModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}` },
      });
      if (error) throw error;
    } catch (e) {
      console.error(e);
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
  };

  return (
      <main className="min-h-screen bg-[#FAF6F0] text-[#3E2723] flex flex-col items-center justify-between font-sans p-6 relative">
        <div className="w-full max-w-3xl flex justify-end items-center z-30 pt-2">
          {isLoggedIn ? (
              <div className="flex items-center gap-3 animate-fade-in">
                <div className="text-xs font-bold bg-[#EADCC9] px-3 py-1.5 rounded-full text-[#5D4037] select-none">
                  ⚡ Pantry: <span className="text-[#C68B59] font-black">{tokens}</span> EA
                </div>
                <div className="text-sm font-bold bg-[#F0E5D8] px-4 py-2 rounded-full border border-[#D7C4B1] text-[#A0522D] shadow-sm flex items-center gap-2">
                  <span>{userEmail.split('@')[0]} 🧑‍🍳</span>
                  <button onClick={handleLogout} className="text-[11px] text-red-600 hover:underline font-normal ml-1">
                    Logout
                  </button>
                </div>
              </div>
          ) : (
              <button onClick={() => setIsModalOpen(true)} className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity bg-[#F0E5D8] px-3 py-1.5 rounded-full border border-[#D7C4B1]">
                Hello unknown Baker 👤
              </button>
          )}
        </div>

        <div className={`w-full text-center flex flex-col items-center gap-8 relative z-0 my-auto transition-all duration-300 ${step === 'RESULTS' ? 'max-w-3xl' : 'max-w-md'}`}>
          <h1 className="text-6xl font-extrabold tracking-tight select-none drop-shadow-sm text-[#4E342E]">
            News <span className="text-[#C68B59]">Cookie</span>
          </h1>

          {step === 'INPUT' && (
              <div className="w-full flex flex-col gap-3 animate-fade-in">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onClick={handleInteraction}
                    placeholder="What kind of cookie do you want to bake? Enter your query..."
                    className="w-full px-5 py-4 rounded-xl bg-white border-2 border-[#D7C4B1] text-[#3E2723] placeholder-[#A1887F] focus:outline-none focus:border-[#C68B59] focus:ring-2 focus:ring-[#C68B59]/20 transition-all shadow-inner text-base"
                />
                <button onClick={handleBakeSubmit} className="w-full bg-[#C68B59] text-white font-bold py-4 rounded-xl hover:bg-[#B37A49] active:scale-[0.99] transition-all shadow-md">
                  Bake your Cookie 🍪
                </button>
              </div>
          )}

          {step === 'BAKING' && (
              <div className="py-6 text-center space-y-4 animate-pulse">
                <span className="text-5xl inline-block animate-spin duration-1000">⏳</span>
                <h2 className="text-xl font-bold text-[#4E342E]">Baking your query into cookies...</h2>
                <p className="text-xs text-[#8D6E63]">Formulating 3 refined option shapes from LLM oven.</p>
              </div>
          )}

          {step === 'RESULTS' && (
              <div className="w-full flex flex-col gap-6 animate-scale-up">
                <div className="text-center">
                  <p className="text-xs font-bold text-[#C68B59] tracking-wider uppercase">Baking Complete</p>
                  <h3 className="text-2xl font-black text-[#4E342E] mt-0.5">Select one cookie shape to taste</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {mockRefinedCookies.map((cookie, index) => (
                      <button key={cookie.id} onClick={() => handleSelectQuery(cookie.text)} className="bg-white border-2 border-[#D7C4B1] rounded-3xl p-6 flex flex-col items-center hover:border-[#C68B59] hover:bg-[#FFFDFB] transition-all active:scale-[0.98] shadow-sm hover:shadow-md group">
                        <div className="w-24 h-24 flex items-center justify-center relative mb-6">
                          <div className={`w-20 h-20 ${cookie.shapeClass} opacity-90 group-hover:scale-105 transition-transform duration-300 shadow-sm`} style={{ clipPath: cookie.clipPath }} />
                          <div className="absolute top-[35%] left-[35%] w-2 h-2 bg-[#3e1e11] rounded-full opacity-60" />
                          <div className="absolute top-[55%] left-[55%] w-2.5 h-2.5 bg-[#2c1308] rounded-full opacity-70" />
                          <div className="absolute top-[60%] left-[30%] w-2 h-2 bg-[#3e1e11] rounded-full opacity-60" />
                        </div>
                        <div className="w-full text-center border-t border-[#FAF6F0] pt-4 flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#C68B59] uppercase">Shape Option 0{index + 1}</span>
                          <p className="text-xs font-semibold text-[#3E2723] leading-relaxed line-clamp-3">{cookie.text}</p>
                        </div>
                      </button>
                  ))}
                </div>

                <button onClick={() => { setQuery(''); setStep('INPUT'); }} className="text-xs text-[#8D6E63] hover:underline text-center mt-2">
                  ← Back to Prep Bench
                </button>
              </div>
          )}
        </div>

        <footer className="w-full max-w-3xl text-center pt-8 pb-2 border-t border-[#EADCC9] text-xs text-[#8D6E63] font-medium flex flex-col sm:flex-row justify-between items-center gap-2 relative z-10">
          <p>© 2026 News Cookie. All rights reserved.</p>
          <a href={`mailto:${feedbackEmail}?subject=${mailSubject}&body=${mailBody}`} className="text-[#C68B59] hover:text-[#B37A49] font-bold transition-colors underline underline-offset-4">
            💬 Send Us Feedback
          </a>
        </footer>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
              <div className="bg-[#FAF6F0] border-2 border-[#D7C4B1] p-8 rounded-2xl max-w-xs w-full text-center shadow-2xl relative z-10 flex flex-col items-center gap-6">
                <div>
                  <h2 className="text-xl font-bold text-[#4E342E] mb-1">Start Baking!</h2>
                  <p className="text-xs text-[#8D6E63]">Please sign in to get 3 FREE starter tokens</p>
                </div>
                <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3 px-4 border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all text-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Login with Google</span>
                </button>
                <button onClick={() => setIsModalOpen(false)} className="text-xs text-[#8D6E63] hover:underline">Maybe later</button>
              </div>
            </div>
        )}

        {isWaitlistModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="absolute inset-0" onClick={() => setIsWaitlistModalOpen(false)} />
              <div className="bg-[#FAF6F0] border-2 border-[#D7C4B1] p-6 rounded-3xl max-w-sm w-full shadow-2xl relative z-10 flex flex-col gap-4 text-center items-center">
                <span className="text-4xl">🔋</span>
                <div>
                  <h3 className="text-xl font-black text-[#4E342E]">Free Tokens Expired</h3>
                  <p className="text-xs text-[#8D6E63] mt-2 leading-relaxed">
                    You have used all 3 free starter tokens! <br/>
                    We are currently polishing additional features. Leave your feedback to help us grow!
                  </p>
                </div>
                <button onClick={handleWaitlistSubmit} disabled={hasVoted || isSubmitting} className={`w-full font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1 ${hasVoted ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#66BB6A] hover:bg-[#57A75B] text-white active:scale-[0.99]'}`}>
                  {isSubmitting ? <span>Submitting...</span> : hasVoted ? <span>✓ Already Submitted! Thanks!</span> : <span>I want more tokens! 👍</span>}
                </button>
                <button onClick={() => setIsWaitlistModalOpen(false)} className="text-xs text-[#8D6E63] hover:underline">Close</button>
              </div>
            </div>
        )}
      </main>
  );
}