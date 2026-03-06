import React, { useState, useEffect, useRef } from 'react';
import './CardFlipsClock.css';

class Flipper {
  constructor(node, currentTime, nextTime) {
    this.isFlipping = false;
    this.duration = 600;
    this.flipNode = node;
    this.frontNode = node.querySelector(".cardflipsclock-front");
    this.backNode = node.querySelector(".cardflipsclock-back");
    this.setFrontTime(currentTime);
    this.setBackTime(nextTime);
  }

  setFrontTime(time) {
    this.frontNode.dataset.number = time;
  }

  setBackTime(time) {
    this.backNode.dataset.number = time;
  }

  flipDown(currentTime, nextTime) {
    if (this.isFlipping) {
      return false;
    }
    this.isFlipping = true;
    this.setFrontTime(currentTime);
    this.setBackTime(nextTime);
    this.flipNode.classList.add("cardflipsclock-running");
    setTimeout(() => {
      this.flipNode.classList.remove("cardflipsclock-running");
      this.isFlipping = false;
      this.setFrontTime(nextTime);
    }, this.duration);
  }
}

const CardFlipsClock = () => {
  const flipRefs = useRef([]);
  const [flippers, setFlippers] = useState([]);

  const getTimeFromDate = (date) => {
    return date
      .toTimeString()
      .slice(0, 8)
      .split(":")
      .join("");
  };

  useEffect(() => {
    const now = new Date();
    const nowTimeStr = getTimeFromDate(new Date(now.getTime() - 1000));
    const nextTimeStr = getTimeFromDate(now);
    
    const newFlippers = flipRefs.current.map((flip, i) => {
      return new Flipper(flip, nowTimeStr[i], nextTimeStr[i]);
    });
    setFlippers(newFlippers);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const nowTimeStr = getTimeFromDate(new Date(now.getTime() - 1000));
      const nextTimeStr = getTimeFromDate(now);
      
      flipRefs.current.forEach((flipNode, i) => {
        if (nowTimeStr[i] === nextTimeStr[i]) {
          return;
        }
        if (!flippers[i]) {
          flippers[i] = new Flipper(flipNode, nowTimeStr[i], nextTimeStr[i]);
        }
        flippers[i].flipDown(nowTimeStr[i], nextTimeStr[i]);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [flippers]);

  return (
    <div className="cardflipsclock-container">
      <div className="cardflipsclock">
        {[...Array(6)].map((_, i) => (
          <React.Fragment key={i}>
            <div 
              className="cardflipsclock-flip" 
              ref={el => flipRefs.current[i] = el}
            >
              <div className="cardflipsclock-digital cardflipsclock-front" data-number="0"></div>
              <div className="cardflipsclock-digital cardflipsclock-back" data-number="0"></div>
            </div>
            {(i === 1 || i === 3) && (
              <div className="cardflipsclock-divider">:</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CardFlipsClock;