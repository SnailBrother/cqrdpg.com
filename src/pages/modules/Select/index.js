import React, { useState, useEffect } from 'react';
import Computer from './Computer'; 
import Phone from './Phone'; 
import styles from './ResponsiveLayout.module.css';

//import Codesettings from './pages/QrcodeManagementSettings';
import Codesettings from '../../cqrdpg/pages/RdSetting';

const ResponsiveLayout = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div className={styles.mobileView}>
         <Phone />
       
      </div>
    );
  }

  return (
    <div className={styles.desktopView}>
       <Codesettings />
     
    </div>
  );
};

export default ResponsiveLayout;