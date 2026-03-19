import React, { useEffect, useRef } from 'react';
import './PhotoConfessionWall3D.css';

const PhotoConfessionWall3D = () => {
  const outDomRef = useRef(null);
  const spinDomRef = useRef(null);
  const spinDom2Ref = useRef(null);
  const spinDom3Ref = useRef(null);

  useEffect(() => {
    const outDom = outDomRef.current;
    const spinDom = spinDomRef.current;
    const spinDom2 = spinDom2Ref.current;
    const spinDom3 = spinDom3Ref.current;

    let radius = 560;
    // 垂直方向的间距
    const verticalSpacing = 140;
    // 列数
    const columnCount = 12;

    const aImg = spinDom.getElementsByTagName('img');
    const aImg2 = spinDom2.getElementsByTagName('img');
    const aImg3 = spinDom3.getElementsByTagName('img');

    const aEle = [...aImg];
    const aEle2 = [...aImg2];
    const aEle3 = [...aImg3];

    const setStyle = (delayTime, dom, i, len) => {
      const angle = (i * (360 / len));
      dom.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
      dom.style.transition = "transform 1s";
      dom.style.transitionDelay = delayTime || `${(len - i) / 4}s`;
    };

    const init = (delayTime) => {
      // 设置第一组照片的位置
      for (let i = 0; i < aEle.length; i++) {
        setStyle(delayTime, aEle[i], i, aEle.length);
      }
      
      // 设置第二组照片的位置（向上偏移）
      for (let i = 0; i < aEle2.length; i++) {
        const angle = (i * (360 / aEle2.length));
        aEle2[i].style.transform = `rotateY(${angle}deg) translateZ(${radius}px) translateY(${-verticalSpacing}px)`;
        aEle2[i].style.transition = "transform 1s";
        aEle2[i].style.transitionDelay = delayTime || `${(aEle2.length - i) / 4}s`;
      }
      
      // 设置第三组照片的位置（向下偏移）
      for (let i = 0; i < aEle3.length; i++) {
        const angle = (i * (360 / aEle3.length));
        aEle3[i].style.transform = `rotateY(${angle}deg) translateZ(${radius}px) translateY(${verticalSpacing}px)`;
        aEle3[i].style.transition = "transform 1s";
        aEle3[i].style.transitionDelay = delayTime || `${(aEle3.length - i) / 4}s`;
      }
    };

    // 心形动画函数
    const initHeartAnimation = () => {
      const s = [];
      
      const createHeart = (e) => {
        const heart = document.createElement("div");
        heart.className = "heart";
        s.push({
          el: heart,
          x: e.clientX - 5,
          y: e.clientY - 5,
          scale: 1,
          alpha: 1,
          color: getRandomColor()
        });
        document.body.appendChild(heart);
      };

      const getRandomColor = () => {
        return `rgb(${~~(255 * Math.random())},${~~(255 * Math.random())},${~~(255 * Math.random())})`;
      };

      const animateHearts = () => {
        for (let i = 0; i < s.length; i++) {
          if (s[i].alpha <= 0) {
            document.body.removeChild(s[i].el);
            s.splice(i, 1);
          } else {
            s[i].y--;
            s[i].scale += 0.004;
            s[i].alpha -= 0.013;
            s[i].el.style.cssText = `
              left:${s[i].x}px;
              top:${s[i].y}px;
              opacity:${s[i].alpha};
              transform:scale(${s[i].scale},${s[i].scale}) rotate(45deg);
              background:${s[i].color};
              z-index:99999
            `;
          }
        }
        requestAnimationFrame(animateHearts);
      };

      const style = document.createElement("style");
      style.type = "text/css";
      style.textContent = `
        .heart{width: 10px;height: 10px;position: fixed;background: #f00;transform: rotate(45deg);-webkit-transform: rotate(45deg);-moz-transform: rotate(45deg);}
        .heart:after,.heart:before{content: '';width: inherit;height: inherit;background: inherit;border-radius: 50%;-webkit-border-radius: 50%;-moz-border-radius: 50%;position: fixed;}
        .heart:after{top: -5px;}
        .heart:before{left: -5px;}
      `;
      document.head.appendChild(style);

      const oldClick = window.onclick;
      window.onclick = function(e) {
        oldClick && oldClick(e);
        createHeart(e);
      };

      animateHearts();
    };

    // 直接初始化3D墙和心形动画
    initHeartAnimation();
    setTimeout(() => init(), 1000);

    // 鼠标滚轮事件
    const handleWheel = (e) => {
      e = e || window.event;
      const d = e.wheelDelta / 20 || -e.detail;
      radius += d;
      init(1);
    };

    document.addEventListener('mousewheel', handleWheel);
    document.addEventListener('DOMMouseScroll', handleWheel);

    // 旋转控制
    const playSpin = (yes) => {
      spinDom.style.animationPlayState = (yes ? 'running' : 'paused');
    };

    let tX = 0, tY = 10, desX = 0, desY = 0;

    const changeRotate = (obj) => {
      if (tY > 180) tY = 180;
      if (tY < 0) tY = 0;
      obj.style.transform = `rotateX(${-tY}deg) rotateY(${tX}deg)`;
    };

    // 鼠标事件
    const handlePointerDown = (e) => {
      clearInterval(outDom.timer);
      e = e || window.event;
      let startX = e.clientX;
      let startY = e.clientY;

      const handlePointerMove = (e) => {
        playSpin(false);
        e = e || window.event;
        const endX = e.clientX;
        const endY = e.clientY;
        desX = endX - startX;
        desY = endY - startY;
        tX += desX * 0.1;
        tY += desY * 0.1;
        changeRotate(outDom);
        startX = endX;
        startY = endY;
      };

      const handlePointerUp = () => {
        outDom.timer = setInterval(() => {
          desX *= 0.95;
          desY *= 0.95;
          tX += desX * 0.1;
          tY += desY * 0.1;
          changeRotate(outDom);
          playSpin(false);
          if (Math.abs(desX) < 0.5 && Math.abs(desY) < 0.5) {
            clearInterval(outDom.timer);
            playSpin(true);
          }
        }, 16);
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('mousewheel', handleWheel);
      document.removeEventListener('DOMMouseScroll', handleWheel);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  // 图片URL
  const allImages = Array.from({ length: 12 }, (_, i) => 
    `http://121.4.22.55:80/backend/images/OurHomePage/Details/PhotoConfessionWall3D/${i + 1}.jpg`
  );

  // 重新组织图片分配，确保12列每列3张图片不重复
  const row1Images = [];
  const row2Images = [];
  const row3Images = [];

  // 生成12列，每列3张图片
  for (let i = 0; i < 12; i++) {
    // 计算每列的三张图片索引
    const img1Index = i;
    const img2Index = (i + 4) % 12;
    const img3Index = (i + 8) % 12;
    
    row1Images.push(allImages[img1Index]);
    row2Images.push(allImages[img2Index]);
    row3Images.push(allImages[img3Index]);
  }

  return (
    <div className="photoconfessionwall-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="photoconfessionwall-drag-box" ref={outDomRef}>
        <div className="photoconfessionwall-spin-box" ref={spinDomRef}>
          {row1Images.map((img, index) => (
            <img key={`spin1-${index}`} src={img} alt="" />
          ))}
        </div>
        <div className="photoconfessionwall-spin-box" id="photoconfessionwall-spin-box2" ref={spinDom2Ref}>
          {row2Images.map((img, index) => (
            <img key={`spin2-${index}`} src={img} alt="" />
          ))}
        </div>
        <div className="photoconfessionwall-spin-box" id="photoconfessionwall-spin-box3" ref={spinDom3Ref}>
          {row3Images.map((img, index) => (
            <img key={`spin3-${index}`} src={img} alt="" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhotoConfessionWall3D;    