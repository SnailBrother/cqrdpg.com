const express = require('express');
const cors = require('cors');
const sql = require('mssql');
 
const app = express();
const port = 4200;

// SQL Server 配置
const config = {
    user: 'sa',
    password: 'Alan944926',
    server: '111.231.79.183',
    database: 'reactDemoApp',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        pool: {
            max: 100,
            min: 0,
            idleTimeoutMillis: 30000
        }
    }
};

// 使用全局连接池
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();
poolConnect.then(() => {
    console.log('Connected to SQL Server');
}).catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
});

// 实时接受消息 socket.io
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// 下载
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

// 图片上传
const multer = require("multer");

app.use(cors());
app.use(express.json());

// 根路径处理
app.get('/', (req, res) => {
    res.send('API is running...');
});

// 登录接口
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    console.log('登录请求:', { email, password });
    
    try {
        await poolConnect;
        
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM reactDemoApp.dbo.userAccounts WHERE email = @email');
        
        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const user = result.recordset[0];
        
        if (user.is_locked) {
            return res.status(401).json({
                success: false,
                message: '账户已被锁定，请联系管理员'
            });
        }
        
        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: '密码错误'
            });
        }
        
        await pool.request()
            .input('id', sql.Int, user.id)
            .query('UPDATE reactDemoApp.dbo.userAccounts SET last_login_time = GETDATE() WHERE id = @id');
        
        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            registration_date: user.registration_date,
            last_login_time: user.last_login_time,
            profile_picture: user.profile_picture,
            permission_level: user.permission_level,
            is_locked: user.is_locked,
            notes: user.notes
        };
        
        res.json({
            success: true,
            user: userResponse,
            token: `jwt-token-${user.id}-${Date.now()}`
        });
        
    } catch (err) {
        console.error('登录错误:', err);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 注册接口
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;  
    
    console.log('注册请求:', { username, email, password });
    
    try {
        await poolConnect;
        
        const existingUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id FROM reactDemoApp.dbo.userAccounts WHERE email = @email');
        
        if (existingUser.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该邮箱已被注册'
            });
        }
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const userResult = await transaction.request()
                .input('username', sql.NVarChar, username)  
                .input('email', sql.NVarChar, email)
                .input('password', sql.NVarChar, password)
                .query(`
                    INSERT INTO reactDemoApp.dbo.userAccounts 
                    (username, email, password, permission_level) 
                    OUTPUT INSERTED.* 
                    VALUES (@username, @email, @password, 'user')
                `);
            
            const newUser = userResult.recordset[0];
            
            // 为用户创建默认主题设置
            await transaction.request()
                .input('username', sql.NVarChar, username)
                .input('email', sql.NVarChar, email)
                .input('theme_name', sql.NVarChar, '默认主题')
                .input('background_color', sql.NVarChar, '#FFFFFFFF')
                .input('secondary_background_color', sql.NVarChar, '#F8F9FAFF')
                .input('hover_background_color', sql.NVarChar, '#E9ECEEFF')
                .input('focus_background_color', sql.NVarChar, '#DEE2E6FF')
                .input('font_color', sql.NVarChar, '#000000FF')
                .input('secondary_font_color', sql.NVarChar, '#6C757DFF')
                .input('hover_font_color', sql.NVarChar, '#0078D4FF')
                .input('focus_font_color', sql.NVarChar, '#0056B3FF')
                .input('watermark_font_color', sql.NVarChar, '#B3B5B6FF')
                .input('font_family', sql.NVarChar, 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif')
                .input('border_color', sql.NVarChar, '#DEE2E6FF')
                .input('secondary_border_color', sql.NVarChar, '#E9ECEEFF')
                .input('hover_border_color', sql.NVarChar, '#0078D4FF')
                .input('focus_border_color', sql.NVarChar, '#0056B3FF')
                .input('shadow_color', sql.NVarChar, '#00000019')
                .input('hover_shadow_color', sql.NVarChar, '#00000026')
                .input('focus_shadow_color', sql.NVarChar, '#0078D440')
                .query(`
                    INSERT INTO reactDemoApp.dbo.UserThemeSettings 
                    (
                        username, email, theme_name,
                        background_color, secondary_background_color, hover_background_color, focus_background_color,
                        font_color, secondary_font_color, hover_font_color, focus_font_color, watermark_font_color, font_family,
                        border_color, secondary_border_color, hover_border_color, focus_border_color,
                        shadow_color, hover_shadow_color, focus_shadow_color, is_active
                    ) 
                    VALUES (
                        @username, @email, @theme_name,
                        @background_color, @secondary_background_color, @hover_background_color, @focus_background_color,
                        @font_color, @secondary_font_color, @hover_font_color, @focus_font_color, @watermark_font_color, @font_family,
                        @border_color, @secondary_border_color, @hover_border_color, @focus_border_color,
                        @shadow_color, @hover_shadow_color, @focus_shadow_color, 1
                    )
                `);
            
            await transaction.commit();
            
            console.log(`用户 ${username} 注册成功，并创建了默认主题`);
            
            const userResponse = {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                registration_date: newUser.registration_date,
                permission_level: newUser.permission_level
            };
            
            res.json({
                success: true,
                message: '注册成功',
                user: userResponse
            });
            
        } catch (error) {
            await transaction.rollback();
            console.error('注册事务错误:', error);
            throw error;
        }
        
    } catch (err) {
        console.error('注册错误:', err);
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试'
        });
    }
});

