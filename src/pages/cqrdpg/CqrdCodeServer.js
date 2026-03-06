const express = require('express');
const sql = require('mssql');
const http = require('http');
const cors = require('cors'); // 建议安装: npm install cors
const socketIo = require('socket.io');

const app = express();
const port = 5203;

// 中间件配置
app.use(cors()); // 允许跨域
app.use(express.json()); // 解析 JSON 请求体 (非常重要，否则 req.body 为 undefined)

// SQL Server 配置
const config = {
    user: 'sa',
    password: 'Alan944926',// ⚠️ 建议移至 .env 文件
    server: '121.4.22.55',
    database: 'RdpgCode', // 注意：你之前代码里有的地方写 BillingApp，有的写 RdpgCode，请确认数据库名
    port: 1433, // 显式指定端口
    options: {
        encrypt: false, // 如果是本地或非SSL环境设为 false
        trustServerCertificate: true, // 自签名证书必须设为 true
        enableArithAbort: true // 推荐设置，避免某些计算错误
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};


// 创建全局连接池单例
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

// 监听连接事件
poolConnect.then(() => {
    console.log('✅ 成功连接到 SQL Server (RdpgCode)');
}).catch(err => {
    console.error('❌ 数据库连接失败:', err);
    console.error('请检查：1. 服务器防火墙/安全组是否开放 1433 端口; 2. SQL Server 是否启用 TCP/IP; 3. 账号密码是否正确');
    // 不要 process.exit(1)，让服务器继续运行，也许稍后网络恢复能连上，或者至少能响应健康检查
});

// 初始化 HTTP 服务器和 Socket.io
const server = http.createServer(app);  // 这一行是缺失的！
const io = require('socket.io')(server, { 
    cors: {
        origin: '*', // 生产环境建议换成具体域名
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    },
    // 建议添加以下配置以保持连接稳定
    pingTimeout: 60000,
    pingInterval: 25000
});


// --- Socket.io 逻辑 ---
io.on('connection', (socket) => {
    console.log('🔌 客户端连接成功:', socket.id);

    // 当管理页面加载时，可以主动请求一次最新数据（可选）
    socket.on('request_latest_messages', async () => {
        try {
            await poolConnect;
            const result = await pool.request()
                .query('SELECT TOP 50 * FROM RdpgCode.dbo.CqrdpgBusiness ORDER BY submitted DESC');

            socket.emit('initial_messages', result.recordset);
        } catch (err) {
            console.error('获取初始消息失败:', err);
            socket.emit('error', '获取消息失败');
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 客户端断开连接:', socket.id);
    });
});



// 辅助函数：获取已连接的池
async function getPool() {
    try {
        await poolConnect; // 确保连接已完成
        return pool;
    } catch (err) {
        console.error("获取连接池失败:", err);
        throw err;
    }
}

// --- API 路由 ---

// ... (前面的 require 和 config 代码保持不变)

// --- 新增：混淆码映射逻辑工具函数 ---
async function generateSafeCodeFromId(originalId, pool) {
    const idStr = originalId.toString();
    const parts = [];

    // 遍历 ID 的每一位数字
    for (let char of idStr) {
        const digit = parseInt(char, 10);

        // 查询映射表
        const request = pool.request();
        const result = await request
            .input('val', sql.Int, digit)
            .query(`SELECT DecodedText FROM RdpgCode.dbo.CqrdpgCodepageDecodeMapping WHERE OriginalValue = @val`);

        if (result.recordset.length === 0) {
            throw new Error(`映射表缺少数字 ${digit} 的配置`);
        }
        parts.push(result.recordset[0].DecodedText);
    }

    // 用 & 连接
    return parts.join('&');
}

// 新增：反向解析工具函数 (将混淆码解析回 ID)
async function getIdFromSafeCode(safeCode, pool) {
    if (!safeCode) return null;

    const parts = safeCode.split('&');
    let originalIdStr = '';

    const requestTemplate = pool.request();

    for (let part of parts) {
        const result = await requestTemplate
            .input('text', sql.NVarChar, part)
            .query(`SELECT OriginalValue FROM RdpgCode.dbo.CqrdpgCodepageDecodeMapping WHERE DecodedText = @text`);

        if (result.recordset.length === 0) {
            return null; // 无效的混淆码
        }
        originalIdStr += result.recordset[0].OriginalValue.toString();
    }

    return parseInt(originalIdStr, 10);
}

// --- 修改后的 API 路由 ---

// 1. 查询列表 (增加 safeCode 字段)
app.get('/api/CodeDatabase/List', async (req, res) => {
    try {
        const pool = await getPool();
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const keyword = req.query.keyword || '';
        const offset = (page - 1) * pageSize;

        const request = pool.request();
        request.input('keyword', sql.NVarChar, `%${keyword}%`);
        request.input('offset', sql.Int, offset);
        request.input('pageSize', sql.Int, pageSize);

        const query = `
            SELECT * FROM dbo.CodeDatabase 
            WHERE ProjectName LIKE @keyword OR ReportNumber LIKE @keyword
            ORDER BY Id DESC
            OFFSET @offset ROWS
            FETCH NEXT @pageSize ROWS ONLY
        `;

        const countQuery = `
            SELECT COUNT(*) as total FROM dbo.CodeDatabase 
            WHERE ProjectName LIKE @keyword OR ReportNumber LIKE @keyword
        `;

        const [result, countResult] = await Promise.all([
            request.query(query),
            pool.request().input('keyword', sql.NVarChar, `%${keyword}%`).query(countQuery)
        ]);

        // 【关键修改】为每一条数据生成 safeCode
        const enrichedData = await Promise.all(result.recordset.map(async (row) => {
            const safeCode = await generateSafeCodeFromId(row.Id, pool);
            return { ...row, safeCode };
        }));

        res.json({
            data: enrichedData,
            total: countResult.recordset[0].total,
            page,
            pageSize
        });

    } catch (err) {
        console.error('查询错误:', err);
        res.status(500).json({ error: '查询失败', details: err.message });
    }
});

// 2. 新增 (保持不变，但为了严谨，这里略过，逻辑同原代码)
app.post('/api/CodeDatabase/Add', async (req, res) => {
    // ... (保持你原有的添加逻辑不变) ...
    // 注意：添加成功后，前端如果需要立即跳转，需要重新获取该条数据的 safeCode
    try {
        const pool = await getPool();
        const { ProjectName, EvaluationAmount, ReportTime, ReportNumber, SignerA_Name, SignerA_Number, SignerB_Name, SignerB_Number } = req.body;

        if (!ProjectName || !ReportNumber) {
            return res.status(400).json({ error: '项目名称和报告号为必填项' });
        }

        const request = pool.request();
        request.input('ProjectName', sql.NVarChar, ProjectName);
        request.input('EvaluationAmount', sql.Decimal, EvaluationAmount || 0);
        request.input('ReportTime', sql.DateTime, ReportTime ? new Date(ReportTime) : new Date());
        request.input('ReportNumber', sql.NVarChar, ReportNumber);
        request.input('SignerA_Name', sql.NVarChar, SignerA_Name || '');
        request.input('SignerA_Number', sql.NVarChar, SignerA_Number || '');
        request.input('SignerB_Name', sql.NVarChar, SignerB_Name || '');
        request.input('SignerB_Number', sql.NVarChar, SignerB_Number || '');

        await request.query(`
            INSERT INTO dbo.CodeDatabase 
            (ProjectName, EvaluationAmount, ReportTime, ReportNumber, SignerA_Name, SignerA_Number, SignerB_Name, SignerB_Number)
            VALUES 
            (@ProjectName, @EvaluationAmount, @ReportTime, @ReportNumber, @SignerA_Name, @SignerA_Number, @SignerB_Name, @SignerB_Number)
        `);

        // 获取刚插入的 ID (可选，方便直接返回 safeCode)
        const idResult = await request.query(`SELECT SCOPE_IDENTITY() as newId`);
        const newId = Math.floor(idResult.recordset[0].newId);
        const newSafeCode = await generateSafeCodeFromId(newId, pool);

        res.json({ success: true, message: '添加成功', newId, newSafeCode });
    } catch (err) {
        console.error('添加错误:', err);
        res.status(500).json({ error: '添加失败', details: err.message });
    }
});

// 3. 修改 (保持不变)
app.put('/api/CodeDatabase/Update/:id', async (req, res) => {
    // ... (保持你原有的更新逻辑不变) ...
    try {
        const pool = await getPool();
        const id = req.params.id;
        const data = req.body;

        const request = pool.request();
        request.input('Id', sql.Int, id);
        request.input('ProjectName', sql.NVarChar, data.ProjectName);
        request.input('EvaluationAmount', sql.Decimal, data.EvaluationAmount);
        request.input('ReportTime', sql.DateTime, data.ReportTime ? new Date(data.ReportTime) : null);
        request.input('ReportNumber', sql.NVarChar, data.ReportNumber);
        request.input('SignerA_Name', sql.NVarChar, data.SignerA_Name);
        request.input('SignerA_Number', sql.NVarChar, data.SignerA_Number);
        request.input('SignerB_Name', sql.NVarChar, data.SignerB_Name);
        request.input('SignerB_Number', sql.NVarChar, data.SignerB_Number);

        await request.query(`
            UPDATE dbo.CodeDatabase 
            SET ProjectName = @ProjectName,
                EvaluationAmount = @EvaluationAmount,
                ReportTime = @ReportTime,
                ReportNumber = @ReportNumber,
                SignerA_Name = @SignerA_Name,
                SignerA_Number = @SignerA_Number,
                SignerB_Name = @SignerB_Name,
                SignerB_Number = @SignerB_Number
            WHERE Id = @Id
        `);

        res.json({ success: true, message: '更新成功' });
    } catch (err) {
        console.error('更新错误:', err);
        res.status(500).json({ error: '更新失败', details: err.message });
    }
});

// 4. 删除 (保持不变)
app.delete('/api/CodeDatabase/Delete/:id', async (req, res) => {
    // ... (保持你原有的删除逻辑不变) ...
    try {
        const pool = await getPool();
        const id = req.params.id;
        await pool.request()
            .input('Id', sql.Int, id)
            .query(`DELETE FROM dbo.CodeDatabase WHERE Id = @Id`);
        res.json({ success: true, message: '删除成功' });
    } catch (err) {
        console.error('删除错误:', err);
        res.status(500).json({ error: '删除失败', details: err.message });
    }
});

// --- 新增：根据混淆码获取真实数据的接口 (用于 CodeCheck 页面) ---
app.get('/api/CodeDatabase/VerifyAndFetch', async (req, res) => {
    try {
        const { code } = req.query; // 前端传入类似 "p2G2&x9Lm" 的字符串
        if (!code) {
            return res.status(400).json({ error: '缺少校验码参数' });
        }

        const pool = await getPool();

        // 1. 解析混淆码得到真实 ID
        const realId = await getIdFromSafeCode(code, pool);

        if (!realId) {
            return res.status(404).json({ error: '无效的校验码或数据不存在' });
        }

        // 2. 根据真实 ID 查询数据
        const request = pool.request();
        const result = await request
            .input('Id', sql.Int, realId)
            .query(`SELECT * FROM dbo.CodeDatabase WHERE Id = @Id`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: '数据不存在' });
        }

        // 3. 返回数据 (同时也返回当前的 safeCode 供前端确认)
        const row = result.recordset[0];
        const safeCode = await generateSafeCodeFromId(row.Id, pool);

        res.json({
            success: true,
            data: { ...row, safeCode },
            message: '验证通过'
        });

    } catch (err) {
        console.error('验证查询错误:', err);
        res.status(500).json({ error: '验证失败', details: err.message });
    }
});




