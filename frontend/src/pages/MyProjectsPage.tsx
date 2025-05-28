import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { authService, Project, Bid, UpdateProjectRequest } from '../services/auth';

const categories = [
  '商業設計',
  '程式開發', 
  '文書翻譯',
  '企劃行銷',
  '攝影娛樂',
  '生活服務',
  '法律諮詢',
  '財務會計'
];

const locations = [
  'Remote',
  '台北市',
  '新北市',
  '桃園市',
  '台中市',
  '台南市',
  '高雄市',
  '新竹市',
  '其他縣市'
];

const MyProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useNotification();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToChangeStatus, setProjectToChangeStatus] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState<UpdateProjectRequest>({
    title: '',
    description: '',
    budget_min: 0,
    budget_max: 0,
    category: '',
    location: '',
    skills: '',
    requirements: '',
    urgency: ''
  });

  // Redirect if user is not a client
  useEffect(() => {
    if (user && user.role !== 'client') {
      navigate('/projects');
    }
  }, [user, navigate]);

  const loadMyProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Get all projects for the current user (not just open ones)
      const response = await authService.getProjects({ 
        limit: 100,
        my_projects: true
      });
      const myProjects = response.projects.filter(project => project.client_id === user?.id);
      setProjects(myProjects);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError('載入案件失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMyProjects();
  }, [loadMyProjects]);

  const loadProjectBids = async (projectId: number) => {
    try {
      const response = await authService.getProjectBids(projectId);
      setBids(response.bids);
      setShowBidsModal(true);
    } catch (err: any) {
      console.error('Failed to load bids:', err);
      showError('載入提案失敗，請稍後再試');
    }
  };

  const handleViewBids = (project: Project) => {
    setSelectedProject(project);
    loadProjectBids(project.id);
  };

  const handleStartChat = async (freelancer: any) => {
    try {
      if (!selectedProject) return;
      
      // Create or get existing chat
      const response = await authService.createChat({
        project_id: selectedProject.id,
        freelancer_id: freelancer.id
      });
      
      // Navigate to messages page with the chat ID
      navigate(`/messages?chat=${response.chat.id}`);
    } catch (error) {
      console.error('Failed to create chat:', error);
      showError('無法開始聊天，請稍後再試');
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    
    // Parse requirements back to string format for editing
    let requirementsString = '';
    try {
      const requirementsArray = JSON.parse(project.requirements);
      requirementsString = Array.isArray(requirementsArray) ? requirementsArray.join('\n') : project.requirements;
    } catch {
      requirementsString = project.requirements;
    }
    
    setEditForm({
      title: project.title,
      description: project.description,
      budget_min: project.budget_min,
      budget_max: project.budget_max,
      category: project.category,
      location: project.location,
      skills: project.skills,
      requirements: requirementsString,
      urgency: project.urgency
    });
    setShowEditModal(true);
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      setDeleteLoading(true);
      await authService.deleteProject(project.id);
      showSuccess('案件刪除成功！');
      
      // Reload projects
      await loadMyProjects();
      
      // Close modal and reset state
      setProjectToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      showError(error.response?.data?.error || '刪除失敗，請稍後再試');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChangeProjectStatus = async (project: Project, newStatus: string) => {
    try {
      setStatusLoading(true);
      await authService.updateProjectStatus(project.id, newStatus);
      
      const statusText = newStatus === 'cancelled' ? '關閉' : 
                        newStatus === 'open' ? '重新開放' : newStatus;
      showSuccess(`案件已${statusText}！`);
      
      // Reload projects
      await loadMyProjects();
      
      // Close modal and reset state
      setShowStatusModal(false);
      setProjectToChangeStatus(null);
    } catch (error: any) {
      console.error('Failed to update project status:', error);
      showError(error.response?.data?.error || '狀態更新失敗，請稍後再試');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    // Validate form
    if (editForm.budget_min >= editForm.budget_max) {
      showWarning('最低預算必須小於最高預算');
      return;
    }

    if (!editForm.title.trim()) {
      showWarning('請填寫案件標題');
      return;
    }

    try {
      setEditLoading(true);
      
      // Convert requirements back to JSON array format
      const requirementsArray = editForm.requirements
        .split('\n')
        .map(req => req.trim())
        .filter(req => req.length > 0);
      
      const updateData = {
        ...editForm,
        requirements: JSON.stringify(requirementsArray)
      };
      
      await authService.updateProject(selectedProject.id, updateData);
      showSuccess('案件更新成功！');
      
      // Reload projects
      await loadMyProjects();
      setShowEditModal(false);
      setSelectedProject(null);
    } catch (error: any) {
      console.error('Failed to update project:', error);
      showError(error.response?.data?.error || '更新失敗，請稍後再試');
    } finally {
      setEditLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1天前';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}週前`;
    return `${Math.ceil(diffDays / 30)}個月前`;
  };

  if (!user) {
    return <div>請先登入</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">我的案件</h1>
        <button
          onClick={() => navigate('/post-task')}
          className="btn-primary"
        >
          發布新案件
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-6">
        {projects.map(project => (
          <div key={project.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    project.status === 'open' ? 'bg-green-100 text-green-800' :
                    project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {project.status === 'open' ? '開放中' :
                     project.status === 'in_progress' ? '進行中' :
                     project.status === 'completed' ? '已完成' : '已關閉'}
                  </span>
                  {project.urgency === '急件' && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                      急件
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {project.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {project.location}
                  </span>
                  <span className="text-gray-500">發布於 {formatTimeAgo(project.created_at)}</span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>

                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-600">
                    NT$ {project.budget_min.toLocaleString()} - {project.budget_max.toLocaleString()}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      編輯案件
                    </button>
                    {project.status === 'open' && (
                      <button
                        onClick={() => {
                          setShowStatusModal(true);
                          setProjectToChangeStatus(project);
                        }}
                        className="px-3 py-2 border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
                        </svg>
                        關閉案件
                      </button>
                    )}
                    {project.status === 'cancelled' && (
                      <button
                        onClick={() => {
                          setShowStatusModal(true);
                          setProjectToChangeStatus(project);
                        }}
                        className="px-3 py-2 border border-green-300 text-green-700 rounded-md hover:bg-green-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        重新開放
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setProjectToDelete(project);
                      }}
                      className="px-3 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      刪除案件
                    </button>
                    <button
                      onClick={() => handleViewBids(project)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      查看提案 {project.bids ? `(${project.bids.length})` : '(0)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">還沒有發布任何案件</h3>
          <p className="mt-1 text-sm text-gray-500">點擊上方按鈕發布您的第一個案件</p>
        </div>
      )}

      {/* Bids Modal */}
      {showBidsModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedProject.title} - 提案列表
              </h2>
              <button
                onClick={() => {
                  setShowBidsModal(false);
                  setSelectedProject(null);
                  setBids([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {bids.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">還沒有收到提案</h3>
                  <p className="mt-1 text-sm text-gray-500">等待接案者提交提案</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {bids.map(bid => (
                    <div key={bid.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {bid.freelancer.name}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {bid.status === 'pending' ? '待回覆' :
                               bid.status === 'accepted' ? '已接受' : '已拒絕'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <span className="text-sm font-medium text-gray-600">報價</span>
                              <p className="text-lg font-bold text-green-600">
                                NT$ {bid.amount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-600">預計完成時間</span>
                              <p className="text-gray-900">{bid.timeline}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-600">提案時間</span>
                              <p className="text-gray-900">{formatTimeAgo(bid.created_at)}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <span className="text-sm font-medium text-gray-600">提案說明</span>
                            <p className="text-gray-700 mt-1 leading-relaxed">{bid.proposal}</p>
                          </div>

                          {bid.freelancer.bio && (
                            <div className="mb-4">
                              <span className="text-sm font-medium text-gray-600">接案者簡介</span>
                              <p className="text-gray-700 mt-1">{bid.freelancer.bio}</p>
                            </div>
                          )}

                          <div className="flex gap-3">
                            <button
                              onClick={() => handleStartChat(bid.freelancer)}
                              className="btn-primary flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              與接案者聊天
                            </button>
                            
                            {bid.freelancer.portfolio && (
                              <a
                                href={bid.freelancer.portfolio}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                查看作品集
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">編輯案件</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProject(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">基本資訊</h3>
                
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    案件標題 *
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：Logo 設計、網站開發、文件翻譯..."
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    詳細描述 *
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請詳細描述您的案件需求、預期成果、時間安排等..."
                    required
                  />
                </div>

                {/* Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最低預算 (新台幣) *
                    </label>
                    <input
                      type="number"
                      value={editForm.budget_min}
                      onChange={(e) => setEditForm({...editForm, budget_min: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="5000"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最高預算 (新台幣) *
                    </label>
                    <input
                      type="number"
                      value={editForm.budget_max}
                      onChange={(e) => setEditForm({...editForm, budget_max: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="50000"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Category and Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      案件類別 *
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      工作地點 *
                    </label>
                    <select
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    急迫程度
                  </label>
                  <select
                    value={editForm.urgency}
                    onChange={(e) => setEditForm({...editForm, urgency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="一般">一般</option>
                    <option value="急件">急件</option>
                  </select>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    需要技能
                  </label>
                  <input
                    type="text"
                    value={(() => {
                      try {
                        const skillsArray = JSON.parse(editForm.skills || '[]');
                        return skillsArray.join(', ');
                      } catch {
                        return editForm.skills || '';
                      }
                    })()}
                    onChange={(e) => {
                      const skillsArray = e.target.value
                        .split(',')
                        .map(skill => skill.trim())
                        .filter(skill => skill.length > 0);
                      setEditForm({...editForm, skills: JSON.stringify(skillsArray)});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：Photoshop, Illustrator, React, Node.js（用逗號分隔）"
                  />
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    其他需求
                  </label>
                  <textarea
                    value={editForm.requirements}
                    onChange={(e) => setEditForm({...editForm, requirements: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請描述其他特殊需求或條件，每項需求請單獨一行..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProject(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={editLoading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className={`flex-1 btn-primary ${editLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={editLoading}
                >
                  {editLoading ? '更新中...' : '更新案件'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">刪除案件</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProjectToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                確定要刪除案件「{projectToDelete.title}」嗎？此操作無法復原，所有相關的提案和聊天記錄也會被刪除。
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProjectToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={deleteLoading}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteProject(projectToDelete);
                    setShowDeleteModal(false);
                  }}
                  className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${deleteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? '刪除中...' : '刪除案件'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Project Status Modal */}
      {showStatusModal && projectToChangeStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  projectToChangeStatus.status === 'open' ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                  <svg className={`w-5 h-5 ${
                    projectToChangeStatus.status === 'open' ? 'text-orange-600' : 'text-green-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {projectToChangeStatus.status === 'open' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {projectToChangeStatus.status === 'open' ? '關閉案件' : '重新開放案件'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setProjectToChangeStatus(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                disabled={statusLoading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  確定要{projectToChangeStatus.status === 'open' ? '關閉' : '重新開放'}案件「
                  <span className="font-semibold">{projectToChangeStatus.title}</span>」嗎？
                </p>
                {projectToChangeStatus.status === 'open' ? (
                  <p className="text-sm text-orange-600 font-medium">
                    關閉後，此案件將不會出現在公開的案件列表中，接案者無法再提交新的提案。
                  </p>
                ) : (
                  <p className="text-sm text-green-600 font-medium">
                    重新開放後，此案件將重新出現在公開的案件列表中，接案者可以提交提案。
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false);
                    setProjectToChangeStatus(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={statusLoading}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeProjectStatus(
                    projectToChangeStatus, 
                    projectToChangeStatus.status === 'open' ? 'cancelled' : 'open'
                  )}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    projectToChangeStatus.status === 'open' 
                      ? 'bg-orange-600 text-white hover:bg-orange-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } ${statusLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={statusLoading}
                >
                  {statusLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>處理中...</span>
                    </div>
                  ) : (
                    projectToChangeStatus.status === 'open' ? '關閉案件' : '重新開放'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjectsPage; 