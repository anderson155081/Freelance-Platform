import React from 'react';

const ProjectsPage: React.FC = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <button className="btn-primary">
          Post a Project
        </button>
      </div>
      
      <div className="grid gap-6">
        {/* Placeholder project cards */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-2">Sample Project 1</h3>
          <p className="text-gray-600 mb-4">
            This is a sample project description. In a real implementation, 
            this would be fetched from the API.
          </p>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-green-600">$500 - $1000</span>
            <span className="text-sm text-gray-500">Posted 2 days ago</span>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-xl font-semibold mb-2">Sample Project 2</h3>
          <p className="text-gray-600 mb-4">
            Another sample project description. Projects will be loaded dynamically.
          </p>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-green-600">$1000 - $2000</span>
            <span className="text-sm text-gray-500">Posted 1 week ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage; 