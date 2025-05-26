import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          歡迎來到 <span className="text-blue-600">GoTask</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          台灣最專業的接案平台，連結優秀的接案者與發案者，讓專案順利完成
        </p>
        
        <div className="flex justify-center space-x-4 mb-12">
          {user ? (
            user.role === 'client' ? (
              <>
                <Link to="/post-task" className="btn-primary text-lg px-8 py-3">
                  發布新案件
                </Link>
                <Link to="/projects" className="btn-secondary text-lg px-8 py-3">
                  瀏覽案件
                </Link>
              </>
            ) : (
              <>
                <Link to="/projects" className="btn-primary text-lg px-8 py-3">
                  尋找案件
                </Link>
                <Link to="/profile" className="btn-secondary text-lg px-8 py-3">
                  完善個人檔案
                </Link>
              </>
            )
          ) : (
            <>
              <Link to="/projects" className="btn-primary text-lg px-8 py-3">
                瀏覽案件
              </Link>
              <Link to="/register" className="btn-secondary text-lg px-8 py-3">
                立即註冊
              </Link>
            </>
          )}
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="card text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">發布案件</h3>
            <p className="text-gray-600">
              詳細描述您的需求，吸引合適的接案者為您提供專業服務
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">選擇最佳人選</h3>
            <p className="text-gray-600">
              比較提案內容、評估接案者經驗，找到最適合的合作夥伴
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">高效完成</h3>
            <p className="text-gray-600">
              與接案者密切協作，確保專案品質並按時交付成果
            </p>
          </div>
        </div>

        {!user && (
          <div className="mt-16 bg-blue-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              開始您的 GoTask 之旅
            </h2>
            <p className="text-gray-600 mb-6">
              無論您是尋找專業服務的發案者，還是想要接案賺錢的專業人士，GoTask 都是您的最佳選擇
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/register" className="btn-primary">
                免費註冊
              </Link>
              <Link to="/login" className="btn-secondary">
                立即登入
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage; 