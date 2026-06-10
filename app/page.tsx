"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play, Sparkles, Mic, LayoutTemplate, FileText, ChevronRight, ChevronLeft,
  Loader2, CheckCircle2, GraduationCap, Target, Users, TrendingUp, Info,
  Quote, Zap, BarChart3, Layers, ArrowLeft, Image as ImageIcon, Palette,
  Settings, X, Check, Cpu, HeartPulse, BookOpen, Lightbulb, AlertTriangle,
  CheckSquare, Globe, Maximize2
} from 'lucide-react';

// ============================================================================
// CONSTANTS — defined outside component so they never recreate on render
// ============================================================================
const KNOWN_LAYOUTS = [
  'title', 'bullets', 'comparison', 'big_number', 'process',
  'quote', 'timeline', 'stats_grid', 'hero_statement', 'image_focus', 'diagram'
];

// ============================================================================
// THEME CONFIGURATION
// ============================================================================
interface ThemeConfig {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  radius: string;
  border: string;
  fontFamily: string;
  bgGradient?: string;
}

const THEMES: Record<string, ThemeConfig> = {
  academic: {
    id: 'academic', name: 'University',
    primary: '#16A34A', secondary: '#2563EB',
    background: '#F8FAFC', surface: '#FFFFFF',
    text: '#0F172A', textMuted: '#64748B',
    radius: '24px', border: '1px solid rgba(226, 232, 240, 1)',
    fontFamily: "'Inter', 'Noto Sans Arabic', sans-serif"
  },
  business: {
    id: 'business', name: 'Corporate',
    primary: '#0F172A', secondary: '#475569',
    background: '#F1F5F9', surface: '#FFFFFF',
    text: '#1E293B', textMuted: '#94A3B8',
    radius: '8px', border: '1px solid rgba(203, 213, 225, 1)',
    fontFamily: "'Inter', 'Noto Sans Arabic', sans-serif"
  },
  kurdishHeritage: {
    id: 'kurdishHeritage', name: 'Kurdish Heritage',
    primary: '#EAB308', secondary: '#DC2626',
    background: '#FEFCE8', surface: '#14532D',
    text: '#FFFFFF', textMuted: '#FEF08A',
    radius: '16px', border: '1px solid rgba(234, 179, 8, 0.3)',
    fontFamily: "'Noto Sans Arabic', sans-serif"
  },
  elegantDark: {
    id: 'elegantDark', name: 'Elegant Dark',
    primary: '#8B5CF6', secondary: '#22D3EE',
    background: '#090D16', surface: '#111827',
    text: '#F9FAFB', textMuted: '#9CA3AF',
    radius: '28px', border: '1px solid rgba(255, 255, 255, 0.08)',
    fontFamily: "'Inter', 'Noto Sans Arabic', sans-serif",
    bgGradient: 'linear-gradient(135deg, #111827 0%, #090D16 100%)'
  },
  minimal: {
    id: 'minimal', name: 'Minimal',
    primary: '#000000', secondary: '#666666',
    background: '#FFFFFF', surface: '#FAFAFA',
    text: '#111111', textMuted: '#888888',
    radius: '0px', border: '1px solid #111111',
    fontFamily: "'Inter', 'Noto Sans Arabic', sans-serif"
  }
};

// ============================================================================
// DATA INTERFACES
// ============================================================================
interface SectionPlan {
  title: string;
  purpose: string;
  importance: 'high' | 'medium' | 'low';
  recommendedLayout: string;
  keyPoints: string[];
  transition?: 'build_up' | 'contrast' | 'emphasis' | 'summary'; // optional — AI sometimes omits
}

interface PresentationPlan {
  audience: string;
  goal: string;
  sections: SectionPlan[];
}

interface SlideData {
  type: string;
  title?: string;
  subtitle?: string;
  content?: string;
  bullets?: string[];
  leftTitle?: string;
  leftBullets?: string[];
  rightTitle?: string;
  rightBullets?: string[];
  steps?: string[];
  icon?: string;
  quote?: string;
  author?: string;
  events?: { year: string; title: string; description: string }[];
  stats?: { label: string; value: string; icon: string }[];
  statement?: string;
  imagePrompt?: string;
  overlayText?: string;
  nodes?: string[];
  connections?: string[];
  visualWeight?: 'light' | 'balanced' | 'heavy';
  transition?: string;
}

// ============================================================================
// VISUAL WEIGHT HELPER — always returns a string, never undefined
// ============================================================================
function getWeightClasses(
  weight: string | undefined,
  type: 'container' | 'title' | 'spacing'
): string {
  const w = weight || 'balanced';
  if (type === 'container') {
    if (w === 'light') return 'px-4 md:px-24 pb-12 md:pb-20';
    if (w === 'heavy') return 'px-4 md:px-10 pb-6 md:pb-10';
    return 'px-4 md:px-16 pb-8 md:pb-16'; // balanced
  }
  if (type === 'title') {
    if (w === 'light') return 'text-3xl tracking-wide';
    if (w === 'heavy') return 'text-5xl font-black';
    return 'text-4xl font-extrabold'; // balanced
  }
  if (type === 'spacing') {
    if (w === 'light') return 'gap-8 mb-10';
    if (w === 'heavy') return 'gap-3 mb-5';
    return 'gap-4 mb-7'; // balanced
  }
  return '';
}

