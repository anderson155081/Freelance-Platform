import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-4 rounded-lg mb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">找到完美的合作夥伴</h1>
          <p className="text-xl mb-8 opacity-90">
            無論您是尋找專業人才的企業，還是展示技能的自由工作者，我們都能為您提供完美的配對服務。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              user.role === 'client' ? (
                <Link
                  to="/post-task"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
                >
                  發布專案
                </Link>
              ) : (
                <Link
                  to="/projects"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
                >
                  瀏覽專案
                </Link>
              )
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
                >
                  立即註冊
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-300"
                >
                  登入
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">專業接案</h3>
          <p className="text-gray-600">
            連接優秀的自由工作者與需要專業服務的企業，創造雙贏的合作關係。
          </p>
        </div>

        <div className="text-center p-8 bg-white rounded-lg shadow-sm border">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">安全保障</h3>
          <p className="text-gray-600">
            完善的評價系統和交易保護機制，確保每一次合作都安全可靠。
          </p>
        </div>

        <div className="text-center p-8 bg-white rounded-lg shadow-sm border">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">快速配對</h3>
          <p className="text-gray-600">
            智能媒合系統幫助您快速找到最適合的合作夥伴，節省寶貴時間。
          </p>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-gray-50 p-8 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
            <div className="text-gray-600">活躍用戶</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
            <div className="text-gray-600">完成專案</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
            <div className="text-gray-600">專業類別</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">98%</div>
            <div className="text-gray-600">滿意度</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 