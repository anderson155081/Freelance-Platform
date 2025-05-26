import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!email.trim()) {
      setError('請輸入電子信箱');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('請輸入有效的電子信箱地址');
      return false;
    }
    
    if (!password.trim()) {
      setError('請輸入密碼');
      return false;
    }
    
    if (password.length < 6) {
      setError('密碼長度至少需要6個字元');
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
      await login(email.trim().toLowerCase(), password);
      
      // Login successful
      console.log('登入成功');
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('登入錯誤:', err);
      
      // Handle different types of errors
      if (err.response?.status === 401) {
        setError('電子信箱或密碼錯誤');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.error || '登入資料無效');
      } else if (err.response?.status >= 500) {
        setError('伺服器錯誤，請稍後再試');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('網路錯誤，請檢查您的網路連線');
      } else {
        setError('登入失敗，請再試一次');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      // Clear error when user starts typing
      if (error) setError('');
    };

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold text-center mb-6">登入</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              電子信箱
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleInputChange(setEmail)}
              className="input-field"
              required
              disabled={loading}
              placeholder="請輸入您的電子信箱"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密碼
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handleInputChange(setPassword)}
              className="input-field"
              required
              disabled={loading}
              placeholder="請輸入您的密碼"
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
                登入中...
              </span>
            ) : (
              '登入'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-2">
            還沒有帳號？{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              點此註冊
            </Link>
          </p>
          
          {/* Optional: Add forgot password link */}
          <p className="text-sm text-gray-500">
            <Link to="/forgot-password" className="text-blue-600 hover:underline">
              忘記密碼？
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 