// ============================================================================
// POLLINATIONS IMAGE URL — safe query param construction
// ============================================================================
function pollinationsUrl(prompt: string, seed: number): string {
  const base = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
  const params = new URLSearchParams({
    width: '800', height: '450', nologo: 'true', seed: String(seed)
  });
  return `${base}?${params.toString()}`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function App() {
  const [inputText, setInputText] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig>(THEMES.academic);

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [presentationPlan, setPresentationPlan] = useState<PresentationPlan | null>(null);

  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [activeTab, setActiveTab] = useState('slides');
  const [podcast, setPodcast] = useState('');
  const [isProcessing, setIsProcessing] = useState({ enhance: false, podcast: false });

  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [savedKeyExists, setSavedKeyExists] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load saved API key on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('groq_api_key') || '';
      setTempApiKey(storedKey);
      setSavedKeyExists(!!storedKey);
    }
  }, []);

  // Keyboard navigation for slides (step 3)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (currentStep !== 3) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      setCurrentSlide(p => Math.min(slides.length - 1, p + 1));
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      setCurrentSlide(p => Math.max(0, p - 1));
    }
    if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    }
    if (e.key === 'Escape') {
      setIsFullscreen(false);
    }
  }, [currentStep, slides.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(f => !f);
  };

  const saveApiKey = () => {
    localStorage.setItem('groq_api_key', tempApiKey.trim());
    setSavedKeyExists(!!tempApiKey.trim());
    setShowSettings(false);
  };

  const clearApiKey = () => {
    localStorage.removeItem('groq_api_key');
    setTempApiKey('');
    setSavedKeyExists(false);
  };

  // ============================================================================
  // ICON RENDERER
  // ============================================================================
  const IconRenderer = ({ name, className, customStyle }: {
    name?: string; className: string; customStyle?: React.CSSProperties;
  }) => {
    switch (name?.toLowerCase()) {
      case 'target':    return <Target className={className} style={customStyle} />;
      case 'users':     return <Users className={className} style={customStyle} />;
      case 'trend':     return <TrendingUp className={className} style={customStyle} />;
      case 'zap':       return <Zap className={className} style={customStyle} />;
      case 'chart':     return <BarChart3 className={className} style={customStyle} />;
      case 'info':      return <Info className={className} style={customStyle} />;
      case 'quote':     return <Quote className={className} style={customStyle} />;
      case 'education': return <BookOpen className={className} style={customStyle} />;
      case 'tech':      return <Cpu className={className} style={customStyle} />;
      case 'health':    return <HeartPulse className={className} style={customStyle} />;
      case 'idea':      return <Lightbulb className={className} style={customStyle} />;
      case 'warning':   return <AlertTriangle className={className} style={customStyle} />;
      case 'success':   return <CheckSquare className={className} style={customStyle} />;
      case 'global':    return <Globe className={className} style={customStyle} />;
      default:          return <CheckCircle2 className={className} style={customStyle} />;
    }
  };

  // ============================================================================
  // ✅ FIXED: callGeminiAPI — ALWAYS routes through /api/gemini proxy
  // Never calls Google directly from the browser (prevents geo-block 400 errors)
  // ============================================================================
  const callGeminiAPI = async (systemPrompt: string, userContent: string): Promise<string> => {
    const customKey =
      typeof window !== 'undefined'
        ? localStorage.getItem('groq_api_key') || ''
        : '';

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
        customKey, // route.ts uses this if GEMINI_API_KEY env var isn't set
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || data.text || '';
  };

  // ============================================================================
  // ACTIONS
  // ============================================================================
  const enhanceText = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(p => ({ ...p, enhance: true }));
    try {
      const result = await callGeminiAPI(
        "You are an expert Kurdish (Sorani) academic editor. Rewrite the given text to be extremely professional, clear, grammatically flawless, and suitable for a university-level presentation. Respond ONLY with the enhanced Kurdish text.",
        inputText
      );
      setInputText(result.trim());
    } catch {
      alert("ببوورە، کێشەیەک لە باشترکردنی دەقەکەدا ڕوویدا. دڵنیابە لە کۆدی API.");
    } finally {
      setIsProcessing(p => ({ ...p, enhance: false }));
    }
  };

  const generatePodcast = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(p => ({ ...p, podcast: true }));
    setActiveTab('podcast');
    setPodcast('');
    try {
      const result = await callGeminiAPI(
        `Create an engaging 2-person academic podcast discussion in Kurdish Sorani based on the provided text. Format as clean semantic HTML. Speaker 1 uses blue styling, Speaker 2 uses green. RTL layout throughout.`,
        inputText
      );
      setPodcast(result.replace(/```html\n?|\n?```/g, '').trim());
    } catch {
      alert("کێشەیەک لە دروستکردنی پۆدکاستەکەدا ڕوویدا.");
    } finally {
      setIsProcessing(p => ({ ...p, podcast: false }));
    }
  };

  const generateOutlinePlan = async () => {
    if (!inputText.trim()) return;
    setIsGeneratingPlan(true);
    setPresentationPlan(null);
    setSlides([]);

    const systemPrompt = `You are an elite academic presentation strategist. Analyze the Kurdish input text and create a professional presentation plan.
Output ONLY a valid JSON object — no markdown fences:
{
  "audience": "string",
  "goal": "string",
  "sections": [
    {
      "title": "Kurdish title",
      "purpose": "Kurdish purpose",
      "importance": "high"|"medium"|"low",
      "recommendedLayout": "title"|"bullets"|"comparison"|"big_number"|"process"|"quote"|"timeline"|"stats_grid"|"hero_statement"|"image_focus"|"diagram",
      "keyPoints": ["Point 1", "Point 2"],
      "transition": "build_up"|"contrast"|"emphasis"|"summary"
    }
  ]
}
RULES: Exactly ${slideCount} sections. Kurdish Sorani language. Logical narrative arc.`;

    try {
      const text = await callGeminiAPI(systemPrompt, inputText);
      let clean = text.replace(/```json\n?|\n?```/gi, '').trim();
      clean = clean.substring(clean.indexOf('{'), clean.lastIndexOf('}') + 1);
      setPresentationPlan(JSON.parse(clean));
      setCurrentStep(2);
    } catch {
      alert("کێشەیەک لە خوێندنەوەی پلانەکەدا ڕوویدا. دووبارە تاقی بکەرەوە.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const generateSlidesFromPlan = async () => {
    if (!presentationPlan) return;
    setIsGeneratingSlides(true);
    setSlides([]);
    setCurrentSlide(0);

    const systemPrompt = `You are a world-class Kurdish (Sorani) presentation designer.
RULES:
1. Fixed 16:9 canvas — all text must be short and concise.
2. Output ONLY a raw JSON array. No markdown fences.
3. Assign "visualWeight": "light"|"balanced"|"heavy" per slide.
4. Preserve "transition" from the outline.
5. Use semantic icons: "education","tech","health","idea","warning","success","global","target","users","trend","chart".

EXACT JSON STRUCTURES PER TYPE:
- title:         { type, title, subtitle, visualWeight, transition }
- bullets:       { type, title, bullets[], icon, visualWeight, transition }
- comparison:    { type, title, leftTitle, leftBullets[], rightTitle, rightBullets[], visualWeight, transition }
- big_number:    { type, title, content, subtitle, visualWeight, transition }
- process:       { type, title, steps[], visualWeight, transition }
- quote:         { type, quote, author, visualWeight, transition }
- timeline:      { type, title, events[{year,title,description}], visualWeight, transition }
- stats_grid:    { type, title, stats[{label,value,icon}], visualWeight, transition }
- hero_statement:{ type, statement, visualWeight, transition }
- image_focus:   { type, title, imagePrompt, overlayText, visualWeight, transition }
- diagram:       { type, title, nodes[], connections[], visualWeight, transition }`;

    try {
      const planString = `Audience: ${presentationPlan.audience}. Goal: ${presentationPlan.goal}. Sections: ${JSON.stringify(presentationPlan.sections)}`;
      const text = await callGeminiAPI(systemPrompt, planString);
      let clean = text.replace(/```json\n?|\n?```/gi, '').trim();
      clean = clean.substring(clean.indexOf('['), clean.lastIndexOf(']') + 1);
      setSlides(JSON.parse(clean));
      setCurrentStep(3);
    } catch (err) {
      console.error(err);
      alert("هەڵەیەک لە داڕشتنی سلایدەکاندا ڕوویدا. تکایە دووبارە تاقی بکەرەوە.");
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  // ============================================================================
  // SLIDE THUMBNAIL — mini preview used in sidebar
  // ============================================================================
  const SlideThumbnail = ({ slide, index, isActive, theme, onClick }: {
    slide: SlideData; index: number; isActive: boolean; theme: ThemeConfig; onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl overflow-hidden border-2 transition-all shrink-0"
      style={{
        borderColor: isActive ? theme.primary : 'transparent',
        background: theme.bgGradient || theme.background,
        boxShadow: isActive ? `0 0 0 3px ${theme.primary}40` : 'none',
      }}
    >{/* Modern Ambient Glow Blobs */}
    <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none bg-blue-500 mixed-blend-multiply" />
    <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-[100px] opacity-15 pointer-events-none bg-purple-500 mixed-blend-multiply" />
      <div className="relative" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex flex-col justify-center items-center p-2 gap-1 overflow-hidden">
          <div className="text-[7px] font-black opacity-60 uppercase tracking-wide truncate w-full text-center kurdish-text"
            style={{ color: theme.text }}>{slide.type}</div>
          <div className="text-[8px] font-bold leading-tight text-center line-clamp-2 kurdish-text"
            style={{ color: theme.text }}>
            {slide.title || slide.statement || slide.quote || '—'}
          </div>
        </div>
        {/* Slide number badge */}
        <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black"
          style={{ backgroundColor: isActive ? theme.primary : theme.textMuted, color: '#fff' }}>
          {index + 1}
        </div>
      </div>
    </button>
  );

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Noto+Sans+Arabic:wght@400;500;600;700;800;900&display=swap');
        .kurdish-text { font-family: 'Noto Sans Arabic', sans-serif; }
        .shadow-academic { box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .slide-stage { aspect-ratio: 16 / 9; width: 100%; }
        .thumb-scroll::-webkit-scrollbar { width: 4px; }
        .thumb-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}} />

      {/* ------------------------------------------------------------------ */}
      {/* NAVBAR                                                               */}
      {/* ------------------------------------------------------------------ */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#16A34A]/10 p-2 rounded-xl text-[#16A34A]"><GraduationCap className="w-6 h-6" /></div>
          <span className="font-bold text-xl tracking-tight">KurdishAI <span className="text-slate-400 font-medium">Studio</span></span>
        </div>

        <div className="hidden md:flex items-center gap-5 text-sm font-semibold">
          {[['دەستپێکردن', 1], ['داڕشتنی پلان', 2], ['پێشبینینی سلاید', 3]].map(([label, step]) => (
            <React.Fragment key={step}>
              {Number(step) > 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
              <div className={`flex items-center gap-2 ${currentStep === step ? 'text-[#16A34A]' : 'text-slate-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === step ? 'bg-[#16A34A] text-white' : 'bg-slate-100'}`}>{step}</span>
                {label}
              </div>
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${savedKeyExists ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs font-bold hidden sm:inline">Settings</span>
        </button>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* SETTINGS MODAL                                                       */}
      {/* ------------------------------------------------------------------ */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl relative mx-4">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-500" /> تایبەتمەندییەکانی سیستەم</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">کلیلی Gemini API لێرە دابنێ. ئەمە لەسەر سێرڤەرەکەدا بەکاردێت، نەک لە براوزەرەکەت — ئەمە جیاوازیەکی گرنگە.</p>
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Gemini API Key</label>
              <input type="password" value={tempApiKey} onChange={e => setTempApiKey(e.target.value)} placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#16A34A] font-mono" />
              {savedKeyExists && <span className="text-[10px] text-green-600 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> کلیلی API پاشەکەوت کراوە!</span>}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={clearApiKey} className="px-4 py-2 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-600">کلیلەکە بسڕەوە</button>
              <button onClick={saveApiKey} className="px-5 py-2 rounded-xl text-xs font-bold bg-[#16A34A] text-white">پاشەکەوتکردن</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1400px] mx-auto p-6 lg:p-8">

        {/* ---------------------------------------------------------------- */}
        {/* STEP 1: INPUT                                                      */}
        {/* ---------------------------------------------------------------- */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white rounded-[18px] shadow-academic border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-[#2563EB]" /> Source Text</h2>
                  <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded-md kurdish-text" dir="rtl">کوردی</span>
                </div>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="دەقەکەت لێرە دابنێ..."
                  dir="rtl"
                  className="w-full h-64 bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 transition-all resize-none kurdish-text text-lg leading-relaxed"
                />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button onClick={enhanceText} disabled={!inputText || isProcessing.enhance}
                    className="bg-white border border-slate-200 hover:border-[#F59E0B] hover:text-[#F59E0B] text-slate-600 font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                    {isProcessing.enhance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#F59E0B]" />}
                    <span className="kurdish-text text-sm">باشترکردن</span>
                  </button>
                  <button onClick={generatePodcast} disabled={!inputText || isProcessing.podcast}
                    className="bg-white border border-slate-200 hover:border-[#2563EB] hover:text-[#2563EB] text-slate-600 font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                    {isProcessing.podcast ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4 text-[#2563EB]" />}
                    <span className="kurdish-text text-sm">پۆدکاست</span>
                  </button>
                </div>
                <div className="mt-5 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600"><Layers className="w-4 h-4" /><span className="text-sm font-medium">Slide Count</span></div>
                  <select value={slideCount} onChange={e => setSlideCount(Number(e.target.value))}
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg block p-2 outline-none font-medium">
                    <option value={3}>3 Slides</option><option value={5}>5 Slides</option>
                    <option value={8}>8 Slides</option><option value={10}>10 Slides</option>
                  </select>
                </div>
                <button onClick={generateOutlinePlan} disabled={!inputText || isGeneratingPlan}
                  className="w-full mt-4 bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70">
                  {isGeneratingPlan
                    ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="kurdish-text">داڕشتنی پۆڵێن...</span></>
                    : <><Play className="w-5 h-5 fill-white" /><span className="kurdish-text text-lg">داڕشتنی پلانی بابەت</span></>}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white rounded-[18px] shadow-academic border border-slate-100 h-[580px] flex flex-col overflow-hidden">
                <div className="border-b border-slate-100 p-4 px-6 flex gap-4 shrink-0">
                  <button onClick={() => setActiveTab('slides')} className={`text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'slides' ? 'bg-[#16A34A] text-white' : 'bg-slate-100 text-slate-500'}`}><LayoutTemplate className="w-4 h-4" /> Slides Plan</button>
                  <button onClick={() => setActiveTab('podcast')} className={`text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'podcast' ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-500'}`}><Mic className="w-4 h-4" /> Podcast</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'slides' ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                      <LayoutTemplate className="w-16 h-16 text-slate-200" />
                      <p className="kurdish-text text-xl text-slate-600 font-medium" dir="rtl">پلانی بابەتەکە لێرە دەبێت</p>
                      <p className="text-sm text-slate-400">دەقەکەت دابنێ و کلیکی ئەو دوگمەیە بکە</p>
                    </div>
                  ) : isProcessing.podcast ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
                      <p className="kurdish-text text-xl font-medium text-slate-600" dir="rtl">پۆدکاستەکە ئامادە دەکرێت...</p>
                    </div>
                  ) : podcast ? (
                    <div className="bg-slate-50 rounded-xl p-6 kurdish-text border border-slate-100" dir="rtl">
                      <div className="prose max-w-none text-slate-700 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: podcast }} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                      <Mic className="w-16 h-16 text-slate-200" />
                      <p className="kurdish-text text-xl text-slate-600 font-medium" dir="rtl">پۆدکاست لێرە پیشان دەدرێت</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* STEP 2: PLAN REVIEW                                               */}
        {/* ---------------------------------------------------------------- */}
        {currentStep === 2 && presentationPlan && (
          <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <div className="bg-white rounded-[24px] shadow-academic border border-slate-100 p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
                <div>
                  <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider bg-[#16A34A]/10 px-3 py-1 rounded-full">Step 2 of 3</span>
                  <h2 className="text-3xl font-extrabold text-slate-900 mt-2 kurdish-text" dir="rtl">نەخشەڕێگای پێشکەشکردنەکە</h2>
                </div>
                <button onClick={() => setCurrentStep(1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm border border-slate-200 px-4 py-2 rounded-xl">
                  <ArrowLeft className="w-4 h-4" /> گەڕانەوە
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" dir="rtl">
                <div className="bg-[#16A34A]/5 p-6 rounded-[18px] border border-[#16A34A]/10">
                  <div className="flex items-center gap-2 text-[#16A34A] font-bold mb-2"><Users className="w-5 h-5" /><span className="kurdish-text">ئامانجی پێشکەشکار</span></div>
                  <p className="kurdish-text text-slate-700 text-lg leading-relaxed">{presentationPlan.audience}</p>
                </div>
                <div className="bg-[#2563EB]/5 p-6 rounded-[18px] border border-[#2563EB]/10">
                  <div className="flex items-center gap-2 text-[#2563EB] font-bold mb-2"><Target className="w-5 h-5" /><span className="kurdish-text">ئامانجی کۆتایی</span></div>
                  <p className="kurdish-text text-slate-700 text-lg leading-relaxed">{presentationPlan.goal}</p>
                </div>
              </div>

              <div className="flex flex-col gap-5" dir="rtl">
                {presentationPlan.sections.map((section, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col gap-4 relative overflow-hidden">
                    {section.transition && (
                      <div className="absolute top-0 left-0 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase px-3 py-1.5 rounded-br-xl tracking-wider">
                        {section.transition}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">{idx + 1}</span>
                        <h4 className="kurdish-text text-2xl font-bold text-slate-800">{section.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md uppercase ${section.importance === 'high' ? 'bg-red-100 text-red-700' : section.importance === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                          {section.importance}
                        </span>
                        <span className="text-xs font-bold bg-[#2563EB]/10 text-[#2563EB] px-2.5 py-1 rounded-md">{section.recommendedLayout}</span>
                      </div>
                    </div>
                    <p className="kurdish-text text-slate-600 text-base leading-relaxed mr-14 border-r-2 border-slate-200 pr-4">
                      <strong>مەبەست:</strong> {section.purpose}
                    </p>
                    <div className="mr-14 bg-white p-4 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-400 block mb-3 uppercase tracking-wide">Key Points:</span>
                      <ul className="space-y-2">
                        {section.keyPoints.map((pt, pIdx) => (
                          <li key={pIdx} className="kurdish-text text-slate-700 flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-[#16A34A] mt-2 shrink-0" />
                            <span className="leading-relaxed">{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={generateSlidesFromPlan} disabled={isGeneratingSlides}
                className="w-full mt-8 bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 shadow-md">
                {isGeneratingSlides
                  ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="kurdish-text">دروستکردنی سلایدەکان...</span></>
                  : <><Sparkles className="w-5 h-5" /><span className="kurdish-text text-lg">پەسەندکردن و دروستکردنی سلایدەکان</span></>}
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* STEP 3: SLIDE VIEWER with THUMBNAIL SIDEBAR                       */}
        {/* ---------------------------------------------------------------- */}
        {currentStep === 3 && slides.length > 0 && (
          <div className="max-w-[1300px] mx-auto flex flex-col gap-4">

            {/* Top bar */}
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <button onClick={() => setCurrentStep(2)} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-semibold text-sm">
                <ArrowLeft className="w-4 h-4" /> گەڕانەوە
              </button>

              {/* Theme picker */}
              <div className="flex items-center gap-2 flex-wrap">
                <Palette className="w-4 h-4 text-[#2563EB]" />
                {Object.values(THEMES).map(theme => (
                  <button key={theme.id} onClick={() => setSelectedTheme(theme)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${selectedTheme.id === theme.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                    {theme.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-indigo-100 px-2 py-1 rounded-md text-indigo-700 uppercase tracking-wide hidden sm:inline">
                  ← → کلیکی تیر بکە
                </span>
                <button onClick={toggleFullscreen}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-700">
                  <Maximize2 className="w-3.5 h-3.5" /> F کلیک
                </button>
              </div>
            </div>

            {/* Main layout: thumbnail sidebar + slide canvas */}
            <div className="flex gap-4 items-start w-full">

              {/* ---- THUMBNAIL SIDEBAR ---- */}
              <div className="hidden lg:flex flex-col gap-2 w-[140px] shrink-0 max-h-[600px] overflow-y-auto thumb-scroll pr-1">
                {slides.map((slide, idx) => (
                  <SlideThumbnail
                    key={idx}
                    slide={slide}
                    index={idx}
                    isActive={currentSlide === idx}
                    theme={selectedTheme}
                    onClick={() => setCurrentSlide(idx)}
                  />
                ))}
              </div>

              {/* ---- SLIDE CANVAS ---- */}
              <div className="flex-1 min-w-0">
                <div
                  className="slide-stage shadow-2xl overflow-hidden flex flex-col relative transition-all duration-500"
                  dir="rtl"
                  style={{
                    backgroundColor: selectedTheme.background,
                    background: selectedTheme.bgGradient || selectedTheme.background,
                    borderRadius: selectedTheme.radius,
                    border: selectedTheme.border,
                    fontFamily: selectedTheme.fontFamily,
                  }}
                >
                  {/* Slide header bar */}
                  <div className="px-8 py-4 flex justify-between items-center opacity-40 shrink-0 z-20">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedTheme.primary }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedTheme.secondary }} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest kurdish-text" style={{ color: selectedTheme.text }}>
                      KurdishAI Studio
                    </span>
                  </div>

                  {/* ---- SLIDE CONTENT ---- */}
                  <div
                    className={`flex-1 flex flex-col justify-center w-full h-full relative z-10 overflow-hidden transition-all duration-300 ${getWeightClasses(slides[currentSlide].visualWeight, 'container')}`}
                    style={{ color: selectedTheme.text }}
                  >
                    {/* TITLE */}
                    {slides[currentSlide].type === 'title' && (
                      <div className="flex flex-col items-center justify-center text-center h-full w-full gap-6">
                        <h1 className={`kurdish-text leading-tight drop-shadow-sm ${getWeightClasses(slides[currentSlide].visualWeight, 'title')}`} style={{ color: selectedTheme.text }}>
                          {slides[currentSlide].title}
                        </h1>
                          {/* Premium Title Accent Line */}
                          <div className="w-16 h-1 signaling-bar mt-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-500" />
                        {slides[currentSlide].subtitle && (
                          <p className="kurdish-text text-2xl font-bold px-8 py-3 rounded-full"
                            style={{ color: selectedTheme.id === 'kurdishHeritage' ? '#fff' : selectedTheme.primary, backgroundColor: `${selectedTheme.primary}18` }}>
                            {slides[currentSlide].subtitle}
                          </p>
                        )}
                      </div>
                    )}

                   {/* BULLETS */}
                   {slides[currentSlide].type === 'bullets' && (
                    <div className="flex flex-col h-full justify-center w-full relative z-10">
    
                      {/* 1. Header/Title Area */}
                      <div className={`flex items-center gap-4 ${getWeightClasses(slides[currentSlide].visualWeight, 'spacing')} mb-6`}>
                        <div className="p-4 rounded-2xl shrink-0 shadow-sm" style={{ backgroundColor: `${selectedTheme.primary}18` }}>
                          <IconRenderer name={slides[currentSlide].icon} className="w-10 h-10" customStyle={{ color: selectedTheme.primary }} />
                        </div>
                        <h2 className={`kurdish-text leading-snug drop-shadow-sm ${getWeightClasses(slides[currentSlide].visualWeight, 'title')}`} style={{ color: selectedTheme.text }}>
                          {slides[currentSlide].title}
                        </h2>
                      </div>

                      {/* 2. The Premium Glassmorphism Card Wrapper */}
                      <div className="w-full p-6 md:p-8 rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500">
      
                        {/* 3. Your Existing Grid (with added hover animations!) */}
                        <div className={`grid gap-4 ${getWeightClasses(slides[currentSlide].visualWeight, 'spacing')}`}>
                          {slides[currentSlide].bullets?.map((b, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl transition-transform duration-300 hover:scale-[1.01] hover:shadow-md"
                              style={{ backgroundColor: selectedTheme.id === 'kurdishHeritage' ? 'rgba(255,255,255,0.1)' : selectedTheme.surface, border: selectedTheme.border }}>
                              <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: selectedTheme.primary }} />
                              <p className="kurdish-text text-xl font-semibold leading-relaxed" style={{ color: selectedTheme.text }}>{b}</p>
                            </div>
                          ))}
                        </div>

                      </div>

                    </div>
                  )}

                    {/* COMPARISON */}
                    {slides[currentSlide].type === 'comparison' && (
                      <div className="flex flex-col h-full w-full justify-center">
                        <h2 className={`kurdish-text text-center leading-snug mb-6 ${getWeightClasses(slides[currentSlide].visualWeight, 'title')}`} style={{ color: selectedTheme.text }}>
                          {slides[currentSlide].title}
                        </h2>
                        <div className="grid grid-cols-2 gap-6 w-full">
                          <div className="p-6 rounded-2xl" style={{ backgroundColor: `${selectedTheme.primary}0d`, border: `2px solid ${selectedTheme.primary}25` }}>
                            <h3 className="kurdish-text text-xl font-black mb-5 text-center" style={{ color: selectedTheme.id === 'kurdishHeritage' ? '#fff' : selectedTheme.primary }}>{slides[currentSlide].leftTitle}</h3>
                            <ul className="space-y-3">{slides[currentSlide].leftBullets?.map((b, i) => <li key={i} className="kurdish-text text-base font-semibold leading-relaxed">• {b}</li>)}</ul>
                          </div>
                          <div className="p-6 rounded-2xl" style={{ backgroundColor: `${selectedTheme.secondary}0d`, border: `2px solid ${selectedTheme.secondary}25` }}>
                            <h3 className="kurdish-text text-xl font-black mb-5 text-center" style={{ color: selectedTheme.id === 'kurdishHeritage' ? '#FEF08A' : selectedTheme.secondary }}>{slides[currentSlide].rightTitle}</h3>
                            <ul className="space-y-3">{slides[currentSlide].rightBullets?.map((b, i) => <li key={i} className="kurdish-text text-base font-semibold leading-relaxed">• {b}</li>)}</ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BIG NUMBER */}
                    {slides[currentSlide].type === 'big_number' && (
                      <div className="flex flex-col items-center justify-center text-center h-full w-full gap-4">
                        <h2 className="kurdish-text text-2xl font-bold tracking-widest uppercase" style={{ color: selectedTheme.textMuted }}>{slides[currentSlide].title}</h2>
                        <div className="kurdish-text text-[110px] font-black leading-none drop-shadow-lg" style={{ color: selectedTheme.id === 'kurdishHeritage' ? '#EAB308' : selectedTheme.primary }}>
                          {slides[currentSlide].content}
                        </div>
                        {slides[currentSlide].subtitle && <p className="kurdish-text text-2xl font-semibold" style={{ color: selectedTheme.text }}>{slides[currentSlide].subtitle}</p>}
                      </div>
                    )}

                    {/* PROCESS */}
                    {slides[currentSlide].type === 'process' && (
                      <div className="flex flex-col h-full w-full justify-center">
                        <h2 className={`kurdish-text text-center leading-snug mb-10 ${getWeightClasses(slides[currentSlide].visualWeight, 'title')}`} style={{ color: selectedTheme.text }}>
                          {slides[currentSlide].title}
                        </h2>
                        <div className="flex justify-between items-start relative w-full px-8">
                          <div className="absolute w-[calc(100%-4rem)] h-1.5 z-0 top-9 left-8 opacity-40" style={{ backgroundColor: selectedTheme.textMuted }} />
                          {slides[currentSlide].steps?.map((s, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center text-center gap-4 relative z-10">
                              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shrink-0 border-4 border-white shadow-lg"
                                style={{ backgroundColor: selectedTheme.secondary, color: '#fff' }}>{i + 1}</div>
                              <p className="kurdish-text text-base font-bold px-2" style={{ color: selectedTheme.text }}>{s}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* QUOTE */}
                    {slides[currentSlide].type === 'quote' && (
                      <div className="flex flex-col items-center justify-center text-center h-full w-full px-16 gap-6">
                        <Quote className="w-20 h-20 opacity-20 shrink-0" style={{ color: selectedTheme.primary }} />
                        <blockquote className={`kurdish-text font-black leading-relaxed ${getWeightClasses(slides[currentSlide].visualWeight, 'title')}`}>
                          "{slides[currentSlide].quote}"
                        </blockquote>
                        <cite className="kurdish-text text-xl font-bold not-italic" style={{ color: selectedTheme.id === 'kurdishHeritage' ? '#FEF08A' : selectedTheme.textMuted }}>
                          — {slides[currentSlide].author}
                        </cite>
                      </div>
                    )}

                    {/* TIMELINE */}
                    {slides[currentSlide].type === 'timeline' && (
                      <div className="flex flex-col h-full w-full justify-center">
                        <h2 className={`kurdish-text leading-snug mb-8 ${getWeightClasses(slides[currentSlide].visualWeight, 'title')}`} style={{ color: selectedTheme.text }}>
                          {slides[currentSlide].title}
                        </h2>
                        <div className="flex justify-between items-start relative w-full">
                          <div className="absolute w-full h-1.5 z-0 top-8 left-0 opacity-40" style={{ backgroundColor: selectedTheme.textMuted }} />
                          {slides[currentSlide].events?.map((ev, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center text-center relative z-10 px-3">
                              <div className="kurdish-text text-xl font-black mb-2" style={{ color: selectedTheme.id === 'kurdishHeritage' ? '#FEF08A' : selectedTheme.secondary }}>{ev.year}</div>
                              <div className="w-5 h-5 rounded-full border-4 border-white shadow-md mb-4" style={{ backgroundColor: selectedTheme.primary }} />
                              <div className="kurdish-text text-base font-bold mb-1" style={{ color: selectedTheme.text }}>{ev.title}</div>
                              <div className="kurdish-text text-xs leading-relaxed line-clamp-2" style={{ color: selectedTheme.textMuted }}>{ev.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STATS GRID */}
                    {slides[currentSlide].type === 'stats_grid' && (
                      <div className="flex flex-col h-full w-full justify-center">
                        <h2 className={`kurdish-text text-center leading-snug mb-6 ${getWeightClasses(slides[currentSlide].visualWeight, 'title')}`} style={{ color: selectedTheme.text }}>
                          {slides[currentSlide].title}
                        </h2>
                        <div className="grid grid-cols-2 gap-5 w-full">
                          {slides[currentSlide].stats?.map((stat, i) => (
                            <div key={i} className="flex flex-col items-center justify-center p-5 rounded-2xl text-center border-2"
                              style={{ backgroundColor: selectedTheme.id === 'kurdishHeritage' ? 'rgba(0,0,0,0.15)' : selectedTheme.surface, borderColor: `${selectedTheme.primary}40` }}>
                              <IconRenderer name={stat.icon} className="w-10 h-10 mb-3" customStyle={{ color: selectedTheme.secondary }} />
                              <div className="kurdish-text text-5xl font-black mb-2 tracking-tight" style={{ color: selectedTheme.id === 'kurdishHeritage' ? '#EAB308' : selectedTheme.primary }}>{stat.value}</div>
                              <div className="kurdish-text text-lg font-semibold" style={{ color: selectedTheme.textMuted }}>{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* HERO STATEMENT */}
                    {slides[currentSlide].type === 'hero_statement' && (
                      <div className="flex flex-col items-center justify-center text-center h-full w-full absolute inset-0 p-16"
                        style={{ background: `linear-gradient(135deg, ${selectedTheme.primary} 0%, ${selectedTheme.secondary} 100%)`, borderRadius: selectedTheme.radius }}>
                        <h1 className={`kurdish-text font-black leading-relaxed drop-shadow-2xl text-white max-w-4xl ${getWeightClasses(slides[currentSlide].visualWeight, 'title')}`}>
                          {slides[currentSlide].statement}
                        </h1>
                      </div>
                    )}

                    {/* IMAGE FOCUS */}
                    {slides[currentSlide].type === 'image_focus' && (
                      <div className="flex gap-10 items-center h-full w-full">
                        <div className="flex-1">
                          <h2 className={`kurdish-text leading-snug mb-5 ${getWeightClasses(slides[currentSlide].visualWeight, 'title')}`} style={{ color: selectedTheme.text }}>
                            {slides[currentSlide].title}
                          </h2>
                          <p className="kurdish-text text-xl leading-relaxed" style={{ color: selectedTheme.id === 'kurdishHeritage' ? '#E2E8F0' : selectedTheme.textMuted }}>
                            {slides[currentSlide].overlayText}
                          </p>
                        </div>
                        <div className="flex-1 h-full max-h-[380px] rounded-[24px] overflow-hidden relative shadow-2xl border-4 border-white">
                          <img
                            src={pollinationsUrl(slides[currentSlide].imagePrompt || slides[currentSlide].title || 'professional presentation', currentSlide)}
                            alt={slides[currentSlide].title || "Presentation Slide"}
                            className="w-[400px] h-[400px] object-cover rounded-2xl shadow-lg border border-gray-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4 kurdish-text text-white text-xs font-bold flex items-center gap-2 opacity-80">
                            <ImageIcon className="w-4 h-4 text-yellow-400 shrink-0" />
                            {slides[currentSlide].imagePrompt}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DIAGRAM */}
                    {slides[currentSlide].type === 'diagram' && (
                      <div className="flex flex-col h-full w-full justify-center">
                        <h2 className={`kurdish-text text-center leading-snug mb-10 ${getWeightClasses(slides[currentSlide].visualWeight, 'title')}`} style={{ color: selectedTheme.text }}>
                          {slides[currentSlide].title}
                        </h2>
                        <div className="flex items-center justify-center relative w-full gap-4">
                          {slides[currentSlide].nodes?.map((node, i) => (
                            <React.Fragment key={i}>
                              <div className="p-5 shadow-lg z-10 min-w-[140px] text-center border-2"
                                style={{ backgroundColor: selectedTheme.surface, borderRadius: selectedTheme.radius, borderColor: selectedTheme.secondary }}>
                                <span className="kurdish-text text-lg font-bold" style={{ color: selectedTheme.id === 'kurdishHeritage' ? '#0F172A' : selectedTheme.text }}>{node}</span>
                              </div>
                              {i < (slides[currentSlide].nodes?.length || 0) - 1 && (
                                <div className="flex-1 h-1.5 rounded-full min-w-[40px] max-w-[100px]" style={{ backgroundColor: selectedTheme.primary }} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        {slides[currentSlide].connections?.length ? (
                          <p className="text-center mt-8 kurdish-text text-lg font-bold" style={{ color: selectedTheme.textMuted }}>
                            {slides[currentSlide].connections?.join(' ➔ ')}
                          </p>
                        ) : null}
                      </div>
                    )}

                    {/* FALLBACK for unknown AI types */}
                    {!KNOWN_LAYOUTS.includes(slides[currentSlide].type) && (
                      <div className="flex flex-col h-full w-full justify-center gap-4">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-8 h-8 text-amber-500" />
                          <h2 className="kurdish-text text-3xl font-black" style={{ color: selectedTheme.text }}>
                            {slides[currentSlide].title || 'Unknown Layout'}
                          </h2>
                        </div>
                        <pre className="text-xs p-4 rounded-xl border overflow-auto" style={{ backgroundColor: selectedTheme.surface, color: selectedTheme.textMuted, borderColor: selectedTheme.border }}>
                          {JSON.stringify(slides[currentSlide], null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 bg-white/85 backdrop-blur-xl rounded-full px-3 md:px-6 py-1.5 md:py-2.5 shadow-xl border border-slate-200 z-30 max-w-[90%]">

                    <button
                      onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                      disabled={currentSlide === 0}
                      className="p-1 md:p-1.5 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-slate-800" />
                    </button>

                    <span className="font-mono font-black text-slate-800 text-sm md:text-base min-w-[55px] text-center">
                      {currentSlide + 1} / {slides.length}
                    </span>

                    <button
                      onClick={() => setCurrentSlide((p) => Math.min(slides.length - 1, p + 1))}
                      disabled={currentSlide === slides.length - 1}
                      className="p-1 md:p-1.5 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-slate-800" />
                    </button>

                  </div>

                {/* Transition badge below canvas */}
                {slides[currentSlide].transition && (
                  <div className="mt-3 flex justify-center">
                    <span className="text-[10px] font-black bg-indigo-100 px-3 py-1 rounded-full text-indigo-700 uppercase tracking-widest">
                      Transition: {slides[currentSlide].transition}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
