// 游戏配置
const SCALE = 30; // 像素到米的转换比例
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRAVITY = 400; // 像素/秒²

// 游戏状态
let canvas, ctx;
let rocket = null;
let target = null;
let launcher = null;
let isLaunching = false;
let score = 0;
let launches = 0;
let trajectoryPoints = [];
let angle = 45;
let power = 60;
let lastTime = 0;
let particles = []; // 爆炸粒子数组

// 初始化
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 创建游戏元素
    createLauncher();
    createTarget();
    
    // 设置控制
    setupControls();
    
    // 开始游戏循环
    lastTime = performance.now();
    gameLoop(lastTime);
}

// 创建发射器
function createLauncher() {
    launcher = {
        x: 100,
        y: CANVAS_HEIGHT - 50,
        width: 40,
        height: 20
    };
}

// 创建目标
function createTarget() {
    const targetX = 550 + Math.random() * 150;
    const targetY = CANVAS_HEIGHT - 80;
    
    target = {
        x: targetX,
        y: targetY,
        width: 60,
        height: 60
    };
}

// 创建火箭
function createRocket(launchAngle, launchPower) {
    const angleRad = (launchAngle * Math.PI) / 180;
    const velocity = launchPower * 8;
    
    rocket = {
        x: launcher.x,
        y: launcher.y - 30,
        vx: Math.cos(angleRad) * velocity,
        vy: -Math.sin(angleRad) * velocity,
        angle: 0,
        width: 10,
        height: 30,
        hit: false
    };
    
    // 初始化角度，使火箭轴线与速度向量重合
    rocket.angle = Math.atan2(rocket.vy, rocket.vx);
    
    trajectoryPoints = [];
}

// 更新火箭物理
function updateRocket(deltaTime) {
    if (!rocket) return;
    
    // 应用重力
    rocket.vy += GRAVITY * deltaTime;
    
    // 更新位置
    rocket.x += rocket.vx * deltaTime;
    rocket.y += rocket.vy * deltaTime;
    
    // 更新角度，使火箭轴线始终与速度向量（轨迹切线）重合
    // 速度向量 (vx, vy) 的方向就是轨迹的切线方向
    rocket.angle = Math.atan2(rocket.vy, rocket.vx);
    
    // 检查碰撞
    checkCollision();
    
    // 检查是否出界
    if (rocket.y > CANVAS_HEIGHT || rocket.x > CANVAS_WIDTH || rocket.x < 0) {
        if (!rocket.hit) {
            showMessage('未命中目标，再试一次！', '#ff6b6b');
        }
        setTimeout(resetRocket, 1000);
    }
}

// 检查碰撞
function checkCollision() {
    if (!rocket || !target || rocket.hit) return;
    
    // 简单的矩形碰撞检测
    if (rocket.x > target.x - target.width/2 &&
        rocket.x < target.x + target.width/2 &&
        rocket.y > target.y - target.height/2 &&
        rocket.y < target.y + target.height/2) {
        handleHit();
    }
}

// 处理命中
function handleHit() {
    if (rocket && !rocket.hit) {
        rocket.hit = true;
        score += 100;
        updateScore();
        showMessage('🎯 命中目标！+100分', '#00ff00');
        
        // 创建爆炸特效
        createExplosion(target.x, target.y);
        
        // 创建新目标
        setTimeout(() => {
            createTarget();
        }, 1000);
    }
}

// 发射火箭
function launchRocket() {
    if (isLaunching) return;
    
    if (rocket) {
        rocket = null;
    }
    
    createRocket(angle, power);
    isLaunching = true;
    launches++;
    updateScore();
    
    document.getElementById('launchBtn').disabled = true;
}

// 重置火箭
function resetRocket() {
    rocket = null;
    isLaunching = false;
    trajectoryPoints = [];
    document.getElementById('launchBtn').disabled = false;
}

// 重置游戏
function resetGame() {
    rocket = null;
    createTarget();
    
    score = 0;
    launches = 0;
    isLaunching = false;
    trajectoryPoints = [];
    
    updateScore();
    showMessage('游戏已重置，开始新的挑战！', '#00ffff');
    document.getElementById('launchBtn').disabled = false;
}

// 更新分数显示
function updateScore() {
    document.getElementById('score').textContent = `得分: ${score} | 发射次数: ${launches}`;
}

// 显示消息
function showMessage(msg, color) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = msg;
    messageEl.style.color = color;
}

// 创建爆炸特效
function createExplosion(x, y) {
    const particleCount = 40;
    
    // 生成爆炸粒子
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const speed = 200 + Math.random() * 300;
        
        const particle = {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0, // 生命周期 0-1
            maxLife: 0.6 + Math.random() * 0.4,
            size: 4 + Math.random() * 6,
            color: ['#ff4444', '#ff6b00', '#ffaa00', '#ffff00', '#ff6666'][Math.floor(Math.random() * 5)],
            type: Math.random() > 0.7 ? 'spark' : 'smoke' // 粒子类型
        };
        
        particles.push(particle);
    }
    
    // 添加闪光效果的粒子
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 200;
        
        const particle = {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            maxLife: 0.3 + Math.random() * 0.3,
            size: 2 + Math.random() * 4,
            color: '#ffffff',
            type: 'light'
        };
        
        particles.push(particle);
    }
}

