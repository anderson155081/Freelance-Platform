import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService, UpdateProfileRequest } from '../services/auth';

const ProfilePage: React.FC = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profession: '',
    experience: '',
    portfolio: '',
    hourly_rate: 0,
    available: true,
    city: '',
    website: '',
    linkedin: '',
    github: '',
    skills: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        profession: user.profession || '',
        experience: user.experience || '',
        portfolio: user.portfolio || '',
        hourly_rate: user.hourly_rate || 0,
        available: user.available !== undefined ? user.available : true,
        city: user.city || '',
        website: user.website || '',
        linkedin: user.linkedin || '',
        github: user.github || '',
        skills: user.skills || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
    
    // Clear messages when user types
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updateData: UpdateProfileRequest = {
        ...formData,
        skills: formData.skills ? formData.skills : undefined,
      };

      const updatedUser = await authService.updateProfile(updateData);
      updateUser(updatedUser);
      setSuccess('個人檔案更新成功！');
      
      // Refresh user data
      await refreshUser();
    } catch (err: any) {
      console.error('Profile update error:', err);
      if (err.response?.status === 400) {
        setError(err.response.data?.error || '資料格式錯誤');
      } else if (err.response?.status >= 500) {
        setError('伺服器錯誤，請稍後再試');
      } else {
        setError('更新失敗，請再試一次');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleText = (role: string) => {
    return role === 'client' ? '發案者' : '接案者';
  };

  const taiwanCities = [
    '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
    '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
    '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
    '台東縣', '澎湖縣', '金門縣', '連江縣'
  ];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <p className="text-gray-600">請先登入以查看個人檔案</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">個人檔案</h1>
              <p className="text-sm text-gray-600 mt-1">
                目前身份：<span className="font-medium text-blue-600">{getRoleText(user.role)}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">基本資料</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                    disabled={loading}
                    placeholder="請輸入您的姓名"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    所在城市
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input-field"
                    disabled={loading}
                  >
                    <option value="">請選擇城市</option>
                    {taiwanCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自我介紹
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field"
                  disabled={loading}
                  placeholder="簡單介紹一下自己..."
                />
              </div>
            </div>

            {/* Professional Information (for freelancers) */}
            {user.role === 'freelancer' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">專業資料</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      專業領域
                    </label>
                    <input
                      type="text"
                      name="profession"
                      value={formData.profession}
                      onChange={handleInputChange}
                      className="input-field"
                      disabled={loading}
                      placeholder="例如：網頁設計師、程式開發"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      時薪 (新台幣)
                    </label>
                    <input
                      type="number"
                      name="hourly_rate"
                      value={formData.hourly_rate}
                      onChange={handleInputChange}
                      className="input-field"
                      disabled={loading}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    技能標籤 (用逗號分隔)
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    className="input-field"
                    disabled={loading}
                    placeholder="JavaScript, React, 設計, 翻譯"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    工作經歷
                  </label>
                  <textarea
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    rows={4}
                    className="input-field"
                    disabled={loading}
                    placeholder="描述您的相關工作經驗..."
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    作品集連結
                  </label>
                  <input
                    type="url"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleInputChange}
                    className="input-field"
                    disabled={loading}
                    placeholder="https://your-portfolio.com"
                  />
                </div>

                <div className="mt-6 flex items-center">
                  <input
                    type="checkbox"
                    name="available"
                    id="available"
                    checked={formData.available}
                    onChange={handleInputChange}
                    className="mr-2"
                    disabled={loading}
                  />
                  <label htmlFor="available" className="text-sm text-gray-700">
                    目前可接案
                  </label>
                </div>
              </div>
            )}

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">社群連結</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    個人網站
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="input-field"
                    disabled={loading}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="input-field"
                    disabled={loading}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub
                  </label>
                  <input
                    type="url"
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    className="input-field"
                    disabled={loading}
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    更新中...
                  </span>
                ) : (
                  '儲存變更'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 