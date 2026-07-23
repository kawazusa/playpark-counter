import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { 
  MapPin, 
  GraduationCap, 
  School as SchoolIcon, 
  Users, 
  CheckCircle2, 
  ArrowLeft, 
  RotateCcw,
  Sparkles,
  Heart,
  Baby,
  ArrowRight,
  HelpCircle,
  Smile,
  Megaphone
} from 'lucide-react';

interface KioskFormProps {
  onSuccess: () => void;
}


interface DisplayOption {
  value: string;
  label: React.ReactNode;
}

const SCHOOLS_DISPLAY: DisplayOption[] = [
  { value: "江古田小", label: <ruby>江古田小<rt>えごたしょう</rt></ruby> },
  { value: "江原小", label: <ruby>江原小<rt>えはらしょう</rt></ruby> },
  { value: "緑野小", label: <ruby>緑野小<rt>みどりのしょう</rt></ruby> },
  { value: "その他中野区", label: <>その他<ruby>中野区<rt>なかのく</rt></ruby></> },
  { value: "練馬区", label: <ruby>練馬区<rt>ねりまく</rt></ruby> },
  { value: "その他（中野区・練馬区外）", label: <>その他（<ruby>中野区<rt>なかのく</rt></ruby>・<ruby>練馬区外<rt>ねりまくがい</rt></ruby>）</> },
  { value: "中学生以上", label: <ruby>中学生以上<rt>ちゅうがくせいいじょう</rt></ruby> }
];

const GRADES_DISPLAY: DisplayOption[] = [
  { value: "1年生", label: <>1<ruby>年生<rt>ねんせい</rt></ruby></> },
  { value: "2年生", label: <>2<ruby>年生<rt>ねんせい</rt></ruby></> },
  { value: "3年生", label: <>3<ruby>年生<rt>ねんせい</rt></ruby></> },
  { value: "4年生", label: <>4<ruby>年生<rt>ねんせい</rt></ruby></> },
  { value: "5年生", label: <>5<ruby>年生<rt>ねんせい</rt></ruby></> },
  { value: "6年生", label: <>6<ruby>年生<rt>ねんせい</rt></ruby></> },
  { value: "中学生以上", label: <ruby>中学生以上<rt>ちゅうがくせいいじょう</rt></ruby> }
];

const RESIDENCES = [
  "中野区（江古田・沼袋）", 
  "中野区（新井・上高田）", 
  "中野区（松が丘）", 
  "中野区（丸山・野方・若宮・大和町）", 
  "中野区（鷺宮・白鷺）", 
  "中野区（上鷺宮）",
  "中野区（東中野・中央・中野）", 
  "中野区（弥生町・南台）", 
  "練馬区", 
  "新宿区", 
  "その他"
];

const ADULT_RELATIONS = ["母", "父", "祖父母", "その他"];

const CHILD_AGES = [
  "0歳", "1歳", "2歳", "3歳", "4歳", "5歳", "6歳", 
  "小1", "小2", "小3", "小4", "小5", "小6", "中学生以上"
];

const VISIT_REASONS = [
  "通りがかり", 
  "人から聞いて", 
  "X (旧Twitter)", 
  "インスタ", 
  "ホームページ", 
  "チラシ（学校配布）", 
  "チラシ（掲示板）", 
  "チラシ（子育てひろば）", 
  "チラシ（保健センター）", 
  "チラシ（児童館）", 
  "その他"
];

type EntryType = 'none' | 'kids_only' | 'family_adult';