// 设置控制
function setupControls() {
    const angleSlider = document.getElementById('angleSlider');
    const angleValue = document.getElementById('angleValue');
    const powerSlider = document.getElementById('powerSlider');
    const powerValue = document.getElementById('powerValue');
    const launchBtn = document.getElementById('launchBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    angleSlider.addEventListener('input', (e) => {
        angle = parseInt(e.target.value);
        angleValue.textContent = angle + '°';
    });
    
    powerSlider.addEventListener('input', (e) => {
        power = parseInt(e.target.value);
        powerValue.textContent = power + '%';
    });
    
    launchBtn.addEventListener('click', launchRocket);
    resetBtn.addEventListener('click', resetGame);
}

// 绘制
function draw() {
    // 清空画布
    ctx.fillStyle = 'rgba(10, 22, 40, 0.3)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 绘制星星背景
    drawStars();
    
    // 绘制地面
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
    
    // 绘制发射器
    drawLauncher();
    
    // 绘制目标
    drawTarget();
    
    // 绘制轨迹
    if (trajectoryPoints.length > 1) {
        drawTrajectory();
    }
    
    // 绘制预测轨迹（未发射时）
    if (!isLaunching) {
        drawPredictedTrajectory();
    }
    
    // 绘制火箭
    if (rocket) {
        drawRocket();
    }
    
    // 绘制爆炸特效
    drawExplosion();
}

// 绘制星星
let stars = [];
function initStars() {
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT * 0.7,
            size: Math.random() * 2,
            opacity: Math.random()
        });
    }
}

