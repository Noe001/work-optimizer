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
 * HH:MM:SS形式で時間をフォーマット
 */
export const formatTime = (date: Date = new Date()): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * YYYY-MM-DD形式で日付をフォーマット
 */
export const formatDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 2つの時刻の間の経過時間を時間単位で計算（小数点以下2桁まで）
 */
export const calculateHoursBetween = (start: string, end: string): number => {
  const startTime = new Date(`1970-01-01T${start}`);
  const endTime = new Date(`1970-01-01T${end}`);
  
  const diffInMilliseconds = endTime.getTime() - startTime.getTime();
  return Math.round(diffInMilliseconds / (1000 * 60 * 60) * 100) / 100;
}; 