// 获取用户列表接口
app.get('/api/getUserAccounts', async (req, res) => {
    try {
        await poolConnect;
        
        let accountLoginResult = await pool.request().query('SELECT * FROM reactDemoApp.dbo.userAccounts');
        res.json({ AccountLogin: accountLoginResult.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 获取用户信息接口
app.get('/api/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未授权'
            });
        }
        
        const userId = token.split('-')[2];
        
        await poolConnect;
        
        const result = await pool.request()
            .input('id', sql.Int, userId)
            .query('SELECT id, username, email, registration_date, last_login_time, profile_picture, permission_level, is_locked, notes FROM reactDemoApp.dbo.userAccounts WHERE id = @id');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.json({
            success: true,
            user: result.recordset[0]
        });
        
    } catch (err) {
        console.error('获取用户信息错误:', err);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// ==================== 主题设置相关API ====================

// 1. 获取用户的活动主题（修正版）
app.get('/api/UserThemeSettings/active', async (req, res) => {
    const { email } = req.query;
    
    console.log('获取活动主题请求:', { email });
    
    // 验证必需参数
    if (!email) {
        return res.status(400).json({
            success: false,
            message: '邮箱和用户名均为必需参数'
        });
    }
    
    try {
        await poolConnect;
        
        const query = `
            SELECT * FROM reactDemoApp.dbo.UserThemeSettings 
            WHERE is_active = 1 
            AND email = @email 
            
        `;
        
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
           
            .query(query);
        
        if (result.recordset.length === 0) {
            return res.json({
                success: true,
                theme: null,
                message: '未找到当前用户的活动主题'
            });
        }
        
        res.json({
            success: true,
            theme: result.recordset[0]
        });
        
    } catch (err) {
        console.error('获取活动主题错误:', err);
        res.status(500).json({
            success: false,
            message: '获取活动主题失败'
        });
    }
});

// 2. 设置活动主题（也需要相应调整查询条件）
app.put('/api/UserThemeSettings/setActive/:id', async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    
    console.log('设置活动主题请求:', { id, email });
    
    // 验证必需参数
    if (!email) {
        return res.status(400).json({
            success: false,
            message: '邮箱均为必需参数'
        });
    }
    
    try {
        await poolConnect;
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            // 第一步：停用该用户的所有主题（严格匹配邮箱和用户名）
            await transaction.request()
                .input('email', sql.NVarChar, email)
                
                .query(`
                    UPDATE reactDemoApp.dbo.UserThemeSettings 
                    SET is_active = 0 
                    WHERE email = @email
                `);
            
            // 第二步：激活指定的主题（同时验证主题属于该用户）
            const result = await transaction.request()
                .input('id', sql.Int, id)
                .input('email', sql.NVarChar, email)
                
                .query(`
                    UPDATE reactDemoApp.dbo.UserThemeSettings 
                    SET is_active = 1 
                    WHERE id = @id 
                    AND email = @email 
                  
                    
                    SELECT * FROM reactDemoApp.dbo.UserThemeSettings 
                    WHERE id = @id
                `);
            
            if (result.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: '主题不存在或不属于当前用户'
                });
            }
            
            await transaction.commit();
            
            res.json({
                success: true,
                theme: result.recordset[0],
                message: '主题设置成功'
            });
            
        } catch (error) {
            await transaction.rollback();
            console.error('设置活动主题事务错误:', error);
            throw error;
        }
        
    } catch (err) {
        console.error('设置活动主题错误:', err);
        res.status(500).json({
            success: false,
            message: '设置活动主题失败'
        });
    }
});