export const KioskForm: React.FC<KioskFormProps> = ({ onSuccess }) => {
  const [entryType, setEntryType] = useState<EntryType>('none');
  const [stepIndex, setStepIndex] = useState<number>(0);
  
  // Kids only path state
  const [kidsSchool, setKidsSchool] = useState<string>('');
  const [kidsGrade, setKidsGrade] = useState<string>('');
  const [kidsHeadcount, setKidsHeadcount] = useState<number>(1);

  // Family / Adult path state
  const [residence, setResidence] = useState<string>('');
  const [selectedAdults, setSelectedAdults] = useState<string[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [firstTime, setFirstTime] = useState<boolean | null>(null);
  const [visitReason, setVisitReason] = useState<string>('');

  // Announcement state
  const [announcement, setAnnouncement] = useState<string>('');

  // Load announcement from localStorage
  useEffect(() => {
    const savedNotice = localStorage.getItem('playpark_announcement');
    const defaultNotice = "【次回のお知らせ】\n次回のプレイパークは 8月2日(日) に開催します！\n水遊びや工作コーナーを用意してお待ちしています。水分補給用の水筒を忘れずに持ってきてね！";
    setAnnouncement(savedNotice || defaultNotice);
  }, [stepIndex]);

  const resetForm = () => {
    setEntryType('none');
    setStepIndex(0);
    
    setKidsSchool('');
    setKidsGrade('');
    setKidsHeadcount(1);
    
    setResidence('');
    setSelectedAdults([]);
    setSelectedChildren([]);
    setFirstTime(null);
    setVisitReason('');
  };

  const toggleAdult = (relation: string) => {
    if (selectedAdults.includes(relation)) {
      setSelectedAdults(selectedAdults.filter(r => r !== relation));
    } else {
      setSelectedAdults([...selectedAdults, relation]);
    }
  };

  const toggleChild = (ageGrade: string) => {
    if (selectedChildren.includes(ageGrade)) {
      setSelectedChildren(selectedChildren.filter(c => c !== ageGrade));
    } else {
      setSelectedChildren([...selectedChildren, ageGrade]);
    }
  };

  // Calculate total headcount
  const getCalculatedHeadcount = () => {
    if (entryType === 'kids_only') {
      return kidsHeadcount;
    } else {
      const adultsCount = selectedAdults.length || 1;
      const kidsCount = selectedChildren.length;
      return adultsCount + kidsCount;
    }
  };

  const handleRegister = async () => {
    const finalHeadcount = getCalculatedHeadcount();
    const finalResidence = entryType === 'kids_only' 
      ? (kidsSchool === "練馬区" ? "練馬区" : kidsSchool === "その他（中野区・練馬区外）" ? "その他" : "中野区")
      : residence;

    try {
      await db.visitorRecords.add({
        timestamp: Date.now(),
        entry_type: entryType as 'kids_only' | 'family_adult',
        residence: finalResidence,
        school: entryType === 'kids_only' ? kidsSchool : undefined,
        child_grade: entryType === 'kids_only' ? kidsGrade : undefined,
        adult_relations: entryType === 'family_adult' ? selectedAdults : [],
        child_ages: entryType === 'family_adult' ? selectedChildren : [],
        first_time: entryType === 'family_adult' ? !!firstTime : false,
        visit_reason: (entryType === 'family_adult' && firstTime) ? visitReason : undefined,
        headcount: finalHeadcount
      });
      
      setStepIndex(99); // 99 means Success screen
      onSuccess();
      
      // Auto reset success screen after 6 seconds (to give time to read announcements)
      const timer = setTimeout(() => {
        resetForm();
      }, 6000);
      return () => clearTimeout(timer);
    } catch (error) {
      console.error("Failed to save record:", error);
      alert("登録に失敗しました。もう一度試してください。");
    }
  };

  // Total steps based on entry path
  const getStepsArray = () => {
    if (entryType === 'kids_only') {
      return ['type', 'school', 'grade', 'headcount', 'confirm'];
    } else if (entryType === 'family_adult') {
      return ['type', 'residence', 'adults', 'children', 'first_time', 'confirm'];
    }
    return ['type'];
  };

  const stepsList = getStepsArray();
  const currentStep = stepsList[stepIndex] || 'type';

  const handleNext = () => {
    if (stepIndex < stepsList.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/80 backdrop-blur-2xl rounded-[36px] shadow-2xl shadow-brand-900/10 border border-white/40 p-8 md:p-12 transition-all duration-300">
      
      {/* Progress Bar */}
      {entryType !== 'none' && stepIndex !== 99 && (
        <div className="mb-10">
          <div className="flex justify-between items-center text-sm font-bold text-emerald-900 mb-2.5">
            <span>入力の進みぐあい</span>
            <span>{Math.round(((stepIndex + 1) / stepsList.length) * 100)}%</span>
          </div>
          <div className="h-4 bg-brand-100 rounded-full overflow-hidden p-0.5 border border-brand-200/50">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out shadow-inner
                ${entryType === 'kids_only' 
                  ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-brand-600' 
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600'}`}
              style={{ width: `${((stepIndex + 1) / stepsList.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Wizard Form Container */}
      <div className="min-h-[440px] flex flex-col justify-between">
        
        {/* Step: Route Selection (Type) */}
        {currentStep === 'type' && stepIndex !== 99 && (
          <div className="animate-slide-up">
            <div className="text-center mb-10">
              <div className="inline-flex p-4.5 bg-emerald-50 rounded-3xl text-emerald-600 mb-4 animate-bounce-subtle border border-emerald-100/50 shadow-sm">
                <Smile className="w-12 h-12" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                <ruby>受付<rt>うけつけ</rt></ruby>をえらんでね！
              </h2>
              <p className="text-slate-500 text-lg md:text-xl font-medium mt-2">
                あてはまる<ruby>方<rt>ほう</rt></ruby>をタッチしてください
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Kids Only Option */}
              <button
                onClick={() => {
                  setEntryType('kids_only');
                  setStepIndex(1);
                }}
                className="flex-1 p-8 sm:p-10 rounded-[32px] border-2 transition-all duration-200 active:scale-95 flex flex-col items-center justify-between text-center gap-6 min-h-[260px] shadow-md
                  border-emerald-200 bg-emerald-50/20 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-8 focus:ring-emerald-100"
              >
                <div className="p-5 bg-emerald-100 rounded-2xl text-emerald-700 shadow-inner">
                  <GraduationCap className="w-12 h-12" />
                </div>
                <div>
                  <span className="text-2xl md:text-3xl font-black block">
                    <ruby>子<rt>こ</rt></ruby>どもだけで<ruby>来<rt>き</rt></ruby>た
                  </span>
                  <span className="text-sm text-emerald-700 font-bold mt-2 block bg-emerald-100/60 px-3 py-1 rounded-full">
                    （<ruby>小中学生<rt>しょうちゅうがくせい</rt></ruby>グループなど）
                  </span>
                </div>
              </button>

              {/* Family / Adults Option */}
              <button
                onClick={() => {
                  setEntryType('family_adult');
                  setStepIndex(1);
                }}
                className="flex-1 p-8 sm:p-10 rounded-[32px] border-2 transition-all duration-200 active:scale-95 flex flex-col items-center justify-between text-center gap-6 min-h-[260px] shadow-md
                  border-amber-200 bg-amber-50/20 text-slate-700 hover:border-amber-500 hover:bg-amber-50 hover:text-amber-900 focus:outline-none focus:ring-8 focus:ring-amber-100"
              >
                <div className="p-5 bg-amber-100 rounded-2xl text-amber-700 shadow-inner">
                  <Users className="w-12 h-12" />
                </div>
                <div>
                  <span className="text-2xl md:text-3xl font-black block">
                    <ruby>親子<rt>おやこ</rt></ruby>・おとなだけ
                  </span>
                  <span className="text-sm text-amber-700 font-bold mt-2 block bg-emerald-100/60 px-3 py-1 rounded-full">
                    （<ruby>保護者同伴<rt>ほごしゃどうはん</rt></ruby>・<ruby>大人<rt>おとな</rt></ruby>のみなど）
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PATH A: KIDS ONLY FLOW                                                    */}
        {/* ========================================================================= */}

        {/* Route A - Step 1: School */}
        {entryType === 'kids_only' && currentStep === 'school' && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 mb-3 border border-emerald-100">
                <SchoolIcon className="w-9 h-9" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                <ruby>学校<rt>がっこう</rt></ruby>はどこですか？
              </h2>
              <p className="text-slate-500 text-lg font-bold mt-1">
                <ruby>通<rt>かよ</rt></ruby>っている<ruby>学校<rt>がっこう</rt></ruby>をえらんでね
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {SCHOOLS_DISPLAY.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setKidsSchool(opt.value);
                    handleNext();
                  }}
                  className={`py-5 px-4 text-lg md:text-xl font-bold rounded-2xl border-2 transition-all duration-150 active:scale-95 flex items-center justify-center text-center min-h-[84px] shadow-sm
                    ${kidsSchool === opt.value 
                      ? 'border-emerald-600 bg-emerald-100/70 text-emerald-900 shadow-md ring-4 ring-emerald-200' 
                      : 'border-slate-100 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Route A - Step 2: Grade */}
        {entryType === 'kids_only' && currentStep === 'grade' && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 mb-3 border border-emerald-100">
                <GraduationCap className="w-9 h-9" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                <ruby>学年<rt>がくねん</rt></ruby>はいくつですか？
              </h2>
              <p className="text-slate-500 text-lg font-bold mt-1">
                あてはまる<ruby>学年<rt>がくねん</rt></ruby>をえらんでね
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {GRADES_DISPLAY.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setKidsGrade(opt.value);
                    handleNext();
                  }}
                  className={`py-5 px-3 text-xl md:text-2xl font-black rounded-2xl border-2 transition-all duration-150 active:scale-95 flex items-center justify-center min-h-[80px] shadow-sm
                    ${kidsGrade === opt.value 
                      ? 'border-emerald-600 bg-emerald-100/70 text-emerald-900 shadow-md ring-4 ring-emerald-200' 
                      : 'border-slate-100 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Route A - Step 3: Headcount */}
        {entryType === 'kids_only' && currentStep === 'headcount' && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 mb-3 border border-emerald-100">
                <Users className="w-9 h-9" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                いっしょにいる<ruby>人数<rt>にんずう</rt></ruby>は<ruby>何人<rt>なんにん</rt></ruby>？
              </h2>
              <p className="text-slate-500 text-lg font-bold mt-1">
                グループ<ruby>全員<rt>ぜんいん</rt></ruby>の<ruby>人数<rt>にんずう</rt></ruby>をえらんでね
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setKidsHeadcount(num);
                    handleNext();
                  }}
                  className={`w-24 h-24 sm:w-28 sm:h-28 text-4xl font-black rounded-3xl border-2 transition-all duration-150 active:scale-95 flex flex-col items-center justify-center shadow-md
                    ${kidsHeadcount === num
                      ? 'border-emerald-600 bg-emerald-100/70 text-emerald-900 ring-4 ring-emerald-200 scale-105 shadow-lg' 
                      : 'border-slate-100 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50'}`}
                >
                  <span>{num}</span>
                  <span className="text-sm font-bold text-slate-400 mt-1.5">
                    {num === 5 
                      ? <><ruby>人以上<rt>にんいじょう</rt></ruby></> 
                      : <><ruby>人<rt>にん</rt></ruby></>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PATH B: FAMILY / ADULT FLOW                                               */}
        {/* ========================================================================= */}

        {/* Route B - Step 1: Residence */}
        {entryType === 'family_adult' && currentStep === 'residence' && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex p-3.5 bg-amber-50 rounded-2xl text-amber-600 mb-3 border border-amber-100">
                <MapPin className="w-9 h-9" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">お住まいの地区はどこですか？</h2>
              <p className="text-slate-500 text-lg font-bold mt-1">あてはまる地区をえらんでね</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[340px] overflow-y-auto pr-1">
              {RESIDENCES.map((resOption) => (
                <button
                  key={resOption}
                  onClick={() => {
                    setResidence(resOption);
                    handleNext();
                  }}
                  className={`py-4.5 px-5 text-base md:text-lg font-bold rounded-2xl border-2 transition-all duration-150 active:scale-95 flex items-center justify-start min-h-[64px] w-full text-left shadow-sm
                    ${residence === resOption 
                      ? 'border-amber-600 bg-amber-100/70 text-amber-900 shadow-md ring-4 ring-amber-200' 
                      : 'border-slate-100 bg-white text-slate-700 hover:border-amber-500 hover:bg-amber-50/50'}`}
                >
                  <MapPin className={`w-5 h-5 mr-3 flex-shrink-0 ${residence === resOption ? 'text-amber-700' : 'text-slate-300'}`} />
                  <span>{resOption}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Route B - Step 2: Adults Checkbox list */}
        {entryType === 'family_adult' && currentStep === 'adults' && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex p-3.5 bg-amber-50 rounded-2xl text-amber-600 mb-3 border border-amber-100">
                <Users className="w-9 h-9" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">いっしょに来たおとな</h2>
              <p className="text-slate-500 text-lg font-bold mt-1">あてはまる人全員をえらんでね（複数えらべます）</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
              {ADULT_RELATIONS.map((relation) => {
                const isSelected = selectedAdults.includes(relation);
                return (
                  <button
                    key={relation}
                    type="button"
                    onClick={() => toggleAdult(relation)}
                    className={`py-5 px-3 text-lg md:text-xl font-bold rounded-2xl border-2 transition-all duration-100 flex items-center justify-center gap-2.5 min-h-[64px] shadow-sm
                      ${isSelected 
                        ? 'border-amber-600 bg-amber-100/70 text-amber-900 shadow-md ring-3 ring-amber-200' 
                        : 'border-slate-100 bg-white text-slate-700 hover:border-amber-500 hover:bg-amber-50/30'}`}
                  >
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${isSelected ? 'border-amber-600 bg-amber-600 text-white shadow-inner' : 'border-slate-300 bg-white'}`}
                    >
                      {isSelected && <span className="text-sm font-black">✓</span>}
                    </div>
                    {relation}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleNext}
                disabled={selectedAdults.length === 0}
                className={`py-5 px-10 text-xl font-bold rounded-2xl flex items-center gap-3.5 transition duration-200 shadow-lg
                  ${selectedAdults.length > 0 
                    ? 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-amber-500/20' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
              >
                決定して次へ
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Route B - Step 3: Children Checkbox list */}
        {entryType === 'family_adult' && currentStep === 'children' && (
          <div className="animate-slide-up">
            <div className="text-center mb-6">
              <div className="inline-flex p-3.5 bg-amber-50 rounded-2xl text-amber-600 mb-3 border border-amber-100">
                <Baby className="w-9 h-9" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">いっしょに来たこども</h2>
              <p className="text-slate-500 text-lg font-bold mt-1">お子さんの学年や年齢をえらんでね（複数えらべます）</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-h-[260px] overflow-y-auto pr-1 p-1">
              {CHILD_AGES.map((ageGrade) => {
                const isSelected = selectedChildren.includes(ageGrade);
                return (
                  <button
                    key={ageGrade}
                    type="button"
                    onClick={() => toggleChild(ageGrade)}
                    className={`py-4 px-3 text-base md:text-lg font-bold rounded-2xl border-2 transition-all duration-100 flex items-center justify-center gap-2.5 min-h-[60px] shadow-sm
                      ${isSelected 
                        ? 'border-amber-600 bg-amber-100/70 text-amber-900 shadow-md ring-3 ring-amber-200' 
                        : 'border-slate-100 bg-white text-slate-700 hover:border-amber-500 hover:bg-amber-50/30'}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300 bg-white'}`}
                    >
                      {isSelected && <span className="text-[11px] font-black">✓</span>}
                    </div>
                    {ageGrade}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedChildren([]);
                  handleNext();
                }}
                className="py-4 px-6 text-base font-bold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition w-full sm:w-auto"
              >
                こどもはいない（大人のみ）
              </button>

              <button
                onClick={handleNext}
                className="py-4.5 px-10 text-xl font-bold bg-amber-500 hover:bg-amber-600 text-white active:scale-95 rounded-2xl flex items-center justify-center gap-3.5 transition duration-200 shadow-lg shadow-amber-500/20 w-full sm:w-auto"
              >
                決定して次へ
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Route B - Step 4: First Time Survey */}
        {entryType === 'family_adult' && currentStep === 'first_time' && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex p-3.5 bg-amber-50 rounded-2xl text-amber-605 mb-3 border border-amber-100">
                <HelpCircle className="w-9 h-9" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">この遊び場は初めてですか？</h2>
              <p className="text-slate-500 text-lg font-bold mt-1">あてはまる方をタッチしてね</p>
            </div>

            {firstTime === null ? (
              <div className="flex flex-col sm:flex-row gap-5">
                <button
                  onClick={() => {
                    setFirstTime(false);
                    setStepIndex(5);
                  }}
                  className="flex-1 py-10 px-6 text-2xl font-black rounded-3xl border-2 transition-all active:scale-95 flex flex-col items-center justify-center gap-3 border-slate-100 bg-white text-slate-700 hover:border-amber-500 hover:bg-amber-50 shadow-md"
                >
                  <span className="text-3xl text-slate-700">いいえ</span>
                  <span className="text-sm text-slate-400 font-bold mt-1 bg-slate-100 px-3 py-1 rounded-full">
                    （何回か来ている）
                  </span>
                </button>
                <button
                  onClick={() => setFirstTime(true)}
                  className="flex-1 py-10 px-6 text-2xl font-black rounded-3xl border-2 transition-all active:scale-95 flex flex-col items-center justify-center gap-3 border-slate-100 bg-white text-slate-700 hover:border-amber-500 hover:bg-amber-50 shadow-md"
                >
                  <span className="text-3xl text-amber-600 font-black">はい！</span>
                  <span className="text-sm text-amber-700 font-bold mt-1 bg-amber-100/60 px-3 py-1 rounded-full">
                    （初めて遊びに来た）
                  </span>
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <span className="text-base font-extrabold text-amber-900 flex items-center justify-center gap-2 mb-3 bg-amber-100/50 py-2 px-4 rounded-xl border border-amber-200/50">
                    ✨ 初めての方におたずねします ✨
                  </span>
                  <p className="text-sm text-center text-slate-500 font-bold">
                    遊び場を知ったきっかけは何ですか？（1つえらんでね）
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[220px] overflow-y-auto pr-1 mb-6">
                  {VISIT_REASONS.map((reasonOption) => (
                    <button
                      key={reasonOption}
                      onClick={() => {
                        setVisitReason(reasonOption);
                        handleNext();
                      }}
                      className={`py-4 px-3 text-sm md:text-base font-bold rounded-2xl border-2 transition-all duration-150 text-center min-h-[60px] flex items-center justify-center shadow-sm
                        ${visitReason === reasonOption 
                          ? 'border-amber-600 bg-amber-100/70 text-amber-900 shadow-md ring-3 ring-amber-200' 
                          : 'border-slate-100 bg-white text-slate-700 hover:border-amber-500 hover:bg-amber-50/50'}`}
                    >
                      {reasonOption}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFirstTime(null);
                      setVisitReason('');
                    }}
                    className="px-5 py-3 text-sm font-bold text-slate-400 hover:text-slate-650 rounded-xl hover:bg-slate-100 transition"
                  >
                    やり直す
                  </button>
                  
                  <button
                    onClick={handleNext}
                    disabled={!visitReason}
                    className={`py-4 px-8 text-base font-bold rounded-2xl flex items-center gap-2 transition duration-200 shadow-md
                      ${visitReason 
                        ? 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-amber-500/10' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                  >
                    確認へ進む
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CONFIRMATION SCREEN (SHARED)                                              */}
        {/* ========================================================================= */}

        {/* Confirm Step */}
        {currentStep === 'confirm' && stepIndex !== 99 && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex p-3.5 bg-brand-50 rounded-2xl text-brand-600 mb-3 border border-brand-100">
                <Heart className="w-9 h-9 text-emerald-600 fill-emerald-600/10" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                {entryType === 'kids_only' ? (
                  <><ruby>内容<rt>ないよう</rt></ruby>はあっているかな？</>
                ) : (
                  "この内容で登録しますか？"
                )}
              </h2>
              <p className="text-slate-500 text-lg font-bold mt-1">
                {entryType === 'kids_only' ? (
                  <>まちがいがないか<ruby>確認<rt>かくにん</rt></ruby>してね</>
                ) : (
                  "まちがいがないか確認してね"
                )}
              </p>
            </div>

            {/* Kids only Confirmation Details */}
            {entryType === 'kids_only' && (
              <div className="bg-emerald-50/40 rounded-3xl p-8 border border-emerald-100/50 mb-8 grid grid-cols-2 gap-4 shadow-inner">
                <div className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm col-span-2">
                  <span className="text-xs font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                    <SchoolIcon className="w-4 h-4" /> <ruby>学校<rt>がっこう</rt></ruby>
                  </span>
                  <span className="text-2xl font-black text-slate-800">
                    {SCHOOLS_DISPLAY.find(s => s.value === kidsSchool)?.label || kidsSchool}
                  </span>
                </div>

                <div className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                    <GraduationCap className="w-4 h-4" /> <ruby>学年<rt>がくねん</rt></ruby>
                  </span>
                  <span className="text-2xl font-black text-slate-800">
                    {GRADES_DISPLAY.find(g => g.value === kidsGrade)?.label || kidsGrade}
                  </span>
                </div>

                <div className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                    <Users className="w-4 h-4" /> <ruby>人数<rt>にんずう</rt></ruby>
                  </span>
                  <span className="text-2xl font-black text-slate-800">
                    {kidsHeadcount} <ruby>人<rt>にん</rt></ruby>{kidsHeadcount === 5 ? <><ruby>以上<rt>いじょう</rt></ruby></> : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Family / Adults Confirmation Details */}
            {entryType === 'family_adult' && (
              <div className="bg-amber-50/40 rounded-3xl p-8 border border-amber-100/50 mb-8 space-y-4 shadow-inner">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm col-span-2">
                    <span className="text-xs font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                      <MapPin className="w-4 h-4" /> お住まいの地区
                    </span>
                    <span className="text-xl font-black text-slate-800">{residence}</span>
                  </div>

                  <div className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-xs font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                      <Users className="w-4 h-4" /> おとな
                    </span>
                    <span className="text-base font-black text-slate-700">
                      {selectedAdults.length > 0 ? selectedAdults.join("、") : "大人のみ登録"}
                    </span>
                  </div>

                  <div className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-xs font-bold text-amber-800 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                      <Baby className="w-4 h-4" /> お子さん
                    </span>
                    <span className="text-base font-black text-slate-700">
                      {selectedChildren.length > 0 ? selectedChildren.join("、") : "こどもはいない"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-slate-500">
                  <span>総来場者数: <strong className="text-2xl text-amber-600 font-black ml-1.5">{getCalculatedHeadcount()}</strong> 名</span>
                  <span>
                    初めてですか？: 
                    <strong className={`ml-1.5 text-base ${firstTime ? 'text-amber-600 font-black' : 'text-slate-600 font-bold'}`}>
                      {firstTime ? `はい (${visitReason})` : 'いいえ'}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={resetForm}
                className="flex-1 py-5 text-xl font-bold rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-150 active:scale-95 flex items-center justify-center gap-2.5"
              >
                <RotateCcw className="w-6 h-6" />
                {entryType === 'kids_only' ? (
                  <><ruby>最初<rt>さいしょ</rt></ruby>からやり<ruby>直<rt>なお</rt></ruby>す</>
                ) : (
                  "最初からやり直す"
                )}
              </button>
              
              <button
                onClick={handleRegister}
                className={`flex-2 py-5 px-10 text-xl font-black rounded-2xl text-white shadow-xl transition-all duration-150 active:scale-95 flex items-center justify-center gap-3
                  ${entryType === 'kids_only' 
                    ? 'bg-gradient-to-r from-emerald-500 to-brand-600 shadow-emerald-500/30 hover:brightness-105' 
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/30 hover:brightness-105'}`}
              >
                <Sparkles className="w-6 h-6" />
                {entryType === 'kids_only' ? (
                  <><ruby>登録<rt>とうろく</rt></ruby>する！</>
                ) : (
                  "登録する！"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success & Announcement Screen */}
        {stepIndex === 99 && (
          <div className="animate-scale-in py-4 text-center">
            
            {/* Success Heading */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce-subtle shadow-md">
                <CheckCircle2 className="w-16 h-16" />
              </div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
                {entryType === 'kids_only' ? (
                  <><ruby>登録<rt>とうろく</rt></ruby>ができたよ！</>
                ) : (
                  "登録が完了しました！"
                )}
              </h2>
              <p className="text-emerald-700 font-bold text-lg">
                {entryType === 'kids_only' ? (
                  <>プレイパークへようこそ！たくさん<ruby>遊<rt>あそ</rt></ruby>んでいってね！</>
                ) : (
                  "プレイパークへようこそ！たくさん遊んでいってね！"
                )}
              </p>
            </div>

            {/* Playpark Announcement Noticeboard */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/70 rounded-[28px] p-6 mb-8 text-left shadow-lg shadow-amber-900/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6" />
              
              <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-amber-200/50">
                <Megaphone className="w-6 h-6 text-amber-600 fill-amber-600/10 animate-pulse" />
                <span className="text-lg font-black text-amber-900">
                  {entryType === 'kids_only' ? (
                    <>プレイパークからのお知らせ</>
                  ) : (
                    "プレイパークからのお知らせ"
                  )}
                </span>
              </div>
              
              {/* Notice text */}
              <div className="text-base text-slate-700 leading-relaxed font-bold whitespace-pre-wrap pl-1">
                {announcement}
              </div>
            </div>

            {/* Exit Action Buttons & Timer Display */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={resetForm}
                className={`py-4 px-10 text-lg font-extrabold text-white rounded-2xl active:scale-95 shadow-md transition duration-150 flex items-center gap-2.5
                  ${entryType === 'kids_only' 
                    ? 'bg-emerald-600 hover:bg-emerald-750 shadow-emerald-600/10' 
                    : 'bg-amber-600 hover:bg-amber-750 shadow-amber-600/10'}`}
              >
                {entryType === 'kids_only' ? (
                  <><ruby>確認<rt>かくにん</rt></ruby>しました（<ruby>最初<rt>さいしょ</rt></ruby>の<ruby>画面<rt>がめん</rt></ruby>にもどる）</>
                ) : (
                  "確認しました（最初の画面にもどる）"
                )}
              </button>
              
              <span className="text-xs text-slate-400 font-semibold animate-pulse">
                {entryType === 'kids_only' ? (
                  <>※ボタンを<ruby>押<rt>お</rt></ruby>さないときも、すこし待つと<ruby>自動<rt>じどう</rt></ruby>で<ruby>最初<rt>さいしょ</rt></ruby>の<ruby>画面<rt>がめん</rt></ruby>に<ruby>戻<rt>もど</rt></ruby>ります</>
                ) : (
                  "※ボタンを押さない場合、まもなく自動で最初の画面に戻ります"
                )}
              </span>
            </div>

          </div>
        )}

        {/* Bottom Navigation Back Button */}
        {currentStep !== 'type' && currentStep !== 'confirm' && stepIndex !== 99 && (
          <div className="mt-10 pt-5 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={() => {
                if (currentStep === 'first_time' && firstTime === true) {
                  setFirstTime(null);
                  setVisitReason('');
                } else if (currentStep === 'confirm' && entryType === 'family_adult' && firstTime === false) {
                  setStepIndex(4);
                  setFirstTime(null);
                } else {
                  handleBack();
                }
              }}
              className="px-6 py-3.5 text-slate-650 hover:text-slate-800 font-bold flex items-center gap-2 rounded-xl hover:bg-slate-100 transition-all duration-150 text-base border border-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
              もどる
            </button>

            <button
              onClick={resetForm}
              className="px-6 py-3.5 text-slate-450 hover:text-rose-600 font-bold flex items-center gap-2 rounded-xl hover:bg-rose-50 transition-all duration-150 text-base"
            >
              <RotateCcw className="w-4 h-4" />
              {entryType === 'kids_only' ? (
                <><ruby>最初<rt>さいしょ</rt></ruby>から</>
              ) : (
                "最初から"
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
