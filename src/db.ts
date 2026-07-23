import Dexie, { type Table } from 'dexie';

export interface VisitorRecord {
  id?: number;
  timestamp: number;
  entry_type: 'kids_only' | 'family_adult';
  
  // Residence Area
  residence: string; 
  // "中野区（江古田・沼袋）", "中野区（新井・上高田）", "中野区（松が丘）", 
  // "中野区（丸山・野方・若宮・大和町）", "中野区（鷺宮・白鷺）", "中野区（上鷺宮）",
  // "中野区（東中野・中央・中野）", "中野区（弥生町・南台）", "練馬区", "新宿区", "その他"
  
  // School (for kids only)
  school?: string; // "江古田小", "江原小", "緑野小", "その他中野区", "練馬区", "その他（中野区・練馬区外）", "中学生以上"
  child_grade?: string; // "1年生", "2年生", "3年生", "4年生", "5年生", "6年生", "中学生以上"

  // Family details (for parents & children / adults)
  adult_relations: string[]; // e.g. ["母", "父", "祖父母", "その他"]
  child_ages: string[];      // e.g. ["0歳", "1歳", "2歳", "3歳", "4歳", "5歳", "6歳", "小1", "小2", "小3", "小4", "小5", "小6", "中学生以上"]
  
  // First time survey
  first_time: boolean;
  visit_reason?: string; 
  // "通りがかり", "人から聞いて", "X (旧Twitter)", "インスタ", "ホームページ", 
  // "チラシ（学校配布）", "チラシ（掲示板）", "チラシ（子育てひろば）", "チラシ（保健センター）", "チラシ（児童館）", "その他"
  
  headcount: number; // Total number of people (calculated)
}

export class PlayparkDatabase extends Dexie {
  visitorRecords!: Table<VisitorRecord>;

  constructor() {
    super('PlayparkDatabase');
    this.version(2).stores({
      visitorRecords: '++id, timestamp, entry_type, residence, school, first_time'
    });
  }
}

export const db = new PlayparkDatabase();