// 3. 获取用户的所有主题（包括非活动主题）
app.get('/api/UserThemeSettings', async (req, res) => {
    const { email } = req.query;
    
    console.log('获取用户所有主题请求:', { email });
    
    try {
        await poolConnect;
        
        let query = `
            SELECT * FROM reactDemoApp.dbo.UserThemeSettings 
            WHERE 1=1
        `;
        const request = pool.request();
        
        if (email) {
            query += ' AND email = @email';
            request.input('email', sql.NVarChar, email);
        }
        
        
        query += ' ORDER BY is_active DESC, theme_name ASC';
        
        const result = await request.query(query);
        
        res.json({
            success: true,
            themes: result.recordset,
            count: result.recordset.length
        });
        
    } catch (err) {
        console.error('获取用户所有主题错误:', err);
        res.status(500).json({
            success: false,
            message: '获取主题列表失败'
        });
    }
});

// 4. 创建新主题
app.post('/api/UserThemeSettings', async (req, res) => {
    const {
        
        email,
        theme_name = '新主题',
        background_color = '#FFFFFFFF',
        secondary_background_color = '#F8F9FAFF',
        hover_background_color = '#E9ECEEFF',
        focus_background_color = '#DEE2E6FF',
        font_color = '#000000FF',
        secondary_font_color = '#6C757DFF',
        hover_font_color = '#0078D4FF',
        focus_font_color = '#0056B3FF',
        watermark_font_color = '#B3B5B6FF',
        font_family = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        border_color = '#DEE2E6FF',
        secondary_border_color = '#E9ECEEFF',
        hover_border_color = '#0078D4FF',
        focus_border_color = '#0056B3FF',
        shadow_color = '#00000019',
        hover_shadow_color = '#00000026',
        focus_shadow_color = '#0078D440',
        is_active = false // 默认不激活新主题
    } = req.body;
    
    console.log('创建主题请求:', { email, theme_name, is_active });
    
    try {
        await poolConnect;
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            // 如果设置为活动主题，先停用其他主题
            if (is_active) {
                await transaction.request()
                    .input('email', sql.NVarChar, email)
                   
                    .query(`
                        UPDATE reactDemoApp.dbo.UserThemeSettings 
                        SET is_active = 0 
                        WHERE email = @email
                    `);
            }
            
            // 插入新主题
            const result = await transaction.request()
                
                .input('email', sql.NVarChar, email)
                .input('theme_name', sql.NVarChar, theme_name)
                .input('background_color', sql.NVarChar, background_color)
                .input('secondary_background_color', sql.NVarChar, secondary_background_color)
                .input('hover_background_color', sql.NVarChar, hover_background_color)
                .input('focus_background_color', sql.NVarChar, focus_background_color)
                .input('font_color', sql.NVarChar, font_color)
                .input('secondary_font_color', sql.NVarChar, secondary_font_color)
                .input('hover_font_color', sql.NVarChar, hover_font_color)
                .input('focus_font_color', sql.NVarChar, focus_font_color)
                .input('watermark_font_color', sql.NVarChar, watermark_font_color)
                .input('font_family', sql.NVarChar, font_family)
                .input('border_color', sql.NVarChar, border_color)
                .input('secondary_border_color', sql.NVarChar, secondary_border_color)
                .input('hover_border_color', sql.NVarChar, hover_border_color)
                .input('focus_border_color', sql.NVarChar, focus_border_color)
                .input('shadow_color', sql.NVarChar, shadow_color)
                .input('hover_shadow_color', sql.NVarChar, hover_shadow_color)
                .input('focus_shadow_color', sql.NVarChar, focus_shadow_color)
                .input('is_active', sql.Bit, is_active)
                .query(`
                    INSERT INTO reactDemoApp.dbo.UserThemeSettings 
                    (
                        email, theme_name,
                        background_color, secondary_background_color, hover_background_color, focus_background_color,
                        font_color, secondary_font_color, hover_font_color, focus_font_color, watermark_font_color, font_family,
                        border_color, secondary_border_color, hover_border_color, focus_border_color,
                        shadow_color, hover_shadow_color, focus_shadow_color, is_active
                    ) 
                    OUTPUT INSERTED.* 
                    VALUES (
                        @email, @theme_name,
                        @background_color, @secondary_background_color, @hover_background_color, @focus_background_color,
                        @font_color, @secondary_font_color, @hover_font_color, @focus_font_color, @watermark_font_color, @font_family,
                        @border_color, @secondary_border_color, @hover_border_color, @focus_border_color,
                        @shadow_color, @hover_shadow_color, @focus_shadow_color, @is_active
                    )
                `);
            
            await transaction.commit();
            
            res.json({
                success: true,
                theme: result.recordset[0],
                message: '主题创建成功'
            });
            
        } catch (error) {
            await transaction.rollback();
            console.error('创建主题事务错误:', error);
            throw error;
        }
        
    } catch (err) {
        console.error('创建主题错误:', err);
        res.status(500).json({
            success: false,
            message: '创建主题失败'
        });
    }
});

// 5. 更新主题内容
app.put('/api/UserThemeSettings/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('更新主题请求:', { id, updates });
    
    try {
        await poolConnect;
        
        let setClause = [];
        const request = pool.request();
        request.input('id', sql.Int, id);
        
        Object.keys(updates).forEach(key => {
            // 允许更新 theme_name，移除对 theme_name 的限制
            if (key !== 'id' && key !== 'email') {
              setClause.push(`${key} = @${key}`);
              // 根据字段类型处理
              if (key === 'is_active') {
                request.input(key, sql.Bit, updates[key]);
              } else {
                request.input(key, sql.NVarChar, updates[key]);
              }
            }
          });
        
        if (setClause.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有提供有效的更新字段'
            });
        }
        
        const query = `
            UPDATE reactDemoApp.dbo.UserThemeSettings 
            SET ${setClause.join(', ')}
            WHERE id = @id
            
            SELECT * FROM reactDemoApp.dbo.UserThemeSettings 
            WHERE id = @id
        `;
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: '主题不存在'
            });
        }
        
        res.json({
            success: true,
            theme: result.recordset[0],
            message: '主题更新成功'
        });
        
    } catch (err) {
        console.error('更新主题错误:', err);
        res.status(500).json({
            success: false,
            message: '更新主题失败'
        });
    }
});

// 6. 删除主题
app.delete('/api/UserThemeSettings/:id', async (req, res) => {
    const { id } = req.params;
    
    console.log('删除主题请求:', { id });
    
    try {
        await poolConnect;
        
        // 先检查主题是否存在
        const themeCheck = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM reactDemoApp.dbo.UserThemeSettings WHERE id = @id');
        
        if (themeCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: '主题不存在'
            });
        }
        
        const theme = themeCheck.recordset[0];
        const isActive = theme.is_active;
        
        // 删除主题
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM reactDemoApp.dbo.UserThemeSettings WHERE id = @id');
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: '主题删除失败'
            });
        }
        
        // 如果删除的是活动主题，需要设置另一个主题为活动主题
        if (isActive) {
            const newActiveTheme = await pool.request()
                .input('email', sql.NVarChar, theme.email)
                
                .query(`
                    SELECT TOP 1 * FROM reactDemoApp.dbo.UserThemeSettings 
                    WHERE email = @email
                    ORDER BY id DESC
                `);
            
            if (newActiveTheme.recordset.length > 0) {
                await pool.request()
                    .input('id', sql.Int, newActiveTheme.recordset[0].id)
                    .query('UPDATE reactDemoApp.dbo.UserThemeSettings SET is_active = 1 WHERE id = @id');
            }
        }
        
        res.json({
            success: true,
            message: '主题删除成功'
        });
        
    } catch (err) {
        console.error('删除主题错误:', err);
        res.status(500).json({
            success: false,
            message: '删除主题失败'
        });
    }
});

// 7. 获取用户的主题数量统计
app.get('/api/UserThemeSettings/stats', async (req, res) => {
    const { email } = req.query;
    
    try {
        await poolConnect;
        
        let query = `
            SELECT 
                COUNT(*) as total_themes,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_themes
            FROM reactDemoApp.dbo.UserThemeSettings 
            WHERE 1=1
        `;
        const request = pool.request();
        
        if (email) {
            query += ' AND email = @email';
            request.input('email', sql.NVarChar, email);
        }
       
        
        const result = await request.query(query);
        
        res.json({
            success: true,
            stats: result.recordset[0]
        });
        
    } catch (err) {
        console.error('获取主题统计错误:', err);
        res.status(500).json({
            success: false,
            message: '获取主题统计失败'
        });
    }
});

// Socket.io 连接处理
io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('用户断开连接:', socket.id);
    });
});

// 启动服务器
http.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('正在关闭服务器...');
    await pool.close();
    process.exit(0);
});