function drawStars() {
    if (stars.length === 0) initStars();
    
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 绘制发射器
function drawLauncher() {
    ctx.save();
    ctx.translate(launcher.x, launcher.y);
    
    // 发射台
    ctx.fillStyle = '#555';
    ctx.fillRect(-20, -10, 40, 20);
    
    // 发射管
    ctx.rotate(-(angle * Math.PI) / 180);
    ctx.fillStyle = '#888';
    ctx.fillRect(-5, -50, 10, 50);
    
    ctx.restore();
}

// 绘制目标
function drawTarget() {
    if (!target) return;
    
    // 目标外圈
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(target.x - target.width/2, target.y - target.height/2, target.width, target.height);
    
    // 目标内圈
    ctx.fillStyle = '#ff8888';
    ctx.fillRect(target.x - 20, target.y - 20, 40, 40);
    
    // 目标中心
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(target.x, target.y, 8, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制火箭
function drawRocket() {
    if (!rocket) return;
    
    // 记录轨迹点
    if (trajectoryPoints.length === 0 || 
        Math.abs(trajectoryPoints[trajectoryPoints.length - 1].x - rocket.x) > 5 ||
        Math.abs(trajectoryPoints[trajectoryPoints.length - 1].y - rocket.y) > 5) {
        trajectoryPoints.push({ x: rocket.x, y: rocket.y });
    }
    
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    // 旋转画布，使火箭轴线与速度向量（轨迹切线）重合
    ctx.rotate(rocket.angle);
    
    const time = Date.now() / 1000;
    
    // 火箭尾焰（动态效果，从尾部喷出，绘制在最下层）
    const speed = Math.sqrt(rocket.vx * rocket.vx + rocket.vy * rocket.vy);
    if (speed > 10) {
        const flameLength = Math.min(speed / 10, 3);
        const flicker = Math.sin(time * 20) * 0.2 + 1;
        
        // 红色外焰
        ctx.fillStyle = 'rgba(255, 80, 0, 0.7)';
        ctx.beginPath();
        ctx.moveTo(-12, -7);
        ctx.lineTo(-12 - 18 * flameLength * flicker, 0);
        ctx.lineTo(-12, 7);
        ctx.closePath();
        ctx.fill();
        
        // 橙色中焰
        ctx.fillStyle = 'rgba(255, 140, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-12, -5);
        ctx.lineTo(-12 - 13 * flameLength * flicker, 0);
        ctx.lineTo(-12, 5);
        ctx.closePath();
        ctx.fill();
        
        // 黄色内焰
        ctx.fillStyle = 'rgba(255, 230, 0, 0.95)';
        ctx.beginPath();
        ctx.moveTo(-12, -3);
        ctx.lineTo(-12 - 8 * flameLength * flicker, 0);
        ctx.lineTo(-12, 3);
        ctx.closePath();
        ctx.fill();
        
        // 白色核心
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.moveTo(-12, -1.5);
        ctx.lineTo(-12 - 4 * flameLength * flicker, 0);
        ctx.lineTo(-12, 1.5);
        ctx.closePath();
        ctx.fill();
    }
    
    // 火箭主体阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // 火箭主体底层（深色）
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(-12, -7, 25, 14);
    
    // 火箭主体高光层
    const gradient = ctx.createLinearGradient(0, -7, 0, 7);
    gradient.addColorStop(0, '#ff5555');
    gradient.addColorStop(0.3, '#ff7777');
    gradient.addColorStop(0.7, '#ff4444');
    gradient.addColorStop(1, '#cc3333');
    ctx.fillStyle = gradient;
    ctx.fillRect(-12, -7, 25, 14);
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // 火箭装饰条纹
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let i = -8; i < 10; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i, -6);
        ctx.lineTo(i + 2, -6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i, 6);
        ctx.lineTo(i + 2, 6);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // 火箭窗户
    ctx.fillStyle = '#88ddff';
    ctx.beginPath();
    ctx.arc(3, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 窗户反光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(2, -1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 火箭头部（指向右侧+X方向）
    const noseGradient = ctx.createLinearGradient(10, 0, 24, 0);
    noseGradient.addColorStop(0, '#ff4444');
    noseGradient.addColorStop(0.5, '#ff6666');
    noseGradient.addColorStop(1, '#ff2222');
    ctx.fillStyle = noseGradient;
    ctx.beginPath();
    ctx.moveTo(24, 0);        // 尖端
    ctx.lineTo(13, -10);      // 左上
    ctx.lineTo(13, 10);       // 左下
    ctx.closePath();
    ctx.fill();
    
    // 头部高光
    ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(13, -10);
    ctx.lineTo(16, -5);
    ctx.closePath();
    ctx.fill();
    
    // 火箭侧翼（带渐变和光泽）
    const finGradient = ctx.createLinearGradient(-15, 0, -5, 0);
    finGradient.addColorStop(0, '#aa2222');
    finGradient.addColorStop(1, '#dd4444');
    
    ctx.fillStyle = finGradient;
    ctx.beginPath();
    ctx.moveTo(-7, -7);
    ctx.lineTo(-17, -14);
    ctx.lineTo(-17, -7);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-7, 7);
    ctx.lineTo(-17, 14);
    ctx.lineTo(-17, 7);
    ctx.closePath();
    ctx.fill();
    
    // 侧翼边框
    ctx.strokeStyle = '#880000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-7, -7);
    ctx.lineTo(-17, -14);
    ctx.lineTo(-17, -7);
    ctx.closePath();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-7, 7);
    ctx.lineTo(-17, 14);
    ctx.lineTo(-17, 7);
    ctx.closePath();
    ctx.stroke();
    
    ctx.restore();
}

// 绘制轨迹
function drawTrajectory() {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < trajectoryPoints.length; i++) {
        const point = trajectoryPoints[i];
        if (i === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    }
    
    ctx.stroke();
    
    // 绘制轨迹点
    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    trajectoryPoints.forEach((point, i) => {
        if (i % 3 === 0) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// 绘制预测轨迹
function drawPredictedTrajectory() {
    const angleRad = (angle * Math.PI) / 180;
    const velocity = power * 8;
    const vx = Math.cos(angleRad) * velocity;
    const vy = -Math.sin(angleRad) * velocity;
    
    const startX = launcher.x;
    const startY = launcher.y - 30;
    
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    
    const timeStep = 0.05;
    const numPoints = 40;
    
    for (let i = 0; i < numPoints; i++) {
        const t = i * timeStep;
        const x = startX + vx * t;
        const y = startY + vy * t + 0.5 * GRAVITY * t * t;
        
        if (y > CANVAS_HEIGHT - 20) break;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
}

// 绘制爆炸特效
function drawExplosion() {
    particles.forEach(particle => {
        ctx.save();
        
        // 根据粒子类型设置透明度
        const opacity = Math.max(0, particle.life);
        
        if (particle.type === 'spark') {
            // 火花粒子：比较亮，逐渐消退
            ctx.globalAlpha = opacity * 0.8;
            ctx.fillStyle = particle.color;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 10;
        } else if (particle.type === 'light') {
            // 光粒子：非常亮，快速消退
            ctx.globalAlpha = opacity * 0.6;
            ctx.fillStyle = particle.color;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 15;
        } else if (particle.type === 'smoke') {
            // 烟雾粒子：半透明，缓慢消退
            ctx.globalAlpha = opacity * 0.4;
            ctx.fillStyle = '#ff8844';
            ctx.shadowBlur = 0;
        }
        
        // 绘制粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

// 游戏循环
function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // 转换为秒
    lastTime = currentTime;
    
    // 更新物理
    if (rocket) {
        updateRocket(deltaTime);
    }
    
    // 更新爆炸粒子
    updateParticles(deltaTime);
    
    draw();
    
    requestAnimationFrame(gameLoop);
}

// 更新爆炸粒子
function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // 更新生命周期
        p.life -= deltaTime / p.maxLife;
        
        // 应用重力（只对某些粒子）
        if (p.type === 'smoke') {
            p.vy -= GRAVITY * 0.3 * deltaTime; // 烟雾向上漂浮
        } else {
            p.vy += GRAVITY * 0.5 * deltaTime; // 其他粒子下落较快
        }
        
        // 应用空气阻力
        const damping = 0.95;
        p.vx *= damping;
        p.vy *= damping;
        
        // 更新位置
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        
        // 移除已过期的粒子
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 启动游戏
window.addEventListener('load', init);