// 1. 提交联系表单 (ContactUs 使用) 用户留言
app.post('/api/CodeDatabase/submitContact', async (req, res) => {
    const { requestername, contact, description } = req.body;

    if (!requestername || !description) {
        return res.status(400).json({ success: false, message: '姓名和描述不能为空' });
    }

    try {
        await poolConnect;
        const request = new sql.Request(pool);

        // 插入数据
        const result = await request
            .input('requestername', sql.NVarChar(50), requestername)
            .input('contact', sql.NVarChar(50), contact || null)
            .input('description', sql.NVarChar(sql.MAX), description)
            .query(`
                INSERT INTO RdpgCode.dbo.CqrdpgBusiness (requestername, contact, description, isread, submitted)
                VALUES (@requestername, @contact, @description, 0, GETDATE());
                SELECT SCOPE_IDENTITY() as newId;
            `);

        const newId = result.recordset[0].newId;

        // 🔥 实时通知所有连接的管理端用户
        const newMessage = {
            id: parseInt(newId),
            requestername,
            contact: contact || '未提供',
            description,
            isread: 0,
            submitted: new Date().toISOString(),
            responded: null
        };

        io.emit('new_message_received', newMessage);

        res.json({ success: true, message: '提交成功', id: newId });
    } catch (err) {
        console.error('数据库插入错误:', err);
        res.status(500).json({ success: false, message: '服务器内部错误', error: err.message });
    }
});

