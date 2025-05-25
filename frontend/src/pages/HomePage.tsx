import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Find the Perfect Freelancer for Your Project
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect with talented freelancers from around the world and get your projects done efficiently.
        </p>
        
        <div className="flex justify-center space-x-4 mb-12">
          <Link to="/projects" className="btn-primary text-lg px-8 py-3">
            Browse Projects
          </Link>
          <Link to="/register" className="btn-secondary text-lg px-8 py-3">
            Join as Freelancer
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="card text-center">
            <h3 className="text-xl font-semibold mb-4">Post Your Project</h3>
            <p className="text-gray-600">
              Describe your project and get proposals from qualified freelancers.
            </p>
          </div>
          
          <div className="card text-center">
            <h3 className="text-xl font-semibold mb-4">Choose the Best</h3>
            <p className="text-gray-600">
              Review proposals, compare freelancers, and hire the perfect match.
            </p>
          </div>
          
          <div className="card text-center">
            <h3 className="text-xl font-semibold mb-4">Get Work Done</h3>
            <p className="text-gray-600">
              Collaborate with your freelancer and get your project completed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 