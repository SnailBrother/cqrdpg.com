import React, { useState, useEffect } from 'react';
import styles from './EasyValuation.module.css';

const EasyValuation = () => {
    const [currentAnnouncement, setCurrentAnnouncement] = useState(0);
    const announcements = [
        "易估价网正在建设中，敬请期待！",
        "目标：新增自动估价功能，快速获取房产估值",
        "网站持续优化中，敬请期待更多功能"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    return (
         <div className={styles.pageWrapper}>
        <div className={styles.container}>

            <div className={styles.topcontainer}>
                {/* 顶部Logo和名称栏 */}
                <div className={styles.topLogoBar}>
                    <div className={styles.logoWrapper}>
                        <div className={styles.logo}>
                            <img src="/RuidaLogo.jpg" alt="重庆评估" />
                        </div>
                        <span className={styles.companyName}>重庆评估</span>
                    </div>
                </div>

                {/* 顶部搜索栏 */}
                <div className={styles.topSearchBar}>
                    <div className={styles.searchWrapper}>

                        <input
                            type="text"
                            placeholder="请输入小区名称或地址查询"
                            className={styles.searchInput}
                        />
                        <button className={styles.searchBtn}>查询</button>

                    </div>
                </div>
            </div>

            {/* 滚动公告 - 单独放在下面一行 */}
            <div className={styles.scrollAnnouncement}>
                <span className={styles.scrollIcon}>📢</span>
                <div className={styles.scrollText}>
                    {announcements[currentAnnouncement]}
                </div>
            </div>

            <div className={styles.mainContent}>
                {/* 左侧导航栏 */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h3>评估全程服务</h3>
                    </div>
                    <ul className={styles.sidebarMenu}>
                        <li className={styles.menuActive}>找机构估价</li>
                        <li>委托评估</li>
                        <li>金融评估</li>
                    </ul>
                </div>

                {/* 中间核心区域 */}
                <div className={styles.contentArea}>
                    {/* 导航面包屑 */}
                    <div className={styles.navTabs}>
                        <a href="#" className={styles.tabActive}>首页</a>
                        <a href="#">财税</a>
                        <a href="#">自动估价</a>
                        <a href="#">评估机构</a>
                        <a href="#">评估师</a>
                        <a href="#">资讯</a>
                        <a href="#">报告下载</a>
                        <a href="#">防伪码查询</a>
                    </div>

                    {/* 轮播图 Banner */}
                    <div className={styles.banner}>
                        <img
                            src="/images/cqrdpg/home/CompanyProfile/Service.jpg"
                            alt="评估界的AlphaGo"
                            className={styles.bannerImg}
                        />
                        <div className={styles.bannerDots}>
                            <span className={styles.dotActive}></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>

                    {/* 最新询价 & 最新评估 两栏 */}
                    <div className={styles.valuationRow}>
                        <div className={`${styles.valuationCol} ${styles.inquiryCol}`}>
                            <h3>最新询价</h3>
                            <ul className={styles.valuationList}>
                                <li>
                                    <span>阳光花园 住宅询价</span>
                                    <span className={styles.statusPending}>待询价</span>
                                </li>
                                <li>
                                    <span>滨江壹号 住宅询价</span>
                                    <span className={styles.statusPending}>待询价</span>
                                </li>
                                <li>
                                    <span>翡翠湾 住宅询价</span>
                                    <span className={styles.statusDone}>已询价</span>
                                </li>
                                <li>
                                    <span>书香门第 住宅询价</span>
                                    <span className={styles.statusPending}>待询价</span>
                                </li>
                                <li>
                                    <span>湖畔雅居 住宅询价</span>
                                    <span className={styles.statusPending}>待询价</span>
                                </li>
                            </ul>
                        </div>

                        <div className={`${styles.valuationCol} ${styles.evaluationCol}`}>
                            <h3>最新评估</h3>
                            <ul className={styles.valuationList}>
                                <li>
                                    <span>龙湖舜山府 评估完成</span>
                                    <span className={styles.statusDone}>已完成</span>
                                </li>
                                <li>
                                    <span>融创凡尔赛 评估中</span>
                                    <span className={styles.statusPending}>进行中</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* 资讯 & 问答 两栏 - 优化布局 */}
                    <div className={styles.infoRow}>
                        <div className={styles.infoCol}>
                            <div className={styles.infoHeader}>
                                <img
                                    src="/images/cqrdpg/home/Dynamic/1.jpg"
                                    alt="资讯图标"
                                    className={styles.infoIcon}
                                />
                                <div className={styles.infoTitleWrapper}>
                                    <h3>评估资讯</h3>
                                    <a href="#" className={styles.moreLink}>查看详情&gt;</a>
                                </div>
                            </div>
                            <ul className={styles.infoList}>
                                <li>易估价网：2025年重庆土地市场一季度成交分析</li>
                                <li>2025年重庆主城九区二手房成交均价月度报告</li>
                                <li>房地产评估行业数字化转型趋势白皮书</li>
                                <li>重庆核心商圈写字楼空置率及租金走势分析</li>
                                <li>成渝双城经济圈房地产协同发展政策解读</li>
                                <li>2025年重庆远郊区县住宅市场投资潜力分析</li>
                                <li>AI技术在批量房地产评估中的应用实践</li>
                                <li>重庆保障性住房建设对市场影响专题研究</li>
                            </ul>
                        </div>

                        <div className={styles.infoCol}>
                            <div className={styles.infoHeader}>
                                <img
                                    src="/images/cqrdpg/home/Dynamic/1.jpg"
                                    alt="问答图标"
                                    className={styles.infoIcon}
                                />
                                <div className={styles.infoTitleWrapper}>
                                    <div>
                                        <h3>易估价问答</h3>
                                        <p className={styles.infoSubtitle}>行业专家解答</p>
                                    </div>
                                    <a href="#" className={styles.moreLink}>查看详情&gt;</a>
                                </div>
                            </div>
                            <ul className={styles.infoList}>
                                <li>商业地产评估的核心要点</li>
                                <li>工业厂房评估的方法与流程</li>
                                <li>评估报告中的风险提示如何解读</li>
                                <li>批量评估技术在存量房市场的应用</li>
                                <li>如何选择专业的房地产评估机构</li>
                                <li>法拍房评估价与市场价的差异分析</li>
                                <li>文旅地产评估的特殊考量因素</li>
                                <li>城市更新项目中的土地价值评估</li>
                                <li>评估数据的合规性与隐私保护</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 右侧功能区 - 优化登录和功能按钮 */}
                <div className={styles.rightSidebar}>
                    <div className={styles.userCard}>
                        <div className={styles.avatar}>
                            <svg className={styles.avatarIcon} viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                        <p className={styles.welcomeText}>您好，欢迎来到易估价网！</p>
                        <button className={styles.loginBtn}>登录</button>
                        <div className={styles.registerLink}>
                            <a href="#">注册</a> | <a href="#">忘记密码</a>
                        </div>
                    </div>

                    <div className={styles.functionGrid}>
                        <h4 className={styles.functionTitle}>快速服务</h4>
                        <div className={styles.functionButtons}>
                            <div className={styles.funcRow}>
                                <div className={styles.funcBtn}>
                                    <span className={styles.funcIcon}>🏠</span>
                                    自动估价
                                </div>
                                <div className={styles.funcBtn}>
                                    <span className={styles.funcIcon}>🔍</span>
                                    找机构估价
                                </div>
                            </div>
                            <div className={styles.funcRow}>
                                <div className={styles.funcBtn}>
                                    <span className={styles.funcIcon}>📝</span>
                                    委托评估
                                </div>
                                <div className={styles.funcBtn}>
                                    <span className={styles.funcIcon}>💰</span>
                                    贷款评估
                                </div>
                            </div>
                            <div className={styles.funcRow}>
                                <div className={styles.funcBtn}>
                                    <span className={styles.funcIcon}>🏢</span>
                                    评估机构
                                </div>
                                <div className={styles.funcBtn}>
                                    <span className={styles.funcIcon}>🧮</span>
                                    税费计算
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 二维码区域 */}
                    <div className={styles.qrSection}>

                        <div className={styles.qrRow}>
                            <div className={styles.qrItem}>
                                <div className={styles.qrCode}>
                                    <img
                                        src="/images/cqrdpg/home/ContactUs/wechat.png"
                                        alt="易估价网微信号二维码"
                                        className={styles.qrImage}
                                    />
                                </div>
                                <p>微信号</p>
                            </div>
                            <div className={styles.qrItem}>
                                <div className={styles.qrCode}>
                                    <img
                                        src="/images/cqrdpg/home/ContactUs/fuwuhao.jpg"
                                        alt="公众号二维码"
                                        className={styles.qrImage}
                                    />
                                </div>
                                <p>公众号</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部 footer */}
            <div className={styles.footer}>
                <div className={styles.footerLinks}>
                    <div className={styles.footerItem}>
                        <span className={styles.footerIcon}>👤</span>
                        <p>在线估价</p>
                        <p>报告查验</p>
                    </div>
                    <div className={styles.footerItem}>
                        <span className={styles.footerIcon}>🏢</span>
                        <p>评估机构</p>
                        <p>评估结果</p>
                    </div>
                    <div className={styles.footerItem}>
                        <span className={styles.footerIcon}>💳</span>
                        <p>服务保障</p>                  
                        <p>估价建议</p>
                    </div>
                    <div className={styles.footerItem}>
                        <span className={styles.footerIcon}>ℹ️</span>
                        <p>关于我们</p>
                        <p>联系我们</p>

                    </div>

                </div>
                <div className={styles.hotline}>
                    <p>易估价客服热线：165156</p>

                </div>
                <div className={styles.copyright}>
                    © 2026 重庆评估 版权所有 | 网站备案号：渝ICP备xxxxxx号
                </div>
            </div>
        </div>
        </div>
    );
};

export default EasyValuation;