'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from 'next-themes';
import { Plan, paymentService } from '@/services/payment.service';
import { DEFAULT_FEATURES } from '@/constants/plan.constants';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Scale,
  Sun,
  Moon,
  ArrowRight,
  Check,
  Zap,
  Shield,
  MessageSquare,
  Mic,
  FileText,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Play,
  Pause,
  Volume2,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { Persona, personaService } from '@/services/persona.service';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Personas state
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personasLoading, setPersonasLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(
    null
  );

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // User dropdown menu state
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Persona selection states
  const [activePersonaIdx, setActivePersonaIdx] = useState<number>(0);
  const activePersona = personas[activePersonaIdx];

  // Stop playing audio when active persona changes
  useEffect(() => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
      setPlayingId(null);
    }
  }, [activePersonaIdx]);

  useEffect(() => {
    setMounted(true);
    fetchPlans();
    fetchPersonas();
  }, []);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (playingAudio) {
        playingAudio.pause();
      }
    };
  }, [playingAudio]);

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      await paymentService.getPlans(0, 10, (data) => {
        const activePlans = data.filter((p) => p.isActive);
        setPlans(activePlans);
        setPlansLoading(false);
      });
    } catch (error) {
      console.error('Failed to fetch plans on landing page:', error);
      setPlans([]);
      setPlansLoading(false);
    }
  };

  const fetchPersonas = async () => {
    try {
      setPersonasLoading(true);
      await personaService.getPersonas(1, 100, undefined, (res) => {
        if (res && res.items && res.items.length > 0) {
          setPersonas(res.items.filter((item) => item.is_active));
        } else {
          setPersonas([]);
        }
        setPersonasLoading(false);
      });
    } catch (error) {
      console.error('Failed to fetch personas on landing page:', error);
      setPersonas([]);
      setPersonasLoading(false);
    }
  };

  const togglePlayAudio = (id: string, url: string) => {
    if (playingId === id) {
      playingAudio?.pause();
      setPlayingAudio(null);
      setPlayingId(null);
    } else {
      if (playingAudio) {
        playingAudio.pause();
      }
      const audio = new Audio(url);
      audio.onended = () => {
        setPlayingId(null);
        setPlayingAudio(null);
      };
      setPlayingId(id);
      setPlayingAudio(audio);
      audio.play();
    }
  };

  const handlePersonaChat = (persona: Persona) => {
    try {
      const rawSettings = localStorage.getItem('user_settings');
      const settings = rawSettings ? JSON.parse(rawSettings) : {};
      settings.selectedPersonaId = persona.id;
      localStorage.setItem('user_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to set selected persona settings:', e);
    }

    if (isAuthenticated) {
      router.push('/chat');
    } else {
      router.push('/login?redirect=/chat');
    }
  };

  const handleCtaClick = () => {
    if (isAuthenticated) {
      router.push('/chat');
    } else {
      router.push('/login');
    }
  };

  const handlePlanCta = (planId: string) => {
    if (isAuthenticated) {
      router.push('/plans');
    } else {
      router.push(`/login?redirect=/plans`);
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-350 selection:bg-blue-500/30">
      {/* Dynamic colorful blobs behind content */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-1/4 w-[30rem] h-[30rem] bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[60%] left-10 w-80 h-80 bg-cyan-400/10 dark:bg-cyan-600/5 rounded-full blur-[90px] pointer-events-none -z-10" />

      {/* HEADER / NAVBAR */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-md shadow-blue-500/10 group-hover:scale-105 transition-all">
              <Scale className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg md:text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-850 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
              Pháp Luật{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                AI
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-350">
            <a
              href="#intro"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Giới thiệu
            </a>
            <a
              href="#features"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Tính năng
            </a>
            <a
              href="#pricing"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Bảng giá
            </a>
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Auth section */}
            {authLoading ? (
              <Skeleton className="w-28 h-10 rounded-xl" />
            ) : isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer shadow-sm"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold max-w-[90px] truncate">
                    {user.name}
                  </span>
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <Link
                      href="/chat"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      Vào trò chuyện
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      Trang cá nhân
                    </Link>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={() => router.push('/login')}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold px-5 h-10 rounded-xl cursor-pointer shadow-sm transition-all"
              >
                Đăng nhập
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5" />
              ) : (
                <Moon className="w-4.5 h-4.5" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-750 dark:text-slate-250"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 px-4 py-4 space-y-3 shadow-lg">
            <nav className="flex flex-col gap-3 font-semibold text-slate-600 dark:text-slate-350">
              <a
                href="#intro"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-blue-500"
              >
                Giới thiệu
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-blue-500"
              >
                Tính năng
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-blue-500"
              >
                Bảng giá
              </a>
            </nav>
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
            {isAuthenticated && user ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 px-1 py-1">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold truncate max-w-[150px]">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push('/chat');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-9 rounded-lg"
                  >
                    Vào Chat
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await logout();
                    }}
                    className="w-full h-9 rounded-lg"
                  >
                    Đăng xuất
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/login');
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-10 rounded-xl"
              >
                Đăng nhập
              </Button>
            )}
          </div>
        )}
      </header>

      {/* HERO SECTION / INTRO */}
      <section
        id="intro"
        className="container mx-auto px-4 md:px-8 pt-16 pb-20 md:pt-28 md:pb-28"
      >
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center space-y-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-center">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-500 bg-clip-text text-transparent">
              Tư vấn Pháp lý
            </span>{' '}
            vượt trội
          </h1>

          <p className="text-base md:text-lg text-slate-650 dark:text-slate-350 leading-relaxed max-w-2xl mx-auto">
            Giải pháp đột phá hỗ trợ hỏi đáp nhanh mọi quy định pháp luật Việt
            Nam, phân tích chuyên sâu rủi ro hợp đồng, và trò chuyện trực tiếp
            qua giọng nói 24/7.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <Button
              onClick={handleCtaClick}
              className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              {isAuthenticated ? 'Vào Trò Chuyện Ngay' : 'Trải Nghiệm Miễn Phí'}
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <a
              href="#pricing"
              className="w-full sm:w-auto h-12 px-8 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-850/50 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              Xem Bảng Giá Gói VIP
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section
        id="features"
        className="py-20 bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/30 dark:border-slate-900/30"
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            {/* <h2 className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
              Ưu Điểm Vượt Trội
            </h2> */}
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Tính Năng Hỗ Trợ Pháp Lý Toàn Diện
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
              Chúng tôi tích hợp các công nghệ trí tuệ nhân tạo nhằm đem lại
              trải nghiệm sâu sắc và thân thiện.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5.5xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-350 shadow-inner">
                <Scale className="w-5.5 h-5.5" />
              </div>
              <h4 className="text-lg font-bold mb-3">
                Suy luận Chuyên sâu (Reasoning)
              </h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Hệ thống AI nâng cao tự động suy luận, trích dẫn chính xác nguồn
                văn bản quy phạm pháp luật, giảm thiểu tối đa hiện tượng ảo
                tưởng của AI thông thường.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-350 shadow-inner">
                <Mic className="w-5.5 h-5.5" />
              </div>
              <h4 className="text-lg font-bold mb-3">
                Voice Chat Thời gian thực
              </h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Tương tác bằng giọng nói tự nhiên với phản hồi trôi chảy, ấm áp
                của trợ lý ảo pháp luật. Thích hợp khi bạn đang di chuyển hoặc
                cần tư vấn nhanh gọn.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="w-12 h-12 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-350 shadow-inner">
                <FileText className="w-5.5 h-5.5" />
              </div>
              <h4 className="text-lg font-bold mb-3">
                Phân tích Hợp đồng & Tài liệu
              </h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Tải lên các mẫu hợp đồng, văn bản thỏa thuận. AI sẽ nhanh chóng
                quét tìm lỗ hổng pháp lý, điều khoản mập mờ và đưa ra giải pháp
                sửa đổi tối ưu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PERSONAS SECTION (Nhân vật tư vấn) */}
      {!personasLoading && personas.length > 0 && (
        <section
          id="personas"
          className="py-20 md:py-28 container mx-auto px-4 md:px-8 bg-slate-100/30 dark:bg-slate-900/10 border-y border-slate-200/20 dark:border-slate-800/10"
        >
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            {/* <h2 className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
            Nhân Vật Trợ Lý AI
          </h2> */}
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Trò Chuyện Thử Với Trợ Lý Pháp Lý
            </h3>
            <p className="text-slate-650 dark:text-slate-400 text-sm md:text-base">
              Nghe thử giọng nói và đặt câu hỏi trực tiếp để trải nghiệm khả
              năng tư vấn của các trợ lý ảo.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            {/* Centered Profile Card: Styled like app/chat/page.tsx's overlay selector */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl min-h-[520px]">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
              <div className="absolute -right-24 -bottom-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Left/Right Switcher Arrows on the sides of the profile card */}
              {personas.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      setActivePersonaIdx(
                        (prev) => (prev - 1 + personas.length) % personas.length
                      );
                    }}
                    className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 p-2 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all cursor-pointer z-10"
                    aria-label="Previous persona"
                  >
                    <ChevronLeft size={36} />
                  </button>
                  <button
                    onClick={() => {
                      setActivePersonaIdx(
                        (prev) => (prev + 1) % personas.length
                      );
                    }}
                    className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 p-2 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all cursor-pointer z-10"
                    aria-label="Next persona"
                  >
                    <ChevronRight size={36} />
                  </button>
                </>
              )}

              {/* Avatar with Glow Background */}
              <div className="relative mb-6 flex flex-col items-center">
                <div className="absolute inset-0 bg-blue-500/25 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-48 h-48 rounded-full border-4 border-blue-500/30 overflow-hidden shadow-2xl shadow-blue-500/20">
                  {activePersona?.avatar_url ? (
                    <img
                      src={activePersona.avatar_url}
                      alt={activePersona.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <UserIcon
                        size={56}
                        className="text-slate-450 dark:text-slate-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Name & Gender Badge */}
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight flex items-center gap-2.5">
                {activePersona?.name}
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-200 dark:border-slate-700 font-semibold py-0.5 px-2 text-[10px] tracking-wide rounded-md">
                  {activePersona?.gender || 'AI'}
                </Badge>
              </h3>

              {/* Voice & Personality Description */}
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm mb-8 leading-relaxed">
                {activePersona?.description ||
                  'Giọng nói AI hỗ trợ tư vấn pháp luật 24/7.'}
              </p>

              {/* Action Buttons: Play Preview and Select/Redirect */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <Button
                  onClick={() =>
                    togglePlayAudio(
                      activePersona.id,
                      activePersona.greeting_audio_url || ''
                    )
                  }
                  size="lg"
                  className="w-full sm:w-auto h-12 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  disabled={!activePersona?.greeting_audio_url}
                >
                  {playingId === activePersona?.id ? (
                    <>
                      <Pause className="w-4 h-4 text-blue-500 fill-blue-500 animate-pulse" />
                      <span className="text-blue-500 dark:text-blue-400 font-bold">
                        Đang phát tiếng
                      </span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-slate-500 dark:text-slate-300 fill-current" />
                      <span className="text-slate-700 dark:text-slate-300 font-bold">
                        Nghe thử
                      </span>
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handlePersonaChat(activePersona)}
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-extrabold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer border-0 active:scale-[0.98]"
                >
                  <span>Vào trò chuyện</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PRICING SECTION (Bảng giá các gói cước) */}
      {!plansLoading && plans.length > 0 && (
        <section
          id="pricing"
          className="py-20 md:py-28 container mx-auto px-4 md:px-8"
        >
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            {/* <h2 className="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            Gói Đăng Ký
          </h2> */}
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Mở Khóa Sức Mạnh Trí Tuệ Nhân Tạo
            </h3>
            <p className="text-slate-650 dark:text-slate-400 text-sm md:text-base">
              Lựa chọn gói cước VIP để gia tăng hiệu suất tra cứu luật và rà
              soát pháp lý của bạn ngay hôm nay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan) => {
              const features = plan.features?.length
                ? plan.features
                : DEFAULT_FEATURES;

              return (
                <Card
                  key={plan.id}
                  className="relative flex flex-col border transition-all duration-300 rounded-3xl overflow-hidden shadow-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-750 hover:shadow-lg"
                >
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold px-2.5 py-0.5 uppercase text-[9px] tracking-wider border-0">
                      {plan.durationMonths} tháng
                    </Badge>
                  </div>

                  <CardHeader className="pb-4 pt-12 px-8 flex flex-col items-center text-center">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                      {plan.name}
                    </CardTitle>
                    <div className="mt-4 flex flex-col items-center">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-extrabold tracking-tighter">
                          {formatCurrency(plan.price).replace('₫', '').trim()}
                        </span>
                        <span className="text-xl font-bold ml-1 text-slate-500 dark:text-slate-400">
                          ₫
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Mua trọn gói {plan.durationMonths} tháng
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow px-8 pt-4 pb-8">
                    <div className="h-px w-full bg-slate-200 dark:bg-slate-800 mb-6" />
                    <ul className="space-y-4">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full mt-0.5 shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            <Check className="w-3 h-3 stroke-[3px]" />
                          </div>
                          <span className="text-sm text-slate-650 dark:text-slate-350">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="px-8 pb-8 pt-0 mt-auto">
                    <Button
                      className="w-full text-xs font-bold h-11 uppercase tracking-[0.1em] transition-all duration-300 rounded-xl cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-750"
                      onClick={() => handlePlanCta(plan.id)}
                    >
                      <Zap className="w-3.5 h-3.5 mr-2 fill-current" />
                      Nâng cấp ngay
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-250 dark:border-slate-850 py-12 transition-colors">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <Scale className="w-4 h-4" />
              </div>
              <span className="font-bold text-base">Pháp Luật AI</span>
            </div>

            <p className="text-xs text-slate-500 text-center md:text-right">
              &copy; {new Date().getFullYear()} Pháp Luật AI. Tất cả quyền được
              bảo lưu.
              <br className="md:hidden" />
              <Link href="#" className="underline ml-2 hover:text-slate-700">
                Điều khoản
              </Link>{' '}
              |
              <Link href="#" className="underline ml-1 hover:text-slate-700">
                Bảo mật
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
