//App.js

import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { MusicProvider } from './context/MusicContext';
import { ShareExcelWordDataProvider } from './context/ShareExcelWordData';
//import ThemeInitializer from './context/ThemeInitializer'; // 导入
import { MessageProvider } from './components/UI/Message';
import AppRoutes from './routes';
import './assets/styles/variables.css';
import styles from './App.module.css';
import { TravelThemeProvider } from './pages/modules/travel/ThemeContext';  
import { AccountingProvider } from './pages/modules/accounting/AccountingDataContext/AccountingContext';//记账配置
import { WebsiteMonitorProvider } from './context/WebsiteMonitorContext'; //访问监控

function App() {
  useEffect(() => {
    // 检查阿里图标是否已加载
    const checkIconFontLoaded = () => {
      if (window.iconfont) {
      //  console.log('阿里图标已加载');
      } else {
        // 如果未加载，重新加载图标JS
        const script = document.createElement('script');
        script.src = '/icons/iconfont.js';
        script.onload = () => {
         // console.log('阿里图标重新加载成功');
        };
        document.body.appendChild(script);
      }
    };

    // 延迟检查，确保DOM已加载
    setTimeout(checkIconFontLoaded, 100);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ShareExcelWordDataProvider>
            <TravelThemeProvider>
              <MusicProvider>
                <MessageProvider>
                  <AccountingProvider>
                    <WebsiteMonitorProvider>
                       {/* <ThemeInitializer>   */}
                    <div className={styles.app}>
                      <AppRoutes />
                    </div>
                      {/* </ThemeInitializer> */}
                    </WebsiteMonitorProvider>
                  </AccountingProvider>
                </MessageProvider>
              </MusicProvider>
            </TravelThemeProvider>
          </ShareExcelWordDataProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;