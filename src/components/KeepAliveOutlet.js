import React, { useRef } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';

// Simple keep-alive outlet to preserve component state when switching routes
const KeepAliveOutlet = () => {
  const location = useLocation();
  const outletElement = useOutlet();
  const cacheRef = useRef({});

  const pathname = location.pathname;

  if (outletElement) {
    cacheRef.current[pathname] = outletElement;
  }

  return (
    <>
      {Object.entries(cacheRef.current).map(([key, element]) => (
        <div key={key} style={{ display: key === pathname ? 'block' : 'none' }}>
          {element}
        </div>
      ))}
    </>
  );
};

export default KeepAliveOutlet;


