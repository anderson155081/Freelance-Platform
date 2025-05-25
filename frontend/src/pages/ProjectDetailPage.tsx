import React from 'react';
import { useParams } from 'react-router-dom';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <div className="card mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Sample Project Title
        </h1>
        <p className="text-gray-600 mb-6">
          This is a detailed description of the project. In a real implementation,
          this would be fetched from the API using the project ID: {id}
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Budget</h3>
            <p className="text-2xl font-bold text-green-600">$1000 - $2000</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Category</h3>
            <p className="text-gray-900">Web Development</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Skills Required</h3>
            <p className="text-gray-900">React, Node.js, PostgreSQL</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Posted</h3>
            <p className="text-gray-900">2 days ago</p>
          </div>
        </div>
        
        <button className="btn-primary">
          Submit Proposal
        </button>
      </div>
      
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Proposals</h2>
        <p className="text-gray-600">
          Proposals from freelancers would be displayed here.
        </p>
      </div>
    </div>
  );
};

export default ProjectDetailPage; 