// 2. 获取消息列表 (MessageManagement 初始化使用，作为 Socket 的备用或初始加载) 管理员查看列表。
app.get('/api/CodeDatabase/getMessages', async (req, res) => {
    try {
        await poolConnect;
        const result = await pool.request()
            .query('SELECT * FROM RdpgCode.dbo.CqrdpgBusiness ORDER BY submitted DESC');

        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error('获取消息列表错误:', err);
        res.status(500).json({ success: false, message: '获取数据失败' });
    }
});

// 3. 标记为已读 (可选功能) 管理员修改状态。
app.put('/api/CodeDatabase/markAsRead/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await poolConnect;
        await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE RdpgCode.dbo.CqrdpgBusiness SET isread = 1, responded = GETDATE() WHERE id = @id');

        // 通知前端列表更新
        io.emit('message_updated', { id: parseInt(id), isread: 1, responded: new Date().toISOString() });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
 

// 4. 删除留言 (新增代码)
app.delete('/api/CodeDatabase/deleteMessage/:id', async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ success: false, message: 'ID 不能为空' });
    }

    try {
        await poolConnect;
        const request = new sql.Request(pool);
        
        // 执行删除操作
        const result = await request
            .input('id', sql.Int, parseInt(id))
            .query('DELETE FROM RdpgCode.dbo.CqrdpgBusiness WHERE id = @id');

        // 如果影响行数为 0，说明没找到该 ID
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: '未找到该留言' });
        }

        // 🔥 实时通知所有前端：这条消息被删除了，需要从列表中移除
        io.emit('message_deleted', { id: parseInt(id) });

        res.json({ success: true, message: '删除成功' });
    } catch (err) {
        console.error('删除消息错误:', err);
        res.status(500).json({ success: false, message: '服务器内部错误', error: err.message });
    }
});
{//beizhu

}



// 根路径
app.get('/', (req, res) => {
    res.send('CqrdCodeServer API is running...');
});

// 启动服务器
//const server = http.createServer(app);
server.listen(port, () => {
    console.log(`🚀 CqrdCodeServer is running on http://localhost:${port}`);
});