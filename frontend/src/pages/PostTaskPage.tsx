import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService, CreateProjectRequest } from '../services/auth';

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

const PostTaskPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    category: '商業設計',
    location: 'Remote',
    skills: '',
    requirements: '',
    urgency: '一般'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // Redirect if user is not a client
  React.useEffect(() => {
    if (user && user.role !== 'client') {
      navigate('/projects');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '請輸入案件標題';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '請輸入案件描述';
    }
    
    if (!formData.budget_min || parseInt(formData.budget_min) <= 0) {
      newErrors.budget_min = '請輸入有效的最低預算';
    }
    
    if (!formData.budget_max || parseInt(formData.budget_max) <= 0) {
      newErrors.budget_max = '請輸入有效的最高預算';
    }
    
    if (parseInt(formData.budget_min) >= parseInt(formData.budget_max)) {
      newErrors.budget_max = '最高預算必須大於最低預算';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Convert skills and requirements to JSON arrays
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
      const requirementsArray = formData.requirements
        .split('\n')
        .map(req => req.trim())
        .filter(req => req.length > 0);
      
      const taskData: CreateProjectRequest = {
        title: formData.title,
        description: formData.description,
        budget_min: parseInt(formData.budget_min),
        budget_max: parseInt(formData.budget_max),
        category: formData.category,
        location: formData.location,
        skills: JSON.stringify(skillsArray),
        requirements: JSON.stringify(requirementsArray),
        urgency: formData.urgency
      };
      
      // Call API to create project using authService
      await authService.createProject(taskData);
      
      alert('案件發布成功！');
      navigate('/projects');
    } catch (error: any) {
      console.error('發布案件失敗:', error);
      
      let errorMessage = '發布失敗，請稍後再試';
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || '案件資料有誤';
      } else if (error.response?.status === 401) {
        errorMessage = '請先登入';
      } else if (error.response?.status >= 500) {
        errorMessage = '伺服器錯誤，請稍後再試';
      }
      
      alert(`發布失敗：${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>請先登入</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">發布新案件</h1>
        <p className="text-gray-600">填寫以下資訊來發布您的案件需求</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">基本資訊</h2>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案件標題 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                placeholder="例如：Logo 設計、網站開發、文件翻譯..."
                required
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                詳細描述 *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className={`input-field ${errors.description ? 'border-red-500' : ''}`}
                placeholder="請詳細描述您的案件需求、預期成果、時間安排等..."
                required
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Category and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  案件類別 *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field"
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
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                預算範圍 (新台幣) *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    name="budget_min"
                    value={formData.budget_min}
                    onChange={handleChange}
                    className={`input-field ${errors.budget_min ? 'border-red-500' : ''}`}
                    placeholder="最低預算"
                    min="1"
                    required
                  />
                  {errors.budget_min && <p className="text-red-500 text-sm mt-1">{errors.budget_min}</p>}
                </div>
                <div>
                  <input
                    type="number"
                    name="budget_max"
                    value={formData.budget_max}
                    onChange={handleChange}
                    className={`input-field ${errors.budget_max ? 'border-red-500' : ''}`}
                    placeholder="最高預算"
                    min="1"
                    required
                  />
                  {errors.budget_max && <p className="text-red-500 text-sm mt-1">{errors.budget_max}</p>}
                </div>
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                急迫程度
              </label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="input-field"
              >
                <option value="一般">一般</option>
                <option value="急件">急件</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">需求細節</h2>
          
          <div className="space-y-6">
            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                需要技能
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="input-field"
                placeholder="例如：Photoshop, JavaScript, 英文翻譯 (用逗號分隔)"
              />
              <p className="text-gray-500 text-sm mt-1">請用逗號分隔不同技能</p>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                應徵要求
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={4}
                className="input-field"
                placeholder="例如：&#10;具備相關工作經驗&#10;能提供作品集&#10;可配合時間討論"
              />
              <p className="text-gray-500 text-sm mt-1">每行一個要求</p>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            className={`flex-1 btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? '發布中...' : '發布案件'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostTaskPage; 