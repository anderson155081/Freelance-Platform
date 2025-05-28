import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { authService, Project, CreateBidRequest } from '../services/auth';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidData, setBidData] = useState({
    amount: '',
    proposal: '',
    timeline: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authService.getProject(parseInt(id!));
      setProject(response.project);
    } catch (err: any) {
      console.error('Failed to load project:', err);
      
      // Handle deleted projects specifically
      if (err.response?.status === 410 && err.response?.data?.deleted) {
        setError('案件已被刪除');
      } else if (err.response?.status === 404) {
        setError('案件不存在');
      } else {
        setError('載入案件失敗');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id, loadProject]);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project || !user) return;
    
    // Validate form
    const amount = parseInt(bidData.amount);
    if (!amount || amount < project.budget_min || amount > project.budget_max) {
      showWarning(`報價必須在 $${project.budget_min.toLocaleString()} - $${project.budget_max.toLocaleString()} 之間`);
      return;
    }
    
    if (!bidData.proposal.trim()) {
      showWarning('請填寫提案內容');
      return;
    }
    
    if (!bidData.timeline.trim()) {
      showWarning('請填寫預估時間');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const createBidData: CreateBidRequest = {
        project_id: project.id,
        amount: amount,
        proposal: bidData.proposal,
        timeline: bidData.timeline
      };
      
      await authService.createBid(createBidData);
      showSuccess('投標成功！發案者會盡快回覆您。');
      
      // Reload project to get updated bids
      await loadProject();
      setShowBidModal(false);
      setBidData({ amount: '', proposal: '', timeline: '' });
    } catch (err: any) {
      console.error('投標失敗:', err);
      let errorMessage = '投標失敗，請稍後再試';
      
      if (err.response?.status === 409) {
        errorMessage = '您已經對此案件投標過了';
      } else if (err.response?.status === 403) {
        errorMessage = '您無法對此案件投標';
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.error || '投標資料有誤';
      }
      
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const canUserBid = () => {
    if (!user || !project) return false;
    
    // Only freelancers can bid
    if (user.role !== 'freelancer') return false;
    
    // Can't bid on own project
    if (project.client_id === user.id) return false;
    
    // Can't bid if project is not open
    if (project.status !== 'open') return false;
    
    // Can't bid if already has a bid from this user
    const userHasBid = project.bids?.some(bid => bid.freelancer_id === user.id);
    if (userHasBid) return false;
    
    return true;
  };

  const getUserBid = () => {
    if (!user || !project?.bids) return null;
    return project.bids.find(bid => bid.freelancer_id === user.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const parseSkills = (skillsString: string): string[] => {
    try {
      return JSON.parse(skillsString || '[]');
    } catch {
      return skillsString ? skillsString.split(',').map(s => s.trim()) : [];
    }
  };

  const parseRequirements = (requirementsString: string): string[] => {
    try {
      return JSON.parse(requirementsString || '[]');
    } catch {
      return requirementsString ? requirementsString.split('\n').map(r => r.trim()).filter(r => r.length > 0) : [];
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">載入中...</span>
      </div>
    );
  }

  if (error) {
    const isDeleted = error === '案件已被刪除';
    
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          {isDeleted ? (
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          <h2 className={`text-xl font-semibold mb-2 ${isDeleted ? 'text-yellow-800' : 'text-red-600'}`}>
            {error}
          </h2>
          {isDeleted && (
            <p className="text-yellow-700 mb-4">
              此案件已被發案者刪除，無法查看詳細內容。
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          返回案件列表
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">案件不存在</div>
        <button
          onClick={() => navigate('/projects')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          返回案件列表
        </button>
      </div>
    );
  }

  const userBid = getUserBid();
  const skills = parseSkills(project.skills);
  const requirements = parseRequirements(project.requirements);

  return (
    <div>
      {/* Project Header */}
      <div className="card mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm ${
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
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                急件
              </span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 leading-relaxed">{project.description}</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">預算範圍</h3>
            <p className="text-2xl font-bold text-green-600">
              ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">案件類別</h3>
            <p className="text-gray-900">{project.category}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">工作地點</h3>
            <p className="text-gray-900">{project.location}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">發布時間</h3>
            <p className="text-gray-900">{formatDate(project.created_at)}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">發案者</h3>
            <p className="text-gray-900">{project.client.name}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">案件編號</h3>
            <p className="text-gray-500">#{project.id}</p>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">需要技能</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {requirements.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">其他需求</h3>
            <ul className="list-disc pl-6">
              {requirements.map((requirement, index) => (
                <li key={index}>{requirement}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {userBid ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1">
              <h4 className="font-semibold text-blue-800 mb-2">您已提案</h4>
              <p className="text-blue-700 text-sm mb-3">
                報價: ${userBid.amount.toLocaleString()} | 
                預估時間: {userBid.timeline} | 
                狀態: {userBid.status === 'pending' ? '等待回覆' : 
                      userBid.status === 'accepted' ? '已接受' : '已拒絕'}
              </p>
              <p className="text-blue-600 text-sm italic">
                妳已提案，如發案者有意願與你合作，將會發送訊息給您。
              </p>
            </div>
          ) : canUserBid() ? (
            <button
              onClick={() => setShowBidModal(true)}
              className="btn-primary"
            >
              提交提案
            </button>
          ) : !user ? (
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              登入以提案
            </button>
          ) : user?.role === 'client' && project.client_id === user.id ? (
            <button
              onClick={() => navigate('/my-projects')}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              查看提案
            </button>
          ) : user?.role === 'client' ? (
            <div className="text-gray-500">
              這不是您的案件
            </div>
          ) : (
            <div className="text-gray-500">
              {project.status !== 'open' ? '案件已關閉' : '您已經提案過了'}
            </div>
          )}
          
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
          >
            返回
          </button>
        </div>
      </div>

      {/* Already Bid Information Section - only show to freelancers who have bid */}
      {userBid && user?.role === 'freelancer' && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">您的提案狀態</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">提案時間：</span>
                  <span className="text-sm text-blue-900 font-medium">{formatDate(userBid.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">提案金額：</span>
                  <span className="text-sm text-blue-900 font-medium">${userBid.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">預估時間：</span>
                  <span className="text-sm text-blue-900 font-medium">{userBid.timeline}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">目前狀態：</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    userBid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    userBid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {userBid.status === 'pending' ? '等待回覆' :
                     userBid.status === 'accepted' ? '已接受' : '已拒絕'}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>提案內容：</strong> {userBid.proposal}
                </p>
              </div>
              <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  💡 您已成功提案！如發案者有意願與您合作，將會主動聯繫您。請保持關注訊息通知。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bids Section - only show to project owner */}
      {user?.role === 'client' && project.client_id === user.id && project.bids && project.bids.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">提案列表 ({project.bids.length})</h2>
          <div className="space-y-4">
            {project.bids.map(bid => (
              <div key={bid.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{bid.freelancer.name}</h3>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">${bid.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{bid.timeline}</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">{bid.proposal}</p>
                <div className="flex justify-between items-center">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bid.status === 'pending' ? '等待回覆' :
                     bid.status === 'accepted' ? '已接受' : '已拒絕'}
                  </span>
                  <button
                    onClick={() => navigate(`/messages?freelancer=${bid.freelancer_id}&project=${project.id}`)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    與接案者聊天
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">提交提案</h3>
            
            <form onSubmit={handleBidSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  報價金額 (預算範圍: ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()})
                </label>
                <input
                  type="number"
                  min={project.budget_min}
                  max={project.budget_max}
                  value={bidData.amount}
                  onChange={(e) => setBidData({...bidData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`${project.budget_min} - ${project.budget_max}`}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  預估完成時間
                </label>
                <input
                  type="text"
                  value={bidData.timeline}
                  onChange={(e) => setBidData({...bidData, timeline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：2週、1個月"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  提案內容
                </label>
                <textarea
                  value={bidData.proposal}
                  onChange={(e) => setBidData({...bidData, proposal: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="請詳細描述您的提案..."
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '提交提案'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBidModal(false);
                    setBidData({ amount: '', proposal: '', timeline: '' });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage; 