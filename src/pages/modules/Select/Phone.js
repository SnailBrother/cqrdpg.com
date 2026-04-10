import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { moduleConfig } from '../../../config/moduleConfig';
import styles from './Phone.module.css';
import { useAuth } from '../../../context/AuthContext';
const Phone = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState({
    date: '',
    weekday: '',
    hourMin: ''
  });
  const { user } = useAuth(); //获取用户名 
  // 生成模块数据
  const modules = Object.entries(moduleConfig).map(([key, config]) => ({
    key,
    title: config.label,
    routes: config.routes,
    defaultPath: `/app/${key}/${config.defaultRoute}`,
    emoji: getModuleEmoji(key),

  }));

  function getModuleEmoji(key) {
    const emojiMap = {
      accounting: '📊',
      music: '🎵',
      outfit: '👗',
      office: '💼',
      chat: '💬',
      travelmanager: '✈️',
      system: '⚙️',
      tool: '🛠️',
      travel: '🧳',
      sports: '🧳',
    };
    return emojiMap[key] || '📱';
  }



  // 更新当前时间（仅用于显示，指针由 updateClockPointers 控制）
  const updateCurrentTime = () => {
    const now = new Date();

    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];

    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');

    setCurrentTime({
      date: `${year}/${month}/${day}`,
      weekday,
      hourMin: `${hour}:${minute}`
    });

    updateClockPointers(now);
  };

  const updateClockPointers = (now) => {
    const hour = now.getHours() % 12;
    const minute = now.getMinutes();

    const hourAngle = (hour * 30) + (minute * 0.5);
    const minuteAngle = minute * 6;

    const hourHands = document.querySelectorAll(`.${styles.clockHour}`);
    const minuteHands = document.querySelectorAll(`.${styles.clockMinute}`);

    hourHands.forEach(hand => {
      hand.style.transform = `rotate(${hourAngle}deg)`;
    });

    minuteHands.forEach(hand => {
      hand.style.transform = `rotate(${minuteAngle}deg)`;
    });
  };

  useEffect(() => {
    updateCurrentTime();
    const intervalId = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const goToModule = (defaultPath) => navigate(defaultPath);

  return (
    <div className={styles.container}>
      {/* 顶部栏 */}
      <div className={styles.header}>
        <div className={styles.avatarcontainer}>
          <div className={styles.headerrowtavatar}>
            <img
              src="https://www.cqrdpg.com/logo192.png"
              alt="头像"
              className={styles.avatarimg}
            />
          </div>
        </div>

        <div className={styles.headercolumntwo}>


          <div className={styles.usercontainer} >
            <h2 className={styles.username}>{user.username}</h2>
            <h2 className={styles.useremail}>{user.email}</h2>
          </div>





          <div className={styles.Card}>
            <div className={styles.clockWrap}>
              <div className={styles.clockFace}>
                <div className={styles.clockHour}></div>
                <div className={styles.clockMinute}></div>
              </div>
            </div>
            <div className={styles.timeText}>
              <div className={styles.date}>{currentTime.date} {currentTime.weekday}</div>
              <div className={styles.hourMin}>{currentTime.hourMin}</div>
            </div>
          </div>

          <div className={styles.Windmill}>
            <svg className={styles.titleicon} aria-hidden="true">
              <use xlinkHref="#icon-a-fengcheertongleyuanyoulechang"></use>
            </svg>
            <svg className={styles.titleicon} aria-hidden="true">
              <use xlinkHref="#icon-fengche"></use>
            </svg>
            <svg className={styles.titleicon} aria-hidden="true">
              <use xlinkHref="#icon-a-fengcheertongleyuanyoulechang"></use>
            </svg>
            <svg className={styles.titleicon} aria-hidden="true">
              <use xlinkHref="#icon-fengche_windmill-two"></use>
            </svg>

          </div>

        </div>
      </div>

      {/* 名下作品区域 - 可滚动 */}
      <div className={styles.maincontent}>
        <div className={styles.worksCard}>


          <div className={styles.worksTitle}>

            <div>
              <svg className={styles.lubiaoicon} aria-hidden="true">
                <use xlinkHref="#icon-lubiao"></use>
              </svg>

            </div>

            <h2 className={styles.lubiaoTitle} >作品</h2>
          </div>


          <div className={styles.worksTitlecontent}>
            {modules.map((module) => (
              <div
                key={module.key}
                className={styles.moduleItem}
                onClick={() => goToModule(module.defaultPath)}
              >
                {/* 图标 */}
                <div className={styles.moduleIcon}>
                  <span className={styles.moduleEmoji}>{module.emoji}</span>
                </div>
                <div className={styles.moduleInfo}>
                  {/* 标题 */}
                  <div className={styles.moduleName}>
                    <span className={styles.moduleNametitle}>{module.title}</span>
                  </div>

                  <div className={styles.moduleTags}>
                    {module.routes.slice(0, 3).map((route) => (
                      <span
                        key={route.key}
                        className={styles.moduleTag}
                        style={{
                          backgroundColor: `${module.color}20`,
                          color: module.color,
                          borderColor: `${module.color}40`
                        }}
                      >
                        {route.label}
                      </span>
                    ))}
                    {module.routes.length > 3 && (
                      <span className={styles.moduleMoreTag}>
                        +{module.routes.length - 3}更多
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.moduleAction}>
                  <svg className={styles.moduleArrowIcon} aria-hidden="true">
                    <use xlinkHref="#icon-jiantou_xiangyouliangci"></use>
                  </svg>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phone;