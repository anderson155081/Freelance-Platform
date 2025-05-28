import api from './api';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string; // 'freelancer' (接案者) or 'client' (發案者)
  avatar?: string;
  bio?: string; // Self introduction
  skills?: string; // JSON array of skills for freelancers
  rating?: number;
  completed_projects?: number;
  // Professional fields for freelancers
  profession?: string; // 職業/專業領域
  experience?: string; // Work experience
  portfolio?: string; // Portfolio URL or description
  hourly_rate?: number; // Hourly rate in TWD
  available?: boolean; // Available for work
  // Location for Taiwan market
  city?: string; // City in Taiwan
  // Social links
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  skills?: string;
  role?: string;
  profession?: string;
  experience?: string;
  portfolio?: string;
  hourly_rate?: number;
  available?: boolean;
  city?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

// Project and bidding functionality
export interface Project {
  id: number;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  category: string;
  location: string;
  skills: string;
  requirements: string;
  urgency: string;
  status: string;
  client_id: number;
  client: User;
  freelancer_id?: number;
  freelancer?: User;
  bids?: Bid[];
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: number;
  project_id: number;
  project?: Project;
  freelancer_id: number;
  freelancer: User;
  amount: number;
  proposal: string;
  timeline: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectFilters {
  search?: string;
  category?: string;
  location?: string;
  min_budget?: number;
  max_budget?: number;
  urgency?: string;
  page?: number;
  limit?: number;
  my_projects?: boolean;
}

export interface CreateBidRequest {
  project_id: number;
  amount: number;
  proposal: string;
  timeline: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  category: string;
  location: string;
  skills: string;
  requirements: string;
  urgency: string;
}

export interface UpdateProjectRequest {
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  category: string;
  location: string;
  skills: string;
  requirements: string;
  urgency: string;
}

// Chat and messaging functionality
export interface Chat {
  id: number;
  project_id: number;
  project: {
    id: number;
    title: string;
  };
  client_id: number;
  client: User;
  freelancer_id: number;
  freelancer: User;
  created_at: string;
  updated_at: string;
  unread_count?: number; // Added for unread count
}

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  sender: User;
  content: string;
  type: string;
  read_at?: string; // Added for read status
  created_at: string;
}

export interface CreateChatRequest {
  project_id: number;
  freelancer_id: number;
}

export interface SendMessageRequest {
  chat_id: number;
  content: string;
  type?: string;
}

let currentUser: User | null = null;

const projectService = {
  async getProjects(filters: ProjectFilters = {}): Promise<{ projects: Project[] }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/projects?${params.toString()}`);
    return response.data;
  },

  async getProject(id: number): Promise<{ project: Project }> {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  async createProject(projectData: CreateProjectRequest): Promise<{ project: Project }> {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  async updateProject(id: number, projectData: UpdateProjectRequest): Promise<{ project: Project }> {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  async deleteProject(id: number): Promise<{ success: boolean }> {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  async updateProjectStatus(id: number, status: string): Promise<{ project: Project }> {
    const response = await api.put(`/projects/${id}/status`, { status });
    return response.data;
  },

  async createBid(bidData: CreateBidRequest): Promise<{ bid: Bid }> {
    const response = await api.post('/bids', bidData);
    return response.data;
  },

  async getProjectBids(projectId: number): Promise<{ bids: Bid[] }> {
    const response = await api.get(`/projects/${projectId}/bids`);
    return response.data;
  }
};

const chatService = {
  async getChats(): Promise<{ chats: Chat[] }> {
    const response = await api.get('/chats');
    return response.data;
  },

  async createChat(chatData: CreateChatRequest): Promise<{ chat: Chat }> {
    const response = await api.post('/chats', chatData);
    return response.data;
  },

  async getChatMessages(chatId: number): Promise<{ messages: Message[] }> {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response.data;
  },

  async sendMessage(messageData: SendMessageRequest): Promise<{ message: Message }> {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  async markMessagesAsRead(chatId: number): Promise<{ success: boolean }> {
    const response = await api.put(`/chats/${chatId}/read`);
    return response.data;
  },

  async getUnreadCount(): Promise<{ unread_count: number }> {
    const response = await api.get('/messages/unread-count');
    return response.data;
  },

  async deleteChat(chatId: number): Promise<{ success: boolean }> {
    const response = await api.delete(`/chats/${chatId}`);
    return response.data;
  }
};

const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    currentUser = user;
    return { user, token };
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData);
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    currentUser = user;
    return { user, token };
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    currentUser = null;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    const user = response.data.user;
    currentUser = user;
    return user;
  },

  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    const response = await api.put('/auth/profile', profileData);
    const updatedUser = response.data.user;
    currentUser = updatedUser;
    return updatedUser;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getUser(): User | null {
    return currentUser;
  },

  async initializeAuth(): Promise<User | null> {
    if (this.isAuthenticated()) {
      try {
        const user = await this.getCurrentUser();
        return user;
      } catch (error) {
        // Token might be invalid, clear it
        this.logout();
        return null;
      }
    }
    return null;
  },

  ...projectService, // Spread project service methods
  ...chatService // Spread chat service methods
};

export { authService }; 