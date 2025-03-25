import api from './api';

export interface Organization {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
}

export interface JoinOrganizationRequest {
  organization_id: string;
}

const organizationService = {
  // 組織一覧を取得
  getOrganizations: async (): Promise<Organization[]> => {
    const response = await api.get('/api/organizations');
    return response.data as Organization[];
  },

  // 組織の詳細を取得
  getOrganization: async (id: string): Promise<Organization> => {
    const response = await api.get(`/api/organizations/${id}`);
    return response.data as Organization;
  },

  // 新しい組織を作成
  createOrganization: async (data: CreateOrganizationRequest): Promise<Organization> => {
    const response = await api.post('/api/organizations', { organization: data });
    return response.data as Organization;
  },

  // 組織に参加
  joinOrganization: async (data: JoinOrganizationRequest): Promise<Organization> => {
    const response = await api.post('/api/organizations/join', data);
    return response.data as Organization;
  }
};

export default organizationService; 
