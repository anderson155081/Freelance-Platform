import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService, UpdateProfileRequest } from '../services/auth';

const SettingsPage: React.FC = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data for role switching
  const [role, setRole] = useState('freelancer');

  useEffect(() => {
    if (user) {
      setRole(user.role || 'freelancer');
    }
  }, [user]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRole(e.target.value);
    // Clear messages when user changes selection
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
        role: role,
      };

      const updatedUser = await authService.updateProfile(updateData);
      updateUser(updatedUser);
      setSuccess('帳號設定更新成功！');
      
      // Refresh user data
      await refreshUser();
    } catch (err: any) {
      console.error('Settings update error:', err);
      if (err.response?.status === 400) {
        setError(err.response.data?.error || '設定格式錯誤');
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

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <p className="text-gray-600">請先登入以查看帳號設定</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">帳號設定</h1>
          <p className="text-sm text-gray-600 mt-1">管理您的帳號偏好設定</p>
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

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Account Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">帳號資訊</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">電子信箱</label>
                    <p className="text-sm text-gray-900 mt-1">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">註冊日期</label>
                    <p className="text-sm text-gray-900 mt-1">會員</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">身份設定</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  選擇您的身份
                </label>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="role"
                      value="freelancer"
                      id="freelancer"
                      checked={role === 'freelancer'}
                      onChange={handleRoleChange}
                      className="mt-1 mr-3"
                      disabled={loading}
                    />
                    <label htmlFor="freelancer" className="text-sm">
                      <div className="font-medium text-gray-900">接案者</div>
                      <p className="text-gray-600">我想承接專案並提供服務給客戶</p>
                      <p className="text-xs text-gray-500 mt-1">
                        可以設定專業技能、時薪、作品集等資訊來吸引客戶
                      </p>
                    </label>
                  </div>
                  
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="role"
                      value="client"
                      id="client"
                      checked={role === 'client'}
                      onChange={handleRoleChange}
                      className="mt-1 mr-3"
                      disabled={loading}
                    />
                    <label htmlFor="client" className="text-sm">
                      <div className="font-medium text-gray-900">發案者</div>
                      <p className="text-gray-600">我想發布專案並尋找合適的服務提供者</p>
                      <p className="text-xs text-gray-500 mt-1">
                        可以發布專案需求、瀏覽接案者資料、進行專案管理
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">
                      目前身份：{getRoleText(user.role)}
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      您可以隨時更改身份設定。切換身份後，您會看到對應的功能選項和介面。
                    </p>
                    {role !== user.role && (
                      <p className="text-sm font-medium text-blue-800 mt-2">
                        ⚠️ 您即將切換到：{getRoleText(role)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">隱私設定</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">公開個人檔案</label>
                    <p className="text-sm text-gray-600">允許其他用戶查看您的個人檔案</p>
                  </div>
                  <div className="text-sm text-gray-500">即將推出</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">電子郵件通知</label>
                    <p className="text-sm text-gray-600">接收專案更新和訊息通知</p>
                  </div>
                  <div className="text-sm text-gray-500">即將推出</div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-red-900 mb-4">危險區域</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-red-900">刪除帳號</h4>
                    <p className="text-sm text-red-700">永久刪除您的帳號和所有相關資料</p>
                  </div>
                  <button 
                    type="button"
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    disabled
                  >
                    即將推出
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading || role === user.role}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    更新中...
                  </span>
                ) : role === user.role ? (
                  '設定已是最新'
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

export default SettingsPage; 