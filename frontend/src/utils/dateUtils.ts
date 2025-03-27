/**
 * 日付と時間に関するユーティリティ関数
 */

/**
 * 日本標準時のDateオブジェクトを取得
 */
export const getJSTDate = (date: Date = new Date()): Date => {
  const jstOffset = 9 * 60; // JST is UTC+9
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (jstOffset * 60000));
};

/**
 * HH:MM形式で時間をフォーマット（日本時間・秒を含めない）
 */
export const formatTime = (date: Date = new Date()): string => {
  // 日本時間に変換
  const jstDate = getJSTDate(date);
  const hours = jstDate.getHours().toString().padStart(2, '0');
  const minutes = jstDate.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * YYYY-MM-DD形式で日付をフォーマット（日本時間）
 */
export const formatDate = (date: Date = new Date()): string => {
  // 日本時間に変換
  const jstDate = getJSTDate(date);
  const year = jstDate.getFullYear();
  const month = (jstDate.getMonth() + 1).toString().padStart(2, '0');
  const day = jstDate.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 時刻文字列を日本時間のDateオブジェクトに変換
 */
export const parseTimeToJST = (timeString: string): Date => {
  const today = new Date();
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  
  // 日本時間でDateオブジェクトを作成
  const jstDate = getJSTDate(today);
  jstDate.setHours(hours, minutes, seconds || 0);
  
  return jstDate;
};

/**
 * 2つの時刻の間の経過時間を時間単位で計算（小数点以下2桁まで）
 */
export const calculateHoursBetween = (start: string, end: string): number => {
  // 日本時間として処理
  const startDate = parseTimeToJST(start);
  const endDate = parseTimeToJST(end);
  
  const diffInMilliseconds = endDate.getTime() - startDate.getTime();
  return Math.round(diffInMilliseconds / (1000 * 60 * 60) * 100) / 100;
}; 
