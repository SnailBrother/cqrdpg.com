//路飞出海
import React, { useState, useEffect } from 'react';
import './NauticalBackground.css';

const NauticalBackground = () => {
  const [waves, setWaves] = useState({
    bodyWaves: Array(50).fill(null),
    leftOarWaves: Array(20).fill(null),
    rightOarWaves: Array(20).fill(null)
  });

  // Generate random numbers for wave positions
  const randomNum = (min, max) => {
    return (Math.random() * (max - min + 1) + min).toFixed(2);
  };

  return (
    <div className="nauticalbackground-app">
      {/* Sea */}
      <div className="nauticalbackground-sea">
        <div className="nauticalbackground-surface"></div>
      </div>
      
      {/* Ship */}
      <div className="nauticalbackground-ship">
        <div className="nauticalbackground-rotate">
          <div className="nauticalbackground-move">
            <div className="nauticalbackground-body">
              <div className="nauticalbackground-waves">
                {/* Body waves */}
                <div className="nauticalbackground-bodywaves">
                  {waves.bodyWaves.map((_, i) => (
                    <div 
                      key={`body-${i}`} 
                      className="nauticalbackground-wave"
                      style={{
                        '--left': `${randomNum(12, 60)}px`,
                        '--top': `${randomNum(-2, 16)}px`,
                        '--delay': `${randomNum(30, 4000)}ms`
                      }}
                    >
                      <div 
                        className="nauticalbackground-graphic" 
                        style={{
                          '--width': `${randomNum(9, 18)}px`,
                          '--height': `${randomNum(9, 18)}px`
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
                
                {/* Left oar waves */}
                <div className="nauticalbackground-oarwaves nauticalbackground-left">
                  {waves.leftOarWaves.map((_, i) => (
                    <div 
                      key={`left-${i}`} 
                      className="nauticalbackground-wave"
                      style={{
                        '--left': `${randomNum(40, 50)}px`,
                        '--top': `${randomNum(-30, -15)}px`,
                        '--delay': `${randomNum(1000, 1800)}ms`
                      }}
                    >
                      <div 
                        className="nauticalbackground-graphic" 
                        style={{
                          '--width': `${randomNum(6, 10)}px`,
                          '--height': `${randomNum(6, 10)}px`
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
                
                {/* Right oar waves */}
                <div className="nauticalbackground-oarwaves nauticalbackground-right">
                  {waves.rightOarWaves.map((_, i) => (
                    <div 
                      key={`right-${i}`} 
                      className="nauticalbackground-wave"
                      style={{
                        '--left': `${randomNum(40, 50)}px`,
                        '--top': `${randomNum(40, 55)}px`,
                        '--delay': `${randomNum(1000, 1800)}ms`
                      }}
                    >
                      <div 
                        className="nauticalbackground-graphic" 
                        style={{
                          '--width': `${randomNum(6, 10)}px`,
                          '--height': `${randomNum(6, 10)}px`
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Ship body */}
              <div className="nauticalbackground-base"></div>
              <div className="nauticalbackground-board nauticalbackground-front"></div>
              <div className="nauticalbackground-board nauticalbackground-back"></div>
            </div>
            
            {/* Oars */}
            <div className="nauticalbackground-oars">
              <div className="nauticalbackground-oar nauticalbackground-left">
                <div className="nauticalbackground-row nauticalbackground-left">
                  <div className="nauticalbackground-depth nauticalbackground-left">
                    <div className="nauticalbackground-graphic nauticalbackground-left"></div>
                  </div>
                </div>
              </div>
              <div className="nauticalbackground-oar nauticalbackground-right">
                <div className="nauticalbackground-row nauticalbackground-right">
                  <div className="nauticalbackground-depth nauticalbackground-right">
                    <div className="nauticalbackground-graphic nauticalbackground-right"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Luffy */}
            <div className="nauticalbackground-human">
              <div className="nauticalbackground-legs">
                <div className="nauticalbackground-leg nauticalbackground-left"></div>
                <div className="nauticalbackground-leg nauticalbackground-right"></div>
              </div>
              <div className="nauticalbackground-hat"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NauticalBackground;