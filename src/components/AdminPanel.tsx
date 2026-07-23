import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { VisitorRecord } from '../db';
import { 
  Trash2, 
  Edit3, 
  Download, 
  X, 
  Search, 
  TrendingUp, 
  Users, 
  Grid,
  Lock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Check,
  Megaphone
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

const SCHOOLS = ["江古田小", "江原小", "緑野小", "その他中野区", "練馬区", "その他（中野区・練馬区外）", "中学生以上"];
const GRADES = ["1年生", "2年生", "3年生", "4年生", "5年生", "6年生", "中学生以上"];

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

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [pin, setPin] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinError, setPinError] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<VisitorRecord | null>(null);
  
  // Table search and pagination state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Announcement state
  const [announcementText, setAnnouncementText] = useState<string>(() => {
    return localStorage.getItem('playpark_announcement') || 
      "【次回のお知らせ】\n次回のプレイパークは 8月2日(日) に開催します！\n水遊びや工作コーナーを用意してお待ちしています。水分補給用の水筒を忘れずに持ってきてね！";
  });

  const handleSaveAnnouncement = () => {
    localStorage.setItem('playpark_announcement', announcementText);
    alert("お知らせを保存しました！登録完了画面に反映されます。");
  };

  // Retrieve records from Dexie ordered by timestamp descending
  const records = useLiveQuery(async () => {
    return await db.visitorRecords.orderBy('timestamp').reverse().toArray() || [];
  });

  const handlePinSubmit = (digit: string) => {
    setPinError(false);
    const newPin = pin + digit;
    if (newPin.length <= 4) {
      setPin(newPin);
    }
    if (newPin === '1234') {
      setTimeout(() => {
        setIsAuthenticated(true);
        setPin('');
      }, 200);
    } else if (newPin.length === 4) {
      setTimeout(() => {
        setPinError(true);
        setPin('');
      }, 200);
    }
  };

  const handlePinBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("このデータを削除してもよろしいですか？")) {
      try {
        await db.visitorRecords.delete(id);
      } catch (error) {
        console.error("Failed to delete record:", error);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || editingRecord.id === undefined) return;

    // Recalculate headcount if editing a family_adult record
    let finalHeadcount = editingRecord.headcount;
    if (editingRecord.entry_type === 'family_adult') {
      const adultsCount = editingRecord.adult_relations.length || 1;
      const kidsCount = editingRecord.child_ages.length;
      finalHeadcount = adultsCount + kidsCount;
    }

    try {
      await db.visitorRecords.put({
        ...editingRecord,
        headcount: finalHeadcount
      });
      setEditingRecord(null);
    } catch (error) {
      console.error("Failed to update record:", error);
      alert("更新に失敗しました。");
    }
  };

  const toggleEditAdult = (relation: string) => {
    if (!editingRecord) return;
    const current = editingRecord.adult_relations || [];
    const updated = current.includes(relation)
      ? current.filter(r => r !== relation)
      : [...current, relation];
    setEditingRecord({ ...editingRecord, adult_relations: updated });
  };

  const toggleEditChild = (ageGrade: string) => {
    if (!editingRecord) return;
    const current = editingRecord.child_ages || [];
    const updated = current.includes(ageGrade)
      ? current.filter(c => c !== ageGrade)
      : [...current, ageGrade];
    setEditingRecord({ ...editingRecord, child_ages: updated });
  };

  const exportToCSV = () => {
    if (!records || records.length === 0) {
      alert("書き出すデータがありません。");
      return;
    }

    // Format headers and rows matching paper form exactly
    const headers = [
      "ID", 
      "登録日時", 
      "受付タイプ", 
      "居住地/地区", 
      "学校（子どもだけ）", 
      "学年（子どもだけ）", 
      "同行した大人", 
      "子どもの年齢・学年", 
      "初めてですか？", 
      "知ったきっかけ", 
      "登録人数"
    ];
    
    const rows = records.map(r => [
      r.id,
      new Date(r.timestamp).toLocaleString('ja-JP'),
      r.entry_type === 'kids_only' ? '子どもだけ' : '親子・おとな',
      r.residence,
      r.school || '',
      r.child_grade || '',
      r.adult_relations ? r.adult_relations.join("、") : '',
      r.child_ages ? r.child_ages.join("、") : '',
      r.first_time ? 'はい' : 'いいえ',
      r.visit_reason || '',
      r.headcount
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // Add UTF-8 BOM to prevent Excel encoding issues
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `playpark_visitor_records_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter records based on search term
  const filteredRecords = records?.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    const typeStr = r.entry_type === 'kids_only' ? '子どもだけ' : '親子・おとな';
    const firstStr = r.first_time ? 'はい 初めて' : 'いいえ リピーター';
    const adultsStr = r.adult_relations ? r.adult_relations.join(" ") : '';
    const kidsStr = r.child_ages ? r.child_ages.join(" ") : '';
    
    return (
      r.residence.toLowerCase().includes(searchLower) ||
      (r.school && r.school.toLowerCase().includes(searchLower)) ||
      (r.child_grade && r.child_grade.toLowerCase().includes(searchLower)) ||
      typeStr.includes(searchLower) ||
      firstStr.includes(searchLower) ||
      adultsStr.toLowerCase().includes(searchLower) ||
      kidsStr.toLowerCase().includes(searchLower) ||
      (r.visit_reason && r.visit_reason.toLowerCase().includes(searchLower)) ||
      new Date(r.timestamp).toLocaleString('ja-JP').includes(searchLower)
    );
  }) || [];

  // Calculate advanced statistics
  const totalSubmissions = records?.length || 0;
  const totalVisitors = records?.reduce((acc, r) => acc + r.headcount, 0) || 0;
  
  const kidsOnlyRecords = records?.filter(r => r.entry_type === 'kids_only') || [];
  const familyRecords = records?.filter(r => r.entry_type === 'family_adult') || [];
  
  const firstTimersCount = records?.filter(r => r.entry_type === 'family_adult' && r.first_time).length || 0;
  const firstTimerPercentage = totalSubmissions > 0 && familyRecords.length > 0
    ? ((firstTimersCount / familyRecords.length) * 100).toFixed(0) 
    : '0';

  // Find top visit reason
  const visitReasonCounts: Record<string, number> = {};
  records?.forEach(r => {
    if (r.visit_reason) {
      visitReasonCounts[r.visit_reason] = (visitReasonCounts[r.visit_reason] || 0) + 1;
    }
  });
  
  let topReason = '-';
  let topReasonCount = 0;
  Object.entries(visitReasonCounts).forEach(([reason, count]) => {
    if (count > topReasonCount) {
      topReason = reason;
      topReasonCount = count;
    }
  });

  // Pagination helper
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Authentication PIN screen
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 text-center animate-scale-in">
        <div className="inline-flex p-4 bg-emerald-50 rounded-2xl text-emerald-600 mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">管理者用パネル</h2>
        <p className="text-slate-400 text-xs mt-1">パスコードを入力してください (1234)</p>
        
        {/* Passcode display */}
        <div className="flex justify-center gap-3 my-8">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 border-emerald-400 transition-all duration-150 
                ${pin.length > i ? 'bg-emerald-500 scale-110' : 'bg-transparent'} 
                ${pinError ? 'border-rose-500 bg-rose-500' : ''}`}
            />
          ))}
        </div>

        {pinError && (
          <p className="text-xs text-rose-500 font-bold mb-4 animate-shake">
            パスコードが違います。もう一度入力してください。
          </p>
        )}

        {/* Tactile PIN Pad */}
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-[280px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handlePinSubmit(num)}
              className="w-16 h-16 text-2xl font-bold rounded-full bg-slate-50 text-slate-700 active:scale-90 hover:bg-slate-100 transition-all flex items-center justify-center border border-slate-100 focus:outline-none"
            >
              {num}
            </button>
          ))}
          <button 
            onClick={onClose}
            className="w-16 h-16 text-sm font-semibold rounded-full text-slate-400 hover:text-slate-600 transition flex items-center justify-center"
          >
            戻る
          </button>
          <button
            onClick={() => handlePinSubmit('0')}
            className="w-16 h-16 text-2xl font-bold rounded-full bg-slate-50 text-slate-700 active:scale-90 hover:bg-slate-100 transition-all flex items-center justify-center border border-slate-100 focus:outline-none"
          >
            0
          </button>
          <button
            onClick={handlePinBackspace}
            className="w-16 h-16 text-sm font-semibold rounded-full text-slate-400 hover:text-slate-600 active:scale-90 transition flex items-center justify-center"
          >
            消す
          </button>
        </div>
      </div>
    );
  }

  // Admin Dashboard Main Content
  return (
    <div className="w-full bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-brand-900/5 border border-white/20 p-6 md:p-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <button 
            onClick={onClose} 
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            キオスク画面に戻る
          </button>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            来場者データ管理
          </h2>
        </div>
        
        <div className="flex w-full sm:w-auto gap-3">
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition shadow-md shadow-emerald-600/10"
          >
            <Download className="w-4 h-4" />
            CSVエクスポート (Excel用)
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-md shadow-emerald-500/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold opacity-80">総登録件数（受付回数）</span>
            <Grid className="w-5 h-5 opacity-60" />
          </div>
          <span className="text-3xl font-extrabold">{totalSubmissions}</span>
          <span className="text-xs font-semibold block mt-1 opacity-80">
            子どもだけ: {kidsOnlyRecords.length} / 親子: {familyRecords.length}
          </span>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-md shadow-amber-500/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold opacity-80">合計来場者数</span>
            <Users className="w-5 h-5 opacity-60" />
          </div>
          <span className="text-3xl font-extrabold">{totalVisitors}</span>
          <span className="text-xs font-semibold block mt-1 opacity-80">名</span>
        </div>

        <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl p-5 text-white shadow-md shadow-sky-500/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold opacity-80">初回登録（親子のみ対象）</span>
            <UserCheck className="w-5 h-5 opacity-60" />
          </div>
          <span className="text-3xl font-extrabold">{firstTimersCount}</span>
          <span className="text-xs font-semibold block mt-1 opacity-80">親子来場の {firstTimerPercentage}%</span>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-md shadow-purple-500/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold opacity-80">最も多い来場きっかけ</span>
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <span className="text-lg font-bold truncate block my-1.5">{topReason}</span>
          <span className="text-xs font-semibold block opacity-80">登録: {topReasonCount} 件</span>
        </div>
      </div>

      {/* Announcement Editor Card */}
      <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 mb-8 shadow-sm">
        <h3 className="text-sm font-black text-amber-900 mb-2 flex items-center gap-1.5">
          <Megaphone className="w-4 h-4 text-amber-600" />
          プレイパークからのお知らせ編集（登録完了画面に表示）
        </h3>
        <p className="text-xs text-slate-500 mb-3 font-semibold">
          子どもたちや親御さんの入力が終わったときの終了画面に表示するお知らせメッセージを編集できます。
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            rows={3}
            className="flex-1 p-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white font-semibold text-slate-700 leading-relaxed"
            placeholder="お知らせ内容を入力してください..."
          />
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSaveAnnouncement}
              className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold py-3 px-5 text-sm rounded-xl transition shadow-md shadow-amber-500/10 flex items-center justify-center sm:min-w-[120px] w-full"
            >
              お知らせを保存
            </button>
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="キーワードで検索 (学年、居住地区、学校、きっかけ)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            />
          </div>
          <div className="text-xs text-slate-400 font-semibold self-end sm:self-center">
            検索結果: {filteredRecords.length} 件 / 全 {totalSubmissions} 件
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs bg-slate-50/30 uppercase tracking-wider">
                <th className="py-4 px-5">ID</th>
                <th className="py-4 px-5">日時</th>
                <th className="py-4 px-5">タイプ</th>
                <th className="py-4 px-5">居住地区 / 学校名</th>
                <th className="py-4 px-5">登録内訳</th>
                <th className="py-4 px-5">初めて？ / きっかけ</th>
                <th className="py-4 px-5 text-center">人数</th>
                <th className="py-4 px-5 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
              {currentItems.length > 0 ? (
                currentItems.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-400">#{r.id}</td>
                    <td className="py-3.5 px-5 text-xs whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap
                        ${r.entry_type === 'kids_only' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'}`}
                      >
                        {r.entry_type === 'kids_only' ? '子どもだけ' : '親子・おとな'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-semibold">{r.residence}</span>
                        {r.school && (
                          <span className="text-xs text-emerald-600 font-bold mt-0.5 flex items-center gap-0.5">
                            🏫 {r.school} ({r.child_grade})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                        {r.entry_type === 'kids_only' ? (
                          <span>子ども単独グループ ({r.child_grade})</span>
                        ) : (
                          <>
                            {r.adult_relations.length > 0 && (
                              <span>👤 大人: {r.adult_relations.join(", ")}</span>
                            )}
                            {r.child_ages.length > 0 && (
                              <span>👶 子ども: {r.child_ages.join(", ")}</span>
                            )}
                            {r.adult_relations.length === 0 && r.child_ages.length === 0 && (
                              <span>大人（内訳なし）</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-0.5 text-xs">
                        {r.entry_type === 'family_adult' ? (
                          r.first_time ? (
                            <>
                              <span className="text-amber-600 font-bold">✨ 初めて</span>
                              <span className="text-slate-400 text-[10px]">{r.visit_reason}</span>
                            </>
                          ) : (
                            <span className="text-slate-400">リピーター</span>
                          )
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center font-extrabold text-slate-800">
                      {r.headcount}名
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => setEditingRecord(r)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="編集"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => r.id !== undefined && handleDelete(r.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">
                    記録が見つかりません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/20 text-xs font-semibold text-slate-500">
            <span>
              {filteredRecords.length}件中 {indexOfFirstItem + 1}〜{Math.min(indexOfLastItem, filteredRecords.length)} 件を表示
            </span>
            <div className="flex gap-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-scale-in border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                登録データの編集 (ID #{editingRecord.id})
              </h3>
              <button 
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Entry Type display */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">受付タイプ</label>
                <div className="text-sm font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {editingRecord.entry_type === 'kids_only' ? '子どもだけで来場' : '親子・おとな来場'}
                </div>
              </div>

              {/* ======================================= */}
              {/* EDITING KIDS ONLY                       */}
              {/* ======================================= */}
              {editingRecord.entry_type === 'kids_only' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">通っている学校</label>
                    <select
                      value={editingRecord.school || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, school: e.target.value })}
                      className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 font-semibold"
                    >
                      {SCHOOLS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">学年</label>
                    <select
                      value={editingRecord.child_grade || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, child_grade: e.target.value })}
                      className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 font-semibold"
                    >
                      {GRADES.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">来場人数</label>
                    <select
                      value={editingRecord.headcount}
                      onChange={(e) => setEditingRecord({ ...editingRecord, headcount: Number(e.target.value) })}
                      className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 font-semibold"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num}名{num === 5 ? '以上' : ''}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* ======================================= */}
              {/* EDITING FAMILY / ADULTS                 */}
              {/* ======================================= */}
              {editingRecord.entry_type === 'family_adult' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">お住まいの地区</label>
                    <select
                      value={editingRecord.residence}
                      onChange={(e) => setEditingRecord({ ...editingRecord, residence: e.target.value })}
                      className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 font-semibold"
                    >
                      {RESIDENCES.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Adults Checkboxes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">同行した大人 (複数選択)</label>
                    <div className="flex flex-wrap gap-2">
                      {ADULT_RELATIONS.map(opt => {
                        const isChecked = editingRecord.adult_relations?.includes(opt) || false;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleEditAdult(opt)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1
                              ${isChecked 
                                ? 'bg-amber-500 text-white border-amber-500' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'}`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Children Checkboxes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">こどもの年齢・学年 (複数選択)</label>
                    <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-1 border border-slate-100 rounded-lg">
                      {CHILD_AGES.map(opt => {
                        const isChecked = editingRecord.child_ages?.includes(opt) || false;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleEditChild(opt)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1
                              ${isChecked 
                                ? 'bg-amber-500 text-white border-amber-500' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'}`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* First Time & Reason */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">初めてですか？</label>
                      <select
                        value={editingRecord.first_time ? "true" : "false"}
                        onChange={(e) => setEditingRecord({ 
                          ...editingRecord, 
                          first_time: e.target.value === "true",
                          visit_reason: e.target.value === "true" ? (editingRecord.visit_reason || VISIT_REASONS[0]) : undefined
                        })}
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 font-semibold"
                      >
                        <option value="false">いいえ (リピーター)</option>
                        <option value="true">はい (初回)</option>
                      </select>
                    </div>

                    {editingRecord.first_time && (
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">知ったきっかけ</label>
                        <select
                          value={editingRecord.visit_reason || ''}
                          onChange={(e) => setEditingRecord({ ...editingRecord, visit_reason: e.target.value })}
                          className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 font-semibold"
                        >
                          {VISIT_REASONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition border border-slate-100"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition shadow-md shadow-emerald-600/10"
                >
                  変更を保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
