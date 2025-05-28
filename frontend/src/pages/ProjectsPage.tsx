import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService, Project, ProjectFilters } from '../services/auth';
import { useNavigate } from 'react-router-dom';

const categories = [
  '全部類別',
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
  '全部地點',
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

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for projects
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部類別');
  const [selectedLocation, setSelectedLocation] = useState('全部地點');
  const [priceRange, setPriceRange] = useState([0, 200000]);

  // Load projects from API
  const loadProjects = useCallback(async () => {
    try {
      const filters: ProjectFilters = {
        search: searchTerm || undefined,
        category: selectedCategory !== '全部類別' ? selectedCategory : undefined,
        location: selectedLocation !== '全部地點' ? selectedLocation : undefined,
        min_budget: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_budget: priceRange[1] < 200000 ? priceRange[1] : undefined,
        limit: 50 // Load more projects at once
      };

      const response = await authService.getProjects(filters);
      setFilteredProjects(response.projects);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
    }
  }, [searchTerm, selectedCategory, selectedLocation, priceRange]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Reload projects when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadProjects();
    }, 500); // Debounce API calls

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, selectedLocation, priceRange, loadProjects]);

  const handleProjectClick = (project: Project) => {
    // Allow all users to navigate to project detail page
    // The ProjectDetailPage will handle role-specific logic and bidding
    navigate(`/projects/${project.id}`);
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

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">案件列表</h1>
      </div>

      {/* Role-based notification */}
      {user?.role === 'client' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="flex-shrink-0 w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                您目前是<strong>發案者</strong>身份。如果您想要接案，請前往設定頁面切換至接案者身份。
                您可以在<strong>我的案件</strong>頁面查看您發布案件的提案。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="想找什麼案件呢？"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              案件類別
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工作地點
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="input-field"
            >
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              預算範圍 (新台幣)
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="200000"
                step="5000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>NT$ 0</span>
                <span>NT$ {priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-600">
          找到 <span className="font-medium">{filteredProjects.length}</span> 個案件
        </p>
      </div>

      {/* Project Cards */}
      <div className="grid gap-6">
        {filteredProjects.map(project => {
          const userHasBid = user?.role === 'freelancer' && project.bids?.some(bid => bid.freelancer_id === user?.id);
          
          return (
            <div
              key={project.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleProjectClick(project)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                    {project.urgency === '急件' && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                        急件
                      </span>
                    )}
                    {userHasBid && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        已提案
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
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {project.client.name}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.skills && (() => {
                      try {
                        const skills = JSON.parse(project.skills);
                        return skills.slice(0, 4).map((skill: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {skill}
                          </span>
                        ));
                      } catch {
                        return [];
                      }
                    })()}
                    {project.skills && (() => {
                      try {
                        const skills = JSON.parse(project.skills);
                        return skills.length > 4 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{skills.length - 4}
                          </span>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-green-600">
                  NT$ {project.budget_min.toLocaleString()} - {project.budget_max.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">
                  {formatTimeAgo(project.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">沒有找到符合條件的案件</h3>
          <p className="mt-1 text-sm text-gray-500">請試著調整搜尋條件或篩選器</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage; 