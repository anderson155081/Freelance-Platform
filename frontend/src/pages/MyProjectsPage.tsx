import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService, Project, Bid } from '../services/auth';

const MyProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if user is not a client
  useEffect(() => {
    if (user && user.role !== 'client') {
      navigate('/projects');
    }
  }, [user, navigate]);

  useEffect(() => {
    loadMyProjects();
  }, []);

  const loadMyProjects = async () => {
    try {
      setLoading(true);
      setError('');

      // Get projects where the current user is the client
      const response = await authService.getProjects({ limit: 100 });
      const myProjects = response.projects.filter(project => project.client_id === user?.id);
      setProjects(myProjects);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError('載入案件失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectBids = async (projectId: number) => {
    try {
      const response = await authService.getProjectBids(projectId);
      setBids(response.bids);
      setShowBidsModal(true);
    } catch (err: any) {
      console.error('Failed to load bids:', err);
      alert('載入提案失敗，請稍後再試');
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
      alert('無法開始聊天，請稍後再試');
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
                     project.status === 'completed' ? '已完成' : '已取消'}
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
    </div>
  );
};

export default MyProjectsPage; 