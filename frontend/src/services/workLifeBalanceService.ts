import api from './api';
import { ApiResponse, WorkLifeBalance } from '../types/api';

/**
 * ワークライフバランス管理サービス
 */
const workLifeBalanceService = {
  /**
   * ワークライフバランスのデータを取得
   */
  async getWorkLifeBalance(): Promise<ApiResponse<WorkLifeBalance>> {
    return api.get<WorkLifeBalance>('/api/work-life-balance');
  },

  /**
   * ウェルネス指標を更新
   * @param indicatorId ウェルネス指標ID
   * @param value 新しい値
   */
  async updateWellnessIndicator(indicatorId: number, value: number): Promise<ApiResponse<WorkLifeBalance>> {
    return api.put<WorkLifeBalance>(`/api/work-life-balance/wellness/${indicatorId}`, { value });
  },

  /**
   * 健康に関する目標を設定
   * @param goalData 目標データ
   */
  async setHealthGoal(goalData: { category: string, value: number, deadline: string }): Promise<ApiResponse<any>> {
    return api.post<any>('/api/work-life-balance/goals', goalData);
  },

  /**
   * ワークライフバランスの履歴を取得
   * @param period 期間（日次、週次、月次）
   */
  async getBalanceHistory(period: 'daily' | 'weekly' | 'monthly'): Promise<ApiResponse<any>> {
    return api.get<any>(`/api/work-life-balance/history`, { period });
  }
};

export default workLifeBalanceService; 
