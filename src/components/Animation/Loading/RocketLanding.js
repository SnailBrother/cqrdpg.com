//火箭降落-加载动画
import React from 'react';
import './RocketLanding.css';

const RocketLanding = () => {
  return (
    <div className="rocketlanding-space">
      {/* 飞船部分 */}
      <div className="rocketlanding-ship">
        <div className="rocketlanding-ship-rotate">
          <div className="rocketlanding-pod"></div>
          <div className="rocketlanding-fuselage"></div>
          {/* 尾气部分 */}
          <div className="rocketlanding-exhaust-flame"></div>
          <ul className="rocketlanding-exhaust-fumes">
            {[...Array(8)].map((_, i) => (
              <li key={i}></li>
            ))}
          </ul>
        </div>
      </div>
      {/* 阴影部分 */}
      <div className="rocketlanding-ship-shadow"></div>
      {/* 星球部分 */}
      <div className="rocketlanding-mars">
        <div className="rocketlanding-tentacle"></div>
        <div className="rocketlanding-flag">
          <div className="rocketlanding-small-tentacle"></div>
        </div>
        <div className="rocketlanding-planet">
          <div className="rocketlanding-surface"></div>
          <div className="rocketlanding-crater1"></div>
          <div className="rocketlanding-crater2"></div>
          <div className="rocketlanding-crater3"></div>
        </div>
      </div>
    </div>
  );
};

export default RocketLanding;