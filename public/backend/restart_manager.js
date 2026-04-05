// restart_manager.js
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const config = {
    scriptPath: 'C:\\cyywork\\html\\backend',
    scriptName: 'RactDemoAppserver.js',
    intervalHours: 1, // 重启间隔（小时）
    logFile: 'restart_log.txt'
};

const logFilePath = path.join(config.scriptPath, config.logFile);

// 日志函数
function log(message) {
    const timestamp = new Date().toLocaleString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(logFilePath, logMessage);
}

// 关闭现有进程
function killProcess() {
    return new Promise((resolve) => {
        log('正在关闭现有服务器进程...');
        
        // Windows 下通过进程名和窗口标题关闭
        exec('taskkill /F /FI "WINDOWTITLE eq RactDemoAppserver*"', (error, stdout, stderr) => {
            if (error) {
                log('没有找到运行中的进程或关闭失败');
            } else {
                log('进程已关闭');
            }
            // 等待2秒确保端口释放
            setTimeout(resolve, 2000);
        });
    });
}

// 启动进程
let currentProcess = null;

function startProcess() {
    return new Promise((resolve) => {
        log('正在启动服务器...');
        
        currentProcess = spawn('node', [config.scriptName], {
            cwd: config.scriptPath,
            shell: true,
            detached: false
        });
        
        currentProcess.stdout.on('data', (data) => {
            console.log(`[服务器输出] ${data}`);
        });
        
        currentProcess.stderr.on('data', (data) => {
            console.error(`[服务器错误] ${data}`);
        });
        
        currentProcess.on('close', (code) => {
            log(`服务器进程退出，退出码: ${code}`);
        });
        
        // 等待3秒让服务器启动
        setTimeout(() => {
            log('服务器已启动');
            resolve();
        }, 3000);
    });
}

// 重启流程
async function restart() {
    log('========== 开始重启服务器 ==========');
    await killProcess();
    await startProcess();
    log('========== 重启完成 ==========\n');
}

// 定时器
let intervalId = null;

function startScheduler() {
    const intervalMs = config.intervalHours * 60 * 60 * 1000;
    
    log(`调度器已启动，每 ${config.intervalHours} 小时重启一次`);
    
    // 立即执行一次重启
    restart();
    
    // 设置定时重启
    intervalId = setInterval(() => {
        restart();
    }, intervalMs);
}

function stopScheduler() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

// 处理退出信号
process.on('SIGINT', async () => {
    log('收到退出信号，正在关闭...');
    stopScheduler();
    if (currentProcess) {
        currentProcess.kill();
    }
    process.exit(0);
});

// 启动
startScheduler();