import React from 'react';

const GradeBadge = ({ grade }) => {
  const normalizedGrade = grade?.toUpperCase() || 'D';
  
  return (
    <span className={`grade-badge ${normalizedGrade.toLowerCase()}`}>
      {normalizedGrade}
    </span>
  );
};

export default GradeBadge;
