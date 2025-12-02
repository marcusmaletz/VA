import React from 'react';
import { getServicesList } from '../services/knowledgeBase';

const InfoSection: React.FC = () => {
  const services = getServicesList();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service, index) => (
        <div 
          key={index}
          className="group p-8 bg-brand-black border border-brand-gray hover:border-brand-blue transition-all duration-300"
        >
          <div className="w-8 h-1 bg-brand-blue mb-6 group-hover:w-16 transition-all duration-300"></div>
          <h3 className="text-xl font-bold text-white mb-4">
            {service.title}
          </h3>
          <p className="text-brand-muted text-sm leading-relaxed">
            {service.desc}
          </p>
        </div>
      ))}
      
      {/* Brand Card */}
      <div className="p-8 bg-brand-blue text-white flex flex-col justify-center items-center text-center">
         <h3 className="text-3xl font-black mb-2">FREUDE</h3>
         <p className="font-medium text-black/80 mb-4">ist kein Nebeneffekt.</p>
         <div className="w-12 h-1 bg-black mx-auto"></div>
         <p className="text-xs font-bold uppercase tracking-widest mt-4 text-black">Sie ist das Ziel</p>
      </div>
    </div>
  );
};

export default InfoSection;