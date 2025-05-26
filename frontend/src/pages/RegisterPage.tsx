import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'freelancer' // Default to freelancer (接案者)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('請輸入姓名');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('請輸入電子信箱');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('請輸入有效的電子信箱地址');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('密碼長度至少需要6個字元');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('密碼確認不符');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const registerData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role
      };

      // First register the user
      const { authService } = await import('../services/auth');
      await authService.register(registerData);
      
      // Then log them in using the context
      await login(formData.email.trim().toLowerCase(), formData.password);
      
      // Registration successful
      console.log('註冊成功');
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('註冊錯誤:', err);
      
      // Handle different types of errors
      if (err.response?.status === 409) {
        setError('此電子信箱已被使用');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.error || '註冊資料無效');
      } else if (err.response?.status >= 500) {
        setError('伺服器錯誤，請稍後再試');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('網路錯誤，請檢查您的網路連線');
      } else {
        setError('註冊失敗，請再試一次');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold text-center mb-6">註冊</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              姓名
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              required
              disabled={loading}
              placeholder="請輸入您的姓名"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              電子信箱
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              required
              disabled={loading}
              placeholder="請輸入您的電子信箱"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              身份選擇
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-field"
              required
              disabled={loading}
            >
              <option value="freelancer">接案者 - 我想接案賺錢</option>
              <option value="client">發案者 - 我要發布案件</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              您可以之後在個人設定中修改身份
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密碼
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              required
              disabled={loading}
              placeholder="至少6個字元"
              minLength={6}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              確認密碼
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field"
              required
              disabled={loading}
              placeholder="請再次輸入密碼"
            />
          </div>
          
          <button 
            type="submit" 
            className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                建立帳號中...
              </span>
            ) : (
              '註冊'
            )}
          </button>
        </form>
        
        <p className="text-center mt-4 text-gray-600">
          已經有帳號了？{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            點此登入
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage; 