import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Projects</h3>
          <p className="text-3xl font-bold text-blue-600">3</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-green-600">$2,450</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Completed Projects</h3>
          <p className="text-3xl font-bold text-purple-600">12</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Projects</h2>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h4 className="font-semibold">E-commerce Website</h4>
              <p className="text-sm text-gray-600">Status: In Progress</p>
            </div>
            <div className="border-b pb-4">
              <h4 className="font-semibold">Mobile App Design</h4>
              <p className="text-sm text-gray-600">Status: Completed</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Messages</h2>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h4 className="font-semibold">John Doe</h4>
              <p className="text-sm text-gray-600">Thanks for the update on the project...</p>
            </div>
            <div className="border-b pb-4">
              <h4 className="font-semibold">Jane Smith</h4>
              <p className="text-sm text-gray-600">When can we schedule a call to discuss...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 