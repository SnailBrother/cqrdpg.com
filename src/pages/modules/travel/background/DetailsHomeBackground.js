import React, { useEffect, useRef } from 'react';
import './DetailsHomeBackground.css';

const DetailsHomeBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Fireworks logic
    const sparks = [];
    const fireworks = [];

    // Initialize fireworks
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        fireworks.push(
          new Firework(Math.random() * canvas.width, canvas.height)
        );
      }, i * 300);
    }

    // Animation loop
    let animationFrameId;
    const render = () => {
      // 完全清除画布或使用更低的透明度
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; // 增加不透明度，痕迹会更快消失
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw fireworks
      for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].move();
        fireworks[i].draw();
        if (fireworks[i].dead) {
          fireworks.splice(i, 1);
        }
      }

      // Update and draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        sparks[i].move();
        sparks[i].draw();
        if (sparks[i].dead) {
          sparks.splice(i, 1);
        }
      }

      // Randomly add new fireworks
      if (Math.random() < 0.02) {
        fireworks.push(new Firework());
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };

    // Helper classes and functions
    function Spark(x, y, color) {
      this.x = x;
      this.y = y;
      this.dir = Math.random() * (Math.PI * 2);
      this.dead = false;
      this.color = color;
      this.speed = Math.random() * 5 + 2;
      this.velocity = {
        x: Math.cos(this.dir) * this.speed,
        y: Math.sin(this.dir) * this.speed
      };
      this.gravity = 0.05;
      this.alpha = 1;
      // 修改 Spark 类中的衰减值
      this.decay = Math.random() * 0.03 + 0.02; // 增加衰减率，火花会更快消失
      this.size = Math.random() * 3 + 1;

      this.move = function () {
        this.velocity.x *= 0.99;
        this.velocity.y *= 0.99;
        this.velocity.y += this.gravity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.decay;
        if (this.alpha <= 0) this.dead = true;
      };

      this.draw = function () {
        ctx.globalAlpha = this.alpha;
        drawCircle(this.x, this.y, this.size, this.color);
        ctx.globalAlpha = 1;
      };
    }

    function Firework(x, y) {
      this.x = x || Math.random() * canvas.width;
      this.y = y || canvas.height;
      this.targetY = Math.random() * canvas.height / 2;
      this.speed = 2 + Math.random() * 2;
      this.velocity = {
        x: Math.random() * 2 - 1,
        y: -this.speed
      };
      this.dead = false;
      this.color = randomColor();
      this.size = 2;

      this.move = function () {
        if (this.y > this.targetY) {
          this.x += this.velocity.x;
          this.y += this.velocity.y;
        } else {
          this.burst();
        }
      };

      this.draw = function () {
        drawCircle(this.x, this.y, this.size, this.color);
      };

      this.burst = function () {
        this.dead = true;
        // Create more sparks for a better explosion effect
        const sparkCount = 100 + Math.floor(Math.random() * 50);
        for (let i = 0; i < sparkCount; i++) {
          sparks.push(new Spark(this.x, this.y, this.color));
        }
      };
    }

    function drawCircle(x, y, radius, color) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    function randomColor() {
      // 使用更明亮、更鲜艳的颜色
      const colors = [
        '#FF5E7D', '#FF9EB5', '#FFC0CB', '#FF85A1',
        '#FFB6C1', '#FFD1DC', '#FFA7B5', '#FF9EB5'
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  }, []);

  return (
    <div className="detailshomebackground-container">
      <canvas
        ref={canvasRef}
        className="detailshomebackground-canvas"
      ></canvas>
    </div>
  );
};

export default DetailsHomeBackground;