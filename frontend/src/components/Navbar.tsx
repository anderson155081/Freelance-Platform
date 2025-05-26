import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowDropdown(false);
  };

  const getRoleText = (role: string) => {
    return role === 'client' ? '發案者' : '接案者';
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            GoTask
          </Link>
          
          <div className="hidden md:flex space-x-6">
            {user ? (
              <>
                {user.role === 'client' ? (
                  <>
                    <Link to="/post-task" className="text-gray-700 hover:text-blue-600">
                      發布案件
                    </Link>
                    <Link to="/my-projects" className="text-gray-700 hover:text-blue-600">
                      我的案件
                    </Link>
                  </>
                ) : (
                  <Link to="/projects" className="text-gray-700 hover:text-blue-600">
                    案件列表
                  </Link>
                )}
                <Link to="/messages" className="text-gray-700 hover:text-blue-600">
                  訊息
                </Link>
              </>
            ) : (
              <Link to="/projects" className="text-gray-700 hover:text-blue-600">
                案件列表
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none"
                >
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                  <span className="text-sm text-gray-500">({getRoleText(user.role)})</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      個人設定
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      個人檔案
                    </Link>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      登出
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  登入
                </Link>
                <Link to="/register" className="btn-primary">
                  註冊
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 