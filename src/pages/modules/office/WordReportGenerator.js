//  src/components/webreports/WordReportGenerator.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import axios from 'axios';
import io from 'socket.io-client';
import './WordReportGenerator.css';
import { validateReportData } from './WordReportGenerator/ValidationUtils'; //独立的验证函数
import BaiduDataGrabber from './WordReportGenerator/BaiduDataGrabber';//百度地图抓包
import HandBaiduDataGrabber from './WordReportGenerator/HandBaiduDataGrabber';//百度地图手动抓包
import WordEditingPreview from './WordEditing';//百度地图手动抓包

//import { useTheme } from '../../context/ThemeContext'; // 导入useTheme钩子
//日期控件
import { DatePicker, ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
//日期控件

//import Notification from '../../pages/Notification/Notification';
import ConfirmationDialogManager from '../accounting/Notification/ConfirmationDialogManager';
import WordReportGeneratorLoader from '../accounting/Notification/WordReportGeneratorLoader';
import NotificationManager from '../accounting/Notification/NotificationManager';

import Reporttimer from '../../../components/Animation/Reporttimer';

//import ConfirmationDialog from '../../pages/Notification/ConfirmationDialog';
// 设置dayjs为中文
dayjs.locale('zh-cn');

// 创建Socket.IO连接
const socket = io('http://121.4.22.55:5202');


// 在组件内部添加这个自定义Hook 用来显示菜单功能键
const useClickOutside = (ref, callback) => {
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, callback]);
};




const WordReportGenerator = () => {
    const navigate = useNavigate();



    // 在组件状态中添加分页相关状态
    const [currentPage, setCurrentPage] = useState(1); // 当前页码
    const [pageSize, setPageSize] = useState(10); // 每页显示条数
    const [totalReports, setTotalReports] = useState(0); // 总报告数

    // 计时器 👇
    //  添加状态
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [resetTimer, setResetTimer] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showTimer, setShowTimer] = useState(false); // 控制计时器显示

    // 处理时间更新
    const handleTimeUpdate = (timeInSeconds) => {
        setElapsedTime(timeInSeconds);
    };

    // 开始/暂停计时切换
    const handleToggleTimer = () => {
        if (!showTimer) {
            setShowTimer(true); // 第一次点击开始，显示计时器
        }
        setIsTimerRunning(prev => !prev); // 切换运行状态
        setResetTimer(false);
    };

    // 停止计时（隐藏计时器并重置）
    const handleStopTimer = () => {
        setIsTimerRunning(false);
        setShowTimer(false);
        setResetTimer(true);
        setTimeout(() => setResetTimer(false), 100);
    };

    // 清零计时（不隐藏计时器）
    const handleResetTimer = () => {
        setIsTimerRunning(false);
        setResetTimer(true);
        setTimeout(() => setResetTimer(false), 100);
    };

    // 计时器 👆




    // 通知系统引用
    const notificationRef = useRef();


    // 添加一个ref来引用菜单容器
    const menuRef = useRef(null);

    //   用来显示菜单功能键 👇
    // 添加菜单显示状态
    const [isMenuActive, setIsMenuActive] = useState(false);

    // 使用自定义Hook来检测外部点击
    useClickOutside(menuRef, () => {
        if (isMenuActive) {
            setIsMenuActive(false);
            const menuBox = document.querySelector('.reportgenerator-menu-box');
            menuBox.classList.remove('reportgenerator-active');
        }
    });

    // 修改菜单按钮点击处理
    const handleMenuButtonClick = () => {
        const menuBox = document.querySelector('.reportgenerator-menu-box');
        const newActiveState = !isMenuActive;
        setIsMenuActive(newActiveState);

        if (newActiveState) {
            menuBox.classList.add('reportgenerator-active');
        } else {
            menuBox.classList.remove('reportgenerator-active');
        }
    };

    // 修改菜单项点击处理（添加关闭菜单逻辑）
    const handleMenuItemClick = (callback) => {
        return () => {
            setIsMenuActive(false);
            const menuBox = document.querySelector('.reportgenerator-menu-box');
            menuBox.classList.remove('reportgenerator-active');
            if (callback) callback();
        };
    };


    //   用来显示菜单功能键 👆

    //打开报告预览功能 👇
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [previewTemplateType, setPreviewTemplateType] = useState('住宅'); // 默认住宅模板

    // 添加报告预览处理函数
    const handleViewReportPreview = () => {
        if (!reportgeneratorReportData.property.location) {
            notify('请先填写房产坐落', 'warning');
            return;
        }

        // 根据估价方法确定模板类型
        const templateType = reportgeneratorReportData.result.valuationMethod === '收益法' ? '商业' : '住宅';

        setPreviewTemplateType(templateType);
        setShowReportPreview(true);
        handleMenuItemClick(); // 关闭菜单
    };

    //报告预览回传数据
const handleSavePreviewData = (updatedData) => {
    console.log('收到更新的数据:', updatedData);
    
    // 创建一个函数来更新嵌套字段
    const updateNestedField = (state, path, value) => {
        const keys = path.split('.');
        const newState = { ...state };
        let current = newState;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] };
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return newState;
    };
    
    // 定义字段映射（WordEditing字段名 -> WordReportGenerator字段路径）
    const fieldMap = {
        // 委托信息
        documentNo: 'entrustment.documentNo',
        entrustingParty: 'entrustment.entrustingParty',
        assessmentCommissionDocument: 'entrustment.assessmentCommissionDocument',
        
        // 产权信息
        location: 'property.location',
        buildingArea: 'property.buildingArea',
        interiorArea: 'property.interiorArea',
        propertyCertificateNo: 'property.propertyCertificateNo',
        rightsHolder: 'property.rightsHolder',
        
        // 结果信息
        reportID: 'result.reportID',
        projectID: 'result.projectID',
        valuationPrice: 'result.valuationPrice',
        rent: 'result.rent',
        
        // 估价师信息
        appraiserA_name: 'result.appraiserA.name',
        appraiserA_licenseNo: 'result.appraiserA.licenseNo',
        appraiserB_name: 'result.appraiserB.name',
        appraiserB_licenseNo: 'result.appraiserB.licenseNo',
    };
    
    // 批量更新所有字段
    let newState = { ...reportgeneratorReportData };
    
    Object.entries(fieldMap).forEach(([templateField, reportPath]) => {
        if (updatedData[templateField] !== undefined) {
            newState = updateNestedField(newState, reportPath, updatedData[templateField]);
        }
    });
    
    setReportgeneratorReportData(newState);
    notify('预览数据已保存', 'success');
    setShowReportPreview(false);
};
    //打开报告预览功能 👆




    // 获取通知API
    const notify = (message, type = 'info') => {
        if (notificationRef.current) {
            notificationRef.current.addNotification(message, type);
        }
    };
    //添加百度抓包控制模态框显示的状态
    const [showBaiduDataGrabber, setShowBaiduDataGrabber] = useState(false);
    const [showHandBaiduDataGrabber, setShowHandBaiduDataGrabber] = useState(false);
    // 加载状态
    const [isLoading, setIsLoading] = useState(false);

    // 在组件状态中添加控制模态框显示的状态
    const [showSearchResults, setShowSearchResults] = useState(false);
    // 当前激活的Tab状态
    const [reportgeneratorActiveTab, setReportgeneratorActiveTab] = useState('entrustment');

    // 搜索关键词状态
    const [reportgeneratorSearchTerm, setReportgeneratorSearchTerm] = useState('');

    // 估价师选项数据
    const [reportgeneratorAppraiserOptions, setReportgeneratorAppraiserOptions] = useState([]);

    // 报告列表数据（用于搜索结果显示）
    const [reportgeneratorReportList, setReportgeneratorReportList] = useState([]);

    // 当前编辑的报告ID（null表示新增，有值表示编辑）
    const [currentReportId, setCurrentReportId] = useState(null);

    // 报告数据状态
    const [reportgeneratorReportData, setReportgeneratorReportData] = useState({
        // tab  1  委托书信息
        entrustment: {
            documentNo: '', // 委托书编号
            entrustDate: '', // 委托日期
            entrustingParty: '', // 委托方
            assessmentCommissionDocument: '', // 评估委托文书
            valueDateRequirements: '', // 价值时点要求
        },
        // tab  2   产权信息
        property: {
            location: '', // 房产坐落
            buildingArea: '', // 建筑面积
            interiorArea: '', // 套内面积
            propertyCertificateNo: '', // 产权证号
            housePurpose: '', // 房屋用途
            propertyUnitNo: '', // 不动产单元号
            rightsHolder: '', // 权利人
            landPurpose: '', // 土地用途
            sharedLandArea: '', // 共有宗地面积
            landUseRightEndDate: '', // 土地使用权终止日期
            houseStructure: '', // 房屋结构
            coOwnershipStatus: '', // 共有情况
            rightsNature: '', // 权利性质
        },
        // tab  3   实物状况
        physicalCondition: {
            communityName: '', // 小区名称
            totalFloors: '', // 总层数
            floorNumber: '', // 所在楼层
            elevator: false, // 电梯
            decorationStatus: '', // 装饰装修
            ventilationStatus: false, // 通气
            spaceLayout: '', // 空间布局
            exteriorWallMaterial: '', // 外墙面
            yearBuilt: '', // 建成年份
            boundaries: '',  // 四至
            bank: '', // 附近银行
            supermarket: '', // 附近超市
            hospital: '', // 附近医院
            school: '', // 附近学校
            nearbyCommunity: '', // 附近小区
            busStopName: '', // 附近公交站名
            busRoutes: '', // 附近公交线路
            areaRoad: '',  // 附近区域道路
            landShape: '',  // 土地形状
            direction: '',  // 方位
            distance: '',  // 距离
            orientation: '',  // 朝向
            streetStatus: '',  // 临街状况
            parkingStatus: '',  // 停车状况

        },
        // tab  4   结果信息
        result: {
            valueDate: '', // 价值时点
            reportDate: '', // 报告日期
            valuationMethod: '', // 估价方法
            projectID: '', // 新增项目编号
            reportID: '', // 新增报告编号
            valuationPrice: '', // 新增评估单价
            hasFurnitureElectronics: false, // 默认为false（不包含家具家电）
            furnitureElectronicsEstimatedPrice: '', // 家具家电评估总价
            appraiserA: {
                name: '', // 估价师A姓名
                licenseNo: '' // 估价师A注册号
            },
            appraiserB: {
                name: '', // 估价师B姓名
                licenseNo: '' // 估价师B注册号
            },
            rent: '', // 租金
        },
        // tab  5   权益状况equityStatus
        equityStatus: {
            mortgageStatus: true, //                    -- 抵押状况
            mortgageBasis: '', //                    -- 抵押依据
            seizureStatus: true, //                      -- 查封状况
            seizureBasis: '', //                       -- 查封依据
            utilizationStatus: '', //                 -- 利用状况
            isLeaseConsidered: false, //                          -- 是否考虑租约（1 = 是，0 = 否）
        }
    });

    // 添加一个状态来控制是否显示租约选项
    const [showLeaseOption, setShowLeaseOption] = useState(false);
    // 监听利用状况的变化
    useEffect(() => {
        // 当利用状况为"出租"时显示租约选项，否则隐藏
        setShowLeaseOption(reportgeneratorReportData.equityStatus.utilizationStatus === "出租");

        // 如果利用状况不是"出租"，自动将是否考虑租约设置为false
        if (reportgeneratorReportData.equityStatus.utilizationStatus !== "出租") {
            reportgeneratorHandleInputChange('equityStatus', 'isLeaseConsidered', false);
        }
    }, [reportgeneratorReportData.equityStatus.utilizationStatus]);
    // 组件加载时获取初始数据
    useEffect(() => {
        // 获取估价师选项
        const fetchAppraiserOptions = async () => {
            try {
                const response = await axios.get('http://121.4.22.55:5202/api/getWordReportOptions');
                setReportgeneratorAppraiserOptions(response.data);
            } catch (error) {
                console.error('获取估价师选项失败:', error);
                notify('获取估价师选项失败，请稍后重试', 'error');
                //alert('获取估价师选项失败，请稍后重试');
            }
        };

        // 获取报告列表 api/searchWordReports
        const fetchReportList = async () => {
            try {
                const response = await axios.get('http://121.4.22.55:5202/api/searchWordReports');
                let data = response.data;

                // 确保返回的是数组
                if (!Array.isArray(data)) {
                    if (data && typeof data === 'object') {
                        data = Object.values(data);
                    } else {
                        data = [];
                    }
                }

                setReportgeneratorReportList(data);
            } catch (error) {
                console.error('获取报告列表失败:', error);
                setReportgeneratorReportList([]); // 出错时设为空数组
            }
        };

        fetchAppraiserOptions();
        fetchReportList();

        // 设置Socket.IO监听
        socket.on('report_updated', (updatedReport) => {
            // 如果更新的是当前正在编辑的报告，则更新表单数据
            if (currentReportId && currentReportId === updatedReport.reportsID) {
                loadReportData(updatedReport);
            }
            // 更新报告列表
            setReportgeneratorReportList(prev =>
                prev.map(report =>
                    report.reportsID === updatedReport.reportsID ? updatedReport : report
                )
            );
        });

        // 修改这部分
        socket.on('report_created', (newReport) => {
            // 添加到报告列表
            setReportgeneratorReportList(prev => [...prev, newReport]);
            // 如果是当前表单创建的新报告，则设置为当前编辑
            if (!currentReportId && reportgeneratorReportData.result.reportID === newReport.reportID) {
                setCurrentReportId(newReport.reportsID);
            }
        });

        socket.on('report_deleted', (deletedId) => {
            // 安全更新报告列表
            setReportgeneratorReportList(prev => {
                if (!prev) return [];
                if (Array.isArray(prev)) {
                    return prev.filter(report => report.reportsID !== deletedId);
                }
                // 如果是对象，转换为数组再过滤
                if (typeof prev === 'object' && prev !== null) {
                    return Object.values(prev).filter(report => report.reportsID !== deletedId);
                }
                return [];
            });

            // 如果删除的是当前正在编辑的报告，则清空表单
            if (currentReportId === deletedId) {
                resetForm();
            }
        });

        // 组件卸载时移除监听
        return () => {
            socket.off('report_updated');
            socket.off('report_created');
            socket.off('report_deleted');
        };
    }, [currentReportId, reportgeneratorReportData.property.location]);

    /**
     * 加载报告数据到表单
     * @param {object} reportData - 从数据库获取的报告数据
     */
    const loadReportData = (reportData) => {
        setCurrentReportId(reportData.reportsID);
        setReportgeneratorReportData({
            entrustment: {
                documentNo: reportData.documentNo || '',
                entrustDate: reportData.entrustDate ? dayjs(reportData.entrustDate.split('T')[0]) : null,
                entrustingParty: reportData.entrustingParty || '',
                assessmentCommissionDocument: reportData.assessmentCommissionDocument || '',
                valueDateRequirements: reportData.valueDateRequirements || ''
            },
            property: {
                location: reportData.location || '',
                buildingArea: reportData.buildingArea !== null && reportData.buildingArea !== undefined
                    ? reportData.buildingArea.toString()
                    : '',
                interiorArea: reportData.interiorArea !== null && reportData.interiorArea !== undefined
                    ? reportData.interiorArea.toString()
                    : '',
                propertyCertificateNo: reportData.propertyCertificateNo || '',
                housePurpose: reportData.housePurpose || '',
                propertyUnitNo: reportData.propertyUnitNo || '',
                rightsHolder: reportData.rightsHolder || '',
                landPurpose: reportData.landPurpose || '',
                sharedLandArea: reportData.sharedLandArea !== null && reportData.sharedLandArea !== undefined
                    ? reportData.sharedLandArea.toString()
                    : '',
                landUseRightEndDate: reportData.landUseRightEndDate ? dayjs(reportData.landUseRightEndDate.split('T')[0]) : null,
                houseStructure: reportData.houseStructure || '',
                coOwnershipStatus: reportData.coOwnershipStatus || '',
                rightsNature: reportData.rightsNature || ''
            },
            physicalCondition: {
                communityName: reportData.communityName || '',
                totalFloors: reportData.totalFloors !== null && reportData.totalFloors !== undefined
                    ? reportData.totalFloors.toString()
                    : '',
                floorNumber: reportData.floorNumber !== null && reportData.floorNumber !== undefined
                    ? reportData.floorNumber.toString()
                    : '',
                elevator: reportData.elevator || false,
                decorationStatus: reportData.decorationStatus || '',
                ventilationStatus: reportData.ventilationStatus || false,
                spaceLayout: reportData.spaceLayout || '',
                exteriorWallMaterial: reportData.exteriorWallMaterial || '',
                yearBuilt: reportData.yearBuilt !== null && reportData.yearBuilt !== undefined
                    ? reportData.yearBuilt.toString()
                    : '',
                boundaries: reportData.boundaries || '',
                bank: reportData.bank || '',
                supermarket: reportData.supermarket || '',
                hospital: reportData.hospital || '',
                school: reportData.school || '',
                nearbyCommunity: reportData.nearbyCommunity || '',
                busStopName: reportData.busStopName || '',
                busRoutes: reportData.busRoutes || '',
                areaRoad: reportData.areaRoad || '',
                landShape: reportData.landShape || '',      //土地形状
                direction: reportData.direction || '',        //方位
                distance: reportData.distance || '',      //距离
                orientation: reportData.orientation || '',           //朝向
                streetStatus: reportData.streetStatus || '',        //临街状况
                parkingStatus: reportData.parkingStatus || '',      //停车状况
            },
            result: {
                valueDate: reportData.valueDate ? dayjs(reportData.valueDate.split('T')[0]) : null,
                reportDate: reportData.reportDate ? dayjs(reportData.reportDate.split('T')[0]) : null,
                valuationMethod: reportData.valuationMethod || '',
                projectID: reportData.projectID || '', // 新增
                reportID: reportData.reportID || '', // 新增
                valuationPrice: reportData.valuationPrice || '', // 新增
                hasFurnitureElectronics: reportData.hasFurnitureElectronics || false,
                furnitureElectronicsEstimatedPrice: reportData.furnitureElectronicsEstimatedPrice !== null && reportData.furnitureElectronicsEstimatedPrice !== undefined
                    ? reportData.furnitureElectronicsEstimatedPrice.toString()
                    : '',
                appraiserA: {
                    name: reportData.appraiserNameA || '',
                    licenseNo: reportData.appraiserRegNoA || ''
                },
                appraiserB: {
                    name: reportData.appraiserNameB || '',
                    licenseNo: reportData.appraiserRegNoB || ''
                },
                rent: reportData.rent || '', // 新增租金
            },
            equityStatus: {
                mortgageStatus: reportData.mortgageStatus || false, //抵押状况
                mortgageBasis: reportData.mortgageBasis || '', // 抵押依据
                seizureStatus: reportData.seizureStatus || false, // 查封状况
                seizureBasis: reportData.seizureBasis || '', // 查封依据
                utilizationStatus: reportData.utilizationStatus || '', // 利用状况
                isLeaseConsidered: reportData.isLeaseConsidered || false,

            }

        });
        setShowSearchResults(false); // 加载数据后关闭模态框
    };

    /**
     * 重置表单数据
     */
    const resetForm = () => {
        setCurrentReportId(null);
        setReportgeneratorReportData({
            entrustment: {
                documentNo: '',
                entrustDate: '',
                entrustingParty: '',
                assessmentCommissionDocument: '',
                valueDateRequirements: ''
            },
            property: {
                location: '',
                buildingArea: '',
                interiorArea: '',
                propertyCertificateNo: '',
                housePurpose: '',
                propertyUnitNo: '',
                rightsHolder: '',
                landPurpose: '',
                sharedLandArea: '',
                landUseRightEndDate: '',
                houseStructure: '',
                coOwnershipStatus: '',
                rightsNature: ''
            },
            physicalCondition: {
                communityName: '',
                totalFloors: '',
                floorNumber: '',
                elevator: false,
                decorationStatus: '',
                ventilationStatus: false,
                spaceLayout: '',
                exteriorWallMaterial: '',
                yearBuilt: '',
                boundaries: '',
                bank: '',
                supermarket: '',
                hospital: '',
                school: '',
                nearbyCommunity: '',
                busStopName: '',
                busRoutes: '',
                areaRoad: '',
                landShape: '',   //土地形状
                direction: '',   // -- 方位
                distance: '',   //   -- 距离
                orientation: '',   //       -- 朝向
                streetStatus: '',   //       -- 临街状况
                parkingStatus: '',   //       -- 停车状况

            },
            result: {
                valueDate: '',
                reportDate: '',
                valuationMethod: '',
                projectID: '', // 新增
                reportID: '', // 新增
                valuationPrice: '', // 新增
                hasFurnitureElectronics: '', // 新增
                furnitureElectronicsEstimatedPrice: '', // 新增
                appraiserA: {
                    name: '',
                    licenseNo: ''
                },
                appraiserB: {
                    name: '',
                    licenseNo: ''
                },
                rent: '', // 新增租金

            },
            equityStatus: {
                mortgageStatus: true, //                    -- 抵押状况
                mortgageBasis: '', //                    -- 抵押依据
                seizureStatus: true, //                      -- 查封状况
                seizureBasis: '', //                       -- 查封依据
                utilizationStatus: '', //                 -- 利用状况
                isLeaseConsidered: false, //                          -- 是否考虑租约（1 = 是，0 = 否）
            }
        });
    };

    /**
     * 搜索报告
     */
    const reportgeneratorSearchReports = async () => {
        // 检查搜索关键词是否为空
        if (!reportgeneratorSearchTerm.trim()) {
            notify('请输入搜索关键词', 'warning');
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.get(
                `http://121.4.22.55:5202/api/searchWordReports?documentNo=${reportgeneratorSearchTerm}&page=${currentPage}&pageSize=${pageSize}`
            );
            setReportgeneratorReportList(response.data.reports); // 假设返回数据格式为 { reports: [], total: 100 }
            setTotalReports(response.data.total);
            setShowSearchResults(true);
        } catch (error) {
            console.error('搜索报告失败:', error);
            notify('搜索报告失败，请稍后重试', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 保存报告数据（自动判断是新增还是更新）
     */
    const reportgeneratorSaveReport = async (confirm) => {
        setIsLoading(true);
        try {
            // 准备要保存的数据
            const reportData = {
                documentNo: reportgeneratorReportData.entrustment.documentNo,
                // entrustDate: reportgeneratorReportData.entrustment.entrustDate,
                entrustDate: reportgeneratorReportData.entrustment.entrustDate ?
                    dayjs(reportgeneratorReportData.entrustment.entrustDate).format('YYYY-MM-DD') : null,

                entrustingParty: reportgeneratorReportData.entrustment.entrustingParty,
                assessmentCommissionDocument: reportgeneratorReportData.entrustment.assessmentCommissionDocument,
                valueDateRequirements: reportgeneratorReportData.entrustment.valueDateRequirements,
                location: reportgeneratorReportData.property.location,
                buildingArea: parseFloat(reportgeneratorReportData.property.buildingArea) || 0,
                interiorArea: parseFloat(reportgeneratorReportData.property.interiorArea) || 0,
                propertyCertificateNo: reportgeneratorReportData.property.propertyCertificateNo,
                housePurpose: reportgeneratorReportData.property.housePurpose,
                propertyUnitNo: reportgeneratorReportData.property.propertyUnitNo,
                rightsHolder: reportgeneratorReportData.property.rightsHolder,
                landPurpose: reportgeneratorReportData.property.landPurpose,
                sharedLandArea: parseFloat(reportgeneratorReportData.property.sharedLandArea) || 0,
                // landUseRightEndDate: reportgeneratorReportData.property.landUseRightEndDate,
                landUseRightEndDate: reportgeneratorReportData.property.landUseRightEndDate ?
                    dayjs(reportgeneratorReportData.property.landUseRightEndDate).format('YYYY-MM-DD') : null,

                houseStructure: reportgeneratorReportData.property.houseStructure,
                coOwnershipStatus: reportgeneratorReportData.property.coOwnershipStatus,
                rightsNature: reportgeneratorReportData.property.rightsNature,
                communityName: reportgeneratorReportData.physicalCondition.communityName,
                totalFloors: parseInt(reportgeneratorReportData.physicalCondition.totalFloors) || 0,
                floorNumber: parseInt(reportgeneratorReportData.physicalCondition.floorNumber) || 0,
                elevator: reportgeneratorReportData.physicalCondition.elevator,
                decorationStatus: reportgeneratorReportData.physicalCondition.decorationStatus,
                ventilationStatus: reportgeneratorReportData.physicalCondition.ventilationStatus,
                spaceLayout: reportgeneratorReportData.physicalCondition.spaceLayout,
                exteriorWallMaterial: reportgeneratorReportData.physicalCondition.exteriorWallMaterial,
                yearBuilt: parseInt(reportgeneratorReportData.physicalCondition.yearBuilt) || 0,
                boundaries: reportgeneratorReportData.physicalCondition.boundaries,
                bank: reportgeneratorReportData.physicalCondition.bank,
                supermarket: reportgeneratorReportData.physicalCondition.supermarket,
                hospital: reportgeneratorReportData.physicalCondition.hospital,
                school: reportgeneratorReportData.physicalCondition.school,
                nearbyCommunity: reportgeneratorReportData.physicalCondition.nearbyCommunity,
                busStopName: reportgeneratorReportData.physicalCondition.busStopName,
                busRoutes: reportgeneratorReportData.physicalCondition.busRoutes,
                areaRoad: reportgeneratorReportData.physicalCondition.areaRoad,
                landShape: reportgeneratorReportData.physicalCondition.landShape,   //      -- 土地形状
                direction: reportgeneratorReportData.physicalCondition.direction,   //            -- 方位
                distance: reportgeneratorReportData.physicalCondition.distance,   //                   -- 距离
                orientation: reportgeneratorReportData.physicalCondition.orientation,   //             -- 朝向
                streetStatus: reportgeneratorReportData.physicalCondition.streetStatus,   //               -- 临街状况
                parkingStatus: reportgeneratorReportData.physicalCondition.parkingStatus,   //            -- 停车状况
                //valueDate: reportgeneratorReportData.result.valueDate,
                valueDate: reportgeneratorReportData.result.valueDate ?
                    dayjs(reportgeneratorReportData.result.valueDate).format('YYYY-MM-DD') : null,

                //reportDate: reportgeneratorReportData.result.reportDate,
                reportDate: reportgeneratorReportData.result.reportDate ?
                    dayjs(reportgeneratorReportData.result.reportDate).format('YYYY-MM-DD') : null,
                valuationMethod: reportgeneratorReportData.result.valuationMethod,
                projectID: reportgeneratorReportData.result.projectID,
                reportID: reportgeneratorReportData.result.reportID,
                valuationPrice: parseFloat(reportgeneratorReportData.result.valuationPrice) || 0,
                appraiserNameA: reportgeneratorReportData.result.appraiserA.name,
                appraiserRegNoA: reportgeneratorReportData.result.appraiserA.licenseNo,
                appraiserNameB: reportgeneratorReportData.result.appraiserB.name,
                appraiserRegNoB: reportgeneratorReportData.result.appraiserB.licenseNo,
                rent: parseFloat(reportgeneratorReportData.result.rent) || 0,//租金
                hasFurnitureElectronics: reportgeneratorReportData.result.hasFurnitureElectronics,
                furnitureElectronicsEstimatedPrice: parseInt(reportgeneratorReportData.result.furnitureElectronicsEstimatedPrice) || 0,
                mortgageStatus: reportgeneratorReportData.equityStatus.mortgageStatus,//                    -- 抵押状况
                mortgageBasis: reportgeneratorReportData.equityStatus.mortgageBasis,//                    -- 抵押依据
                seizureStatus: reportgeneratorReportData.equityStatus.seizureStatus,//                      -- 查封状况
                seizureBasis: reportgeneratorReportData.equityStatus.seizureBasis,//                       -- 查封依据
                utilizationStatus: reportgeneratorReportData.equityStatus.utilizationStatus,//                 -- 利用状况
                isLeaseConsidered: reportgeneratorReportData.equityStatus.isLeaseConsidered,//                          -- 是否考虑租约（1 = 是，0 = 否）
            };

            // 检查必填字段 使用单独的模块来进行判断 👇

            // if (!reportData.location || !reportData.documentNo || !reportData.entrustingParty) {
            //     alert('请填写必填字段：委托书号、委托方和房产坐落');
            //     return;
            // }
            // 使用验证工具验证数据
            const validation = validateReportData(reportData);

            if (!validation.isValid) {
                if (validation.missingFields.length > 0) {
                    notify(`请填写以下必填字段：${validation.missingFields.join('、')}`, 'warning');
                    //alert(`请填写以下必填字段：${validation.missingFields.join('、')}`);
                }
                if (validation.invalidFields.length > 0) {
                    notify(`以下字段填写有误：\n${validation.invalidFields.join('\n')}`, 'warning');
                    //alert(`以下字段填写有误：\n${validation.invalidFields.join('\n')}`);
                }
                return;
            }
            // 检查必填字段 使用单独的模块来进行判断 👆

            // 检查是否存在相同报告编号的报告 
            const checkResponse = await axios.get(
                `http://121.4.22.55:5202/api/checkReportByReportID?reportID=${encodeURIComponent(reportData.reportID)}`
            );
            const existingReport = checkResponse.data;

            if (existingReport) {
                // 使用自定义确认对话框
                const isConfirmed = await confirm(
                    `已存在报告编号为"${reportData.reportID}"的报告，是否修改保存？`,
                    {
                        confirmText: '修改保存',
                        cancelText: '取消'
                    }
                );

                if (isConfirmed) {
                    await axios.put(
                        `http://121.4.22.55:5202/api/updateWordReport/${existingReport.reportsID}`,
                        reportData
                    );
                    notify('报告更新成功！', 'success');
                }
            } else {
                // 不存在相同报告编号的报告，创建新报告
                await axios.post('http://121.4.22.55:5202/api/createWordReport', reportData);
                notify('报告创建成功！', 'success');
            }
        } catch (error) {
            console.error('保存报告失败:', error);
            notify('保存报告失败，请检查数据是否正确', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    /**
     * 删除当前报告
     */
    const reportgeneratorDeleteReport = async (confirm) => {
        if (!currentReportId) {
            notify('没有选择要删除的报告', 'error');
            return;
        }

        // 确保 reportgeneratorReportList 是数组
        let reportList = reportgeneratorReportList;
        if (!Array.isArray(reportList)) {
            // 尝试转换为数组
            if (reportList && typeof reportList === 'object') {
                reportList = Object.values(reportList);
            } else {
                reportList = [];
            }
        }

        // 查找当前报告
        const currentReport = reportList.find(r => r.reportsID == currentReportId);
        const confirmMessage = currentReport
            ? `确定要删除委托书号为"${currentReport.documentNo}"、坐落为"${currentReport.location}"的报告吗？此操作不可撤销！`
            : '确定要删除当前报告吗？此操作不可撤销！';

        const isConfirmed = await confirm(confirmMessage, {
            confirmText: '删除',
            cancelText: '取消'
        });

        if (isConfirmed) {
            setIsLoading(true);
            try {
                await axios.delete(`http://121.4.22.55:5202/api/deleteWordReport/${currentReportId}`);
                notify('报告删除成功！', 'success');

                // 安全更新本地状态
                setReportgeneratorReportList(prev => {
                    if (!prev) return [];
                    if (Array.isArray(prev)) {
                        return prev.filter(r => r.reportsID != currentReportId);
                    }
                    // 如果是对象，转换为数组再过滤
                    if (typeof prev === 'object' && prev !== null) {
                        return Object.values(prev).filter(r => r.reportsID != currentReportId);
                    }
                    return [];
                });

                resetForm();
            } catch (error) {
                console.error('删除报告失败:', error);
                notify('删除报告失败，请稍后重试', 'error');
            } finally {
                setIsLoading(false);
            }
        }
    };
    /**
     * 生成Word文档并下载
     */
    const reportgeneratorGenerateWordDocument = () => {
        setIsLoading(true);

        // 根据是否有家具家电选择不同的模板文件
        // const templateFile = reportgeneratorReportData.result.hasFurnitureElectronics
        //     ? '/backend/public/webreports/结果报告-单套住宅-有家具家电.docx'
        //     : '/backend/public/webreports/结果报告-单套住宅-无家具家电.docx';
        let templateFile;

        // 根据估价方法选择模板
        if (reportgeneratorReportData.result.valuationMethod === '收益法') {
            templateFile = '/backend/public/webreports/结果报告-单套商业-无家具家电.docx';
        } else if (reportgeneratorReportData.result.valuationMethod === '比较法') {
            templateFile = reportgeneratorReportData.result.hasFurnitureElectronics
                ? '/backend/public/webreports/结果报告-单套住宅-有家具家电.docx'
                : '/backend/public/webreports/结果报告-单套住宅-无家具家电.docx';
        } else {
            // 默认情况或估价方法未选择时
            templateFile = reportgeneratorReportData.result.hasFurnitureElectronics
                ? '/backend/public/webreports/结果报告-单套住宅-有家具家电.docx'
                : '/backend/public/webreports/结果报告-单套住宅-无家具家电.docx';
        }

        fetch(templateFile)
            .then(response => response.arrayBuffer())
            .then(buffer => {
                const zip = new PizZip(buffer);
                const doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true
                });

                // 数字转中文大写金额 👇
                const convertCurrency = (money) => {
                    if (isNaN(money)) return '零';
                    if (money === 0) return '零';

                    // 汉字的数字
                    const cnNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
                    // 基本单位
                    const cnIntRadice = ['', '拾', '佰', '仟'];
                    // 对应整数部分扩展单位
                    const cnIntUnits = ['', '万', '亿', '兆'];
                    // 对应小数部分单位
                    const cnDecUnits = ['角', '分', '毫', '厘'];

                    // 最大处理的数字
                    const maxNum = 999999999999999.9999;
                    let integerNum; // 金额整数部分
                    let decimalNum; // 金额小数部分
                    let chineseStr = '';
                    let parts;

                    if (money >= maxNum) {
                        return '超出处理范围';
                    }

                    if (money === 0) {
                        return '零';
                    }

                    // 转换为字符串
                    money = money.toString();
                    if (money.indexOf('.') === -1) {
                        integerNum = money;
                        decimalNum = '';
                    } else {
                        parts = money.split('.');
                        integerNum = parts[0];
                        decimalNum = parts[1].substr(0, 4);
                    }

                    // 获取整型部分转换
                    if (parseInt(integerNum, 10) > 0) {
                        let zeroCount = 0;
                        const IntLen = integerNum.length;
                        for (let i = 0; i < IntLen; i++) {
                            const n = integerNum.substr(i, 1);
                            const p = IntLen - i - 1;
                            const q = p / 4;
                            const m = p % 4;
                            if (n === '0') {
                                zeroCount++;
                            } else {
                                if (zeroCount > 0) {
                                    chineseStr += cnNums[0];
                                }
                                zeroCount = 0;
                                chineseStr += cnNums[parseInt(n)] + cnIntRadice[m];
                            }
                            if (m === 0 && zeroCount < 4) {
                                chineseStr += cnIntUnits[q];
                            }
                        }
                    }

                    // 小数部分
                    if (decimalNum !== '') {
                        const decLen = decimalNum.length;
                        for (let i = 0; i < decLen; i++) {
                            const n = decimalNum.substr(i, 1);
                            if (n !== '0') {
                                chineseStr += cnNums[Number(n)] + cnDecUnits[i];
                            }
                        }
                    }

                    if (chineseStr === '') {
                        chineseStr = '零';
                    }

                    return chineseStr;
                };
                // 数字转中文大写金额 👆

                // 定义日期转换函数 👇 
                //第一种  显示成：  二○二五年一月八日   
                const formatChineseDateFirstType = (dateStr) => {
                    if (!dateStr) return '';

                    const date = new Date(dateStr);
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    const day = date.getDate();

                    // 中文数字映射
                    const chineseNumbers = ['○', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
                    const monthNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
                    const dayNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
                        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                        '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十', '三十一'];

                    // 特殊处理年份（2000-2099年）
                    let chineseYear = '';
                    if (year >= 2000 && year < 2100) {
                        chineseYear = `二○${chineseNumbers[year % 100 / 10 | 0]}${chineseNumbers[year % 10]}`;
                    } else {
                        // 其他年份的通用处理
                        const yearStr = year.toString();
                        for (let i = 0; i < yearStr.length; i++) {
                            chineseYear += chineseNumbers[parseInt(yearStr[i])];
                        }
                    }

                    // 组合结果
                    return `${chineseYear}年${monthNames[month - 1]}月${dayNames[day - 1]}日`;
                };

                //第二种  显示成：  2024年12月17日   
                const formatChineseDateSecondType = (dateStr) => {
                    if (!dateStr) return '';

                    const date = new Date(dateStr);
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    const day = date.getDate();

                    // 直接返回数字格式的日期
                    return `${year}年${month}月${day}日`;
                };

                // 定义日期转换函数 👆
                const allData = {
                    ...reportgeneratorReportData.entrustment,
                    ...reportgeneratorReportData.property,
                    ...reportgeneratorReportData.physicalCondition,
                    ...reportgeneratorReportData.result,
                    ...reportgeneratorReportData.equityStatus,
                    appraiserA_name: reportgeneratorReportData.result.appraiserA.name,
                    appraiserA_licenseNo: reportgeneratorReportData.result.appraiserA.licenseNo,
                    appraiserB_name: reportgeneratorReportData.result.appraiserB.name,
                    appraiserB_licenseNo: reportgeneratorReportData.result.appraiserB.licenseNo,
                    // 转换日期格式
                    entrustDate: formatChineseDateFirstType(reportgeneratorReportData.entrustment.entrustDate),
                    valueDate: formatChineseDateSecondType(reportgeneratorReportData.result.valueDate),
                    reportDate: formatChineseDateFirstType(reportgeneratorReportData.result.reportDate),
                    landUseRightEndDate: formatChineseDateSecondType(reportgeneratorReportData.property.landUseRightEndDate),
                    // 处理布尔值字段
                    elevator: reportgeneratorReportData.physicalCondition.elevator ? '有' : '无',//电梯
                    ventilationStatus: reportgeneratorReportData.physicalCondition.ventilationStatus ? '' : '未',//通气
                    projectID: reportgeneratorReportData.result.projectID,
                    reportID: reportgeneratorReportData.result.reportID,
                    reportStartDateLowercase: formatChineseDateSecondType(reportgeneratorReportData.result.reportDate),//报告出具日期小写
                    valueDateUppercase: formatChineseDateFirstType(reportgeneratorReportData.result.valueDate),//价值时点日期的大写

                    //判断是否有套内面积 word中的套内面积是在原来的套内面积基础上添加了单位的
                    correctedInteriorArea: (() => {
                        const area = reportgeneratorReportData.property.interiorArea;
                        // 检查是否为 0 或空字符串
                        if (area === 0 || area === "0" || area === "") {
                            return "未记载"; // 添加单位
                        }
                        return `为${area}平方米`; // 否则返回原值 添加单位
                    })(),
                    // 新增总楼高计算（totalFloors × 3）
                    totalGroundHeight: (() => {
                        const floors = reportgeneratorReportData.physicalCondition.totalFloors;
                        // 安全处理：转换为数字，无效值时返回null
                        const numFloors = parseFloat(floors);
                        return isNaN(numFloors) ? null : numFloors * 3;
                    })(),

                    // 1. 报告有效终止日期（报告日期加1年减1天） 在某些时区会被解析为本地时区的 2025-08-18 00:00:00 当调用 toISOString() 时，会转换为 UTC 时间（可能变成前一天的 16:00:00）
                    reportExpiryDate: (() => {
                        if (!reportgeneratorReportData.result.reportDate) return '';

                        return formatChineseDateSecondType(
                            dayjs(reportgeneratorReportData.result.reportDate)
                                .add(1, 'year')
                                .subtract(1, 'day')
                                .format('YYYY-MM-DD')
                        );
                    })(),

                    // 2. 评估总价小写（建筑面积×评估单价÷10000，四舍五入保留2位小数）
                    totalValuationPrice: (() => {
                        const buildingArea = parseFloat(reportgeneratorReportData.property.buildingArea) || 0;
                        const valuationPrice = parseFloat(reportgeneratorReportData.result.valuationPrice) || 0;
                        const totalPrice = (buildingArea * valuationPrice) / 10000;
                        return Math.round(totalPrice * 100) / 100; // 四舍五入保留2位小数
                    })(),


                    // 3. 评估总价大写（totalValuationPrice × 10000 的大写金额）
                    totalValuationPriceChinese: (() => {
                        const buildingArea = parseFloat(reportgeneratorReportData.property.buildingArea) || 0;
                        const valuationPrice = parseFloat(reportgeneratorReportData.result.valuationPrice) || 0;
                        const totalPrice = buildingArea * valuationPrice;

                        // 四舍五入到百元位（如123456 → 123500，123444 → 123400）
                        const roundedToHundred = Math.round(totalPrice / 100) * 100;

                        return convertCurrency(roundedToHundred); // 返回大写金额
                    })(),

                    //  4、判断是不动产书还是房地产权证书
                    propertyCertificateType: reportgeneratorReportData.property.propertyCertificateNo &&
                        reportgeneratorReportData.property.propertyCertificateNo.includes('不动产')
                        ? '不动产权证书'
                        : '房地产权证书',
                    // 5 土地剩余使用年限计算
                    landRemainingUsageYears: (() => {
                        if (reportgeneratorReportData.property.rightsNature === '划拨') return '-';

                        const valueDate = dayjs(reportgeneratorReportData.result.valueDate);
                        const landEndDate = dayjs(reportgeneratorReportData.property.landUseRightEndDate);

                        if (!valueDate.isValid() || !landEndDate.isValid()) return null;

                        // 精确计算年差（考虑闰年）
                        const diffInYears = landEndDate.diff(valueDate, 'day') / 365.2422;
                        return Math.round(diffInYears * 100) / 100;
                    })(),

                    // 6  公共服务设施汇总 新增 publicServices 字段，汇总 bank、supermarket、hospital、school
                    publicServices: (() => {
                        const { bank, supermarket, hospital, school } = reportgeneratorReportData.physicalCondition;
                        const services = [];

                        if (bank && bank.trim() !== '') services.push(bank);
                        if (supermarket && supermarket.trim() !== '') services.push(supermarket);
                        if (hospital && hospital.trim() !== '') services.push(hospital);
                        if (school && school.trim() !== '') services.push(school);

                        return services.join('、');
                    })(),

                    // 7. 新增家具家电相关字段（仅在hasFurnitureElectronics为true时有效）
                    ...(reportgeneratorReportData.result.hasFurnitureElectronics ? {
                        // 家具家电评估总价大写
                        furnitureElectronicsEstimatedPriceChinese: (() => {
                            const price = parseFloat(reportgeneratorReportData.result.furnitureElectronicsEstimatedPrice) || 0;
                            // 四舍五入到百元位
                            const roundedToHundred = Math.round(price / 100) * 100;
                            return convertCurrency(roundedToHundred);
                        })(),

                        // 包含家具家电的总评估价（小写）
                        totalValuationPriceWithFurniture: (() => {
                            const buildingArea = parseFloat(reportgeneratorReportData.property.buildingArea) || 0;
                            const valuationPrice = parseFloat(reportgeneratorReportData.result.valuationPrice) || 0;
                            const furniturePrice = parseFloat(reportgeneratorReportData.result.furnitureElectronicsEstimatedPrice) || 0;

                            // 房地产评估总价（万元）+ 家具家电评估总价（元转换为万元）
                            const totalPrice = (buildingArea * valuationPrice) / 10000 + furniturePrice / 10000;
                            return Math.round(totalPrice * 100) / 100; // 四舍五入保留2位小数
                        })(),

                        // 包含家具家电的总评估价（大写）
                        totalValuationPriceWithFurnitureChinese: (() => {
                            const buildingArea = parseFloat(reportgeneratorReportData.property.buildingArea) || 0;
                            const valuationPrice = parseFloat(reportgeneratorReportData.result.valuationPrice) || 0;
                            const furniturePrice = parseFloat(reportgeneratorReportData.result.furnitureElectronicsEstimatedPrice) || 0;

                            // 房地产评估总价 + 家具家电评估总价
                            const totalPrice = buildingArea * valuationPrice + furniturePrice;

                            // 四舍五入到百元位
                            const roundedToHundred = Math.round(totalPrice / 100) * 100;
                            return convertCurrency(roundedToHundred);
                        })()
                    } : {}),
                    // 8. 价值时点确认方式
                    valueDateDetermination: (() => {
                        const { valueDateRequirements } = reportgeneratorReportData.entrustment;
                        const { assessmentCommissionDocument, documentNo, entrustingParty } = reportgeneratorReportData.entrustment;
                        const valueDateUppercase = formatChineseDateFirstType(reportgeneratorReportData.result.valueDate);

                        if (valueDateRequirements === "未明确") {
                            return `根据《涉执房地产处置司法评估指导意见（试行）》，未明确价值时点的，一般以估价对象实地查勘完成之日作为价值时点，本次估价实地查勘日期为${valueDateUppercase}，故本次估价价值时点为${valueDateUppercase}。`;
                        } else {
                            return `根据《${entrustingParty}${assessmentCommissionDocument}》[${documentNo}]记载价值时点为${valueDateRequirements}，故本次价值时点确定为${valueDateRequirements}，即${valueDateUppercase}。`;
                        }
                    })(),
                    // 9 特别提示   权益状况   equityStatus equityInfo
                    combinedEquityStatus: (() => {
                        const { mortgageStatus, mortgageBasis, seizureStatus, seizureBasis } = reportgeneratorReportData.equityStatus || {};

                        // 修正：1 或 true 表示有抵押/查封
                        const hasMortgage = mortgageStatus === 1 || mortgageStatus === true;
                        const hasSeizure = seizureStatus === 1 || seizureStatus === true;

                        // 两者都没有
                        if (!hasMortgage && !hasSeizure) {
                            return "估价对象未设定抵押且未查封。";
                        }

                        let contentText = "";
                        let effectText = "";
                        let basisText = "";

                        // 生成依据文本的辅助函数
                        function getBasisDisplay(basis) {
                            if (!basis || basis === "无" || basis === "未提供" || basis === "委托人介绍") {
                                return { text: "估价委托人介绍", hasRecord: false };
                            }

                            if (basis.includes('《') && basis.includes('》')) {
                                return { text: `估价委托人提供的${basis}`, hasRecord: true };
                            } else {
                                return { text: `估价委托人提供的《${basis}》`, hasRecord: true };
                            }
                        }

                        if (hasMortgage && hasSeizure) {
                            // 既有抵押又有查封
                            contentText = "已设定抵押并查封";
                            effectText = "抵押权因素和查封因素";

                            const mortgageBasisInfo = getBasisDisplay(mortgageBasis);
                            const seizureBasisInfo = getBasisDisplay(seizureBasis);

                            if (mortgageBasis === seizureBasis) {
                                // 依据相同
                                basisText = mortgageBasisInfo.hasRecord ? `${mortgageBasisInfo.text}记载` : mortgageBasisInfo.text;
                            } else {
                                // 依据不同
                                const mortgageText = mortgageBasisInfo.text;
                                const seizureText = seizureBasisInfo.hasRecord ? `${seizureBasisInfo.text}记载` : seizureBasisInfo.text;
                                basisText = `${mortgageText}和${seizureText}`;
                            }
                        } else if (hasMortgage) {
                            // 只有抵押
                            contentText = "已设定抵押";
                            effectText = "抵押权因素";
                            const basisInfo = getBasisDisplay(mortgageBasis);
                            basisText = basisInfo.hasRecord ? `${basisInfo.text}记载` : basisInfo.text;
                        } else if (hasSeizure) {
                            // 只有查封
                            contentText = "已查封";
                            effectText = "查封因素";
                            const basisInfo = getBasisDisplay(seizureBasis);
                            basisText = basisInfo.hasRecord ? `${basisInfo.text}记载` : basisInfo.text;
                        }

                        return `根据${basisText}，估价对象${contentText}，本次估价未考虑${effectText}对估价结果产生的影响。`;
                    })(),
                    //10 他项权利 otherRights
                    otherRights: (() => {
                        const { mortgageStatus, mortgageBasis } = reportgeneratorReportData.equityStatus || {};

                        // 默认状态为1（无抵押）
                        const hasMortgage = mortgageStatus === 0 || mortgageStatus === false;

                        // 如果有抵押，不需要输出任何内容
                        if (hasMortgage) {
                            return "";
                        }

                        // 没有抵押的情况
                        if (!mortgageBasis || mortgageBasis === "无" || mortgageBasis === "未提供" || mortgageBasis === "委托人介绍") {
                            return "根据估价委托人介绍，至价值时点估价对象未设定有抵押权。";
                        } else {
                            let basisText = "";
                            if (mortgageBasis.includes('《') && mortgageBasis.includes('》')) {
                                basisText = `估价委托人提供的${mortgageBasis}`;
                            } else {
                                basisText = `估价委托人提供的《${mortgageBasis}》`;
                            }
                            return `根据${basisText}，至价值时点估价对象已办理抵押登记。`;
                        }
                    })(),
                    //11 租赁权 Leasehold
                    leasehold: (() => {
                        const { utilizationStatus } = reportgeneratorReportData.equityStatus || {};

                        if (utilizationStatus === "出租") {
                            return ""; // 输出空白
                        } else {
                            return "租赁权、"; // 输出租赁权
                        }
                    })(),
                };

                doc.render(allData);

                const out = doc.getZip().generate({
                    type: 'blob',
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                });

                saveAs(out, `房地产评估报告_${reportgeneratorReportData.entrustment.documentNo || new Date().toISOString().slice(0, 10)}.docx`);
            })
            .catch(error => {
                console.error('生成Word文档出错:', error);
                notify('生成报告失败，请检查模板文件是否存在', 'error');
                //alert('生成报告失败，请检查模板文件是否存在');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    /**
     * 处理表单输入变化
     */
    const reportgeneratorHandleInputChange = (section, field, value) => {
        // 特殊处理日期字段
        const dateFields = ['entrustDate', 'landUseRightEndDate', 'valueDate', 'reportDate'];

        if (dateFields.includes(field)) {
            // 如果值是 dayjs 对象，则格式化为字符串 则格式化为字符串（使用本地日期）
            const dateValue = value ? value.format('YYYY-MM-DD') : '';
            setReportgeneratorReportData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: dateValue
                }
            }));
        } else {
            setReportgeneratorReportData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        }
    };

    /**
     * 处理估价师选择变化
     */
    const reportgeneratorHandleAppraiserChange = (appraiser, selectedOption) => {
        setReportgeneratorReportData({
            ...reportgeneratorReportData,
            result: {
                ...reportgeneratorReportData.result,
                [`appraiser${appraiser}`]: {
                    name: selectedOption.AppraiserNameOptions || '',  // 修改为 AppraiserNameOptions
                    licenseNo: selectedOption.RegistrationNumberOptions || ''  // 修改为 RegistrationNumberOptions
                }
            }
        });
    };

    //添加百度处理保存周边信息的函数 传递location
    const handleSaveSurroundingInfo = (data) => {
        setReportgeneratorReportData(prev => ({
            ...prev,
            physicalCondition: {
                ...prev.physicalCondition,
                ...data
            }
        }));
        notify('周边信息已保存', 'success');
    };

    // 如果主题正在加载，显示加载状态
    // if (loading) {
    //     return <div className="reportgenerator-container">
    //         {/* 加载主题中... */}
    //         <WordReportGeneratorLoader />
    //     </div>;
    // }

    //添加跳转二维码 👇



    // 添加查看二维码的处理函数
    const handleViewQRCodeold = () => {
        if (!currentReportId) {
            notify('请先选择或创建报告', 'warning');
            return;
        }

        // 准备要传递的报告数据（只传递id和坐落）
        const reportData = {
            reportsID: currentReportId,
            //location: reportgeneratorReportData.property.location || '坐落？'
        };

        // 将数据编码为URL参数
        const queryParams = new URLSearchParams(reportData).toString();

        // 跳转到二维码页面
        // navigate(`/reportqrcodepage?${queryParams}`);


        // 拼接完整的二维码页面URL（基于当前项目的基础路径）
        const qrCodePageUrl = `${window.location.origin}/app/office/reportqrcodepage?${queryParams}`;

        // 新开页面跳转（_blank 表示新窗口）
        window.open(qrCodePageUrl, '_blank');

    };
    const handleViewQRCodeover = () => {
        if (!currentReportId) {
            notify('请先选择或创建报告', 'warning');
            return;
        }

        // 准备要传递的报告数据
        const reportData = {
            reportsID: currentReportId,
            // 确保 location 有值
            location: reportgeneratorReportData?.property?.location || '未知位置'
        };

        console.log('QR Code Data:', reportData); // 添加调试信息

        // 将数据编码为URL参数
        const queryParams = new URLSearchParams(reportData).toString();

        console.log('Query Params:', queryParams); // 调试查询参数

        // 拼接完整的二维码页面URL
        const qrCodePageUrl = `${window.location.origin}/app/office/reportqrcodepage?${queryParams}`;

        console.log('Full URL:', qrCodePageUrl); // 调试完整URL

        // 新开页面跳转
        window.open(qrCodePageUrl, '_blank');
    };
    const handleViewQRCode = async () => {
        if (!currentReportId) {
            notify('请先选择或创建报告', 'warning');
            return;
        }
    
        // 准备基础数据
        const location = reportgeneratorReportData?.property?.location || '未知位置';
    
        try {
            // 1. 调用后端 API 获取【加密后的ID字符串】
            const response = await fetch('/api/generateEncodedReportUrl', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reportsID: currentReportId,
                    location: location
                })
            });
    
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || '生成二维码链接失败');
            }
    
            const data = await response.json();
            const encodedId = data.encodedId; // 获取类似 "Alpha|Beta" 的字符串
    
            if (!encodedId) {
                throw new Error('未获取到加密ID');
            }
    
            console.log('Encoded ID:', encodedId);
    
            // 2. 【前端构建完整 URL】
            const baseUrl = `${window.location.origin}/app/office/reportqrcodepage`;
            
            // 使用 URLSearchParams 自动处理特殊字符编码 (| 会被编码为 %7C)
            const queryParams = new URLSearchParams({
                reportsID: encodedId,
                location: location
            });
    
            const qrCodePageUrl = `${baseUrl}?${queryParams.toString()}`;
    
            console.log('Generated Secure URL:', qrCodePageUrl);
    
            // 3. 新开页面跳转
            if (qrCodePageUrl) {
                window.open(qrCodePageUrl, '_blank');
            } else {
                notify('无法生成有效的二维码链接', 'error');
            }
    
        } catch (error) {
            console.error('Error generating QR code URL:', error);
            notify(error.message || '系统错误，请稍后重试', 'error');
        }
    };

    const handleViewUploadPicture = () => {
        if (!currentReportId) {
            notify('请先选择或创建报告', 'warning');
            return;
        }

        // 准备要传递的报告数据（只传递id和坐落）
        const reportData = {
            reportsID: currentReportId,
            location: reportgeneratorReportData.property.location || '坐落？'
        };

        // 将数据编码为URL参数
        const queryParams = new URLSearchParams(reportData).toString();

        // navigate(`/home/uploadhousepricepicture?${queryParams}`);

        // 拼接完整的二维码页面URL（基于当前项目的基础路径）
        const qrCodePageUrl = `${window.location.origin}/app/office/UploadHousePricePicture?${queryParams}`;

        // 新开页面跳转（_blank 表示新窗口）
        window.open(qrCodePageUrl, '_blank');

    };

    //添加跳转二维码 👆

    return (
        <ConfigProvider locale={zhCN}>
            <ConfirmationDialogManager>
                {(confirm) => (
                    <div className="reportgenerator-container"
                    // style={{
                    //     '--borderBrush': borderBrush,
                    //     '--hoverBorderBrush': hoverBorderBrush,
                    //     '--fontColor': fontColor,
                    //     '--hoverFontColor': hoverFontColor,
                    //     '--my-bg-color': background,
                    //     '--watermarkForeground': watermarkForeground,
                    //     '--fontFamily': fontFamily,
                    //     '--hoverBackground': hoverBackground,
                    // }}

                    >

                        {/* 添加通知管理器 */}
                        <NotificationManager ref={notificationRef} />
                        {/* 添加加载动画 */}
                        {isLoading && <WordReportGeneratorLoader />}
                        {/* 顶部导航栏 */}
                        <div className="reportgenerator-top-navigation">

                            {/* 在顶部导航栏中使用计时器组件 */}
                            {showTimer && (
                                <Reporttimer
                                    isRunning={isTimerRunning}
                                    onTimeUpdate={handleTimeUpdate}
                                    reset={resetTimer}
                                    className="reporttimer-small"
                                />
                            )}

                            {/* 搜索框 */}
                            <div className="reportgenerator-search-box">
                                <input
                                    type="text"
                                    placeholder="关键字搜索..."
                                    value={reportgeneratorSearchTerm}
                                    onChange={(e) => setReportgeneratorSearchTerm(e.target.value)}
                                    className="reportgenerator-search-input reportgenerator-search-input-key"
                                    onKeyPress={(e) => e.key === 'Enter' && reportgeneratorSearchReports()}
                                />
                                <button
                                    className="reportgenerator-search-button"
                                    onClick={() => {
                                        if (!reportgeneratorSearchTerm.trim()) {
                                            notify('请输入搜索关键词', 'warning');
                                            return;
                                        }
                                        reportgeneratorSearchReports();
                                    }}
                                    title='搜索'
                                >
                                    <svg className="reportgenerator-search-icon" aria-hidden="true">
                                        <use xlinkHref="#icon-fangdajing2" />
                                    </svg>
                                </button>
                            </div>

                            {/* 悬浮菜单 */}
                            <div className="reportgenerator-menu-box" ref={menuRef} title='更多设置'>
                                {/* 菜单按钮 */}
                                <div
                                    className="reportgenerator-menu-button"
                                    // onClick={() => {
                                    //     const menuBox = document.querySelector('.reportgenerator-menu-box');
                                    //     menuBox.classList.toggle('reportgenerator-active');
                                    // }}
                                    onClick={handleMenuButtonClick}
                                >
                                    <div className="reportgenerator-line-box">
                                        <div className="reportgenerator-line"></div>
                                        <div className="reportgenerator-line"></div>
                                        <div className="reportgenerator-line"></div>
                                    </div>
                                </div>

                                {/* 菜单列表 */}
                                <ul className="reportgenerator-menu-list">
                                    {/* 保存按钮 */}
                                    <li
                                        onClick={() => {
                                            reportgeneratorSaveReport(confirm);
                                            document.querySelector('.reportgenerator-menu-box').classList.remove('reportgenerator-active');
                                        }}
                                        title="保存"
                                    >
                                        <svg className="reportgenerator-menu-icon" aria-hidden="true">
                                            <use xlinkHref="#icon-baocun1" />
                                        </svg>
                                        <span>保存</span>
                                    </li>

                                    {/* 删除按钮 */}
                                    <li
                                        onClick={() => {
                                            if (!currentReportId) return;
                                            reportgeneratorDeleteReport(confirm);
                                            document.querySelector('.reportgenerator-menu-box').classList.remove('reportgenerator-active');
                                        }}
                                        className={!currentReportId ? "reportgenerator-disabled" : ""}
                                        title={!currentReportId ? "无可用报告" : "删除"}
                                    >
                                        <svg className="reportgenerator-menu-icon" aria-hidden="true">
                                            <use xlinkHref="#icon-shanchu11" />
                                        </svg>
                                        <span>删除</span>
                                    </li>

                                    {/* 下载按钮 */}
                                    <li
                                        onClick={() => {
                                            if (!reportgeneratorReportData.result.valueDate ||
                                                !reportgeneratorReportData.result.reportDate ||
                                                !reportgeneratorReportData.result.appraiserA.name) return;
                                            reportgeneratorGenerateWordDocument();
                                            document.querySelector('.reportgenerator-menu-box').classList.remove('reportgenerator-active');
                                        }}
                                        className={!reportgeneratorReportData.result.valueDate ||
                                            !reportgeneratorReportData.result.reportDate ||
                                            !reportgeneratorReportData.result.appraiserA.name ? "reportgenerator-disabled" : ""}
                                        title={!reportgeneratorReportData.result.valueDate ||
                                            !reportgeneratorReportData.result.reportDate ||
                                            !reportgeneratorReportData.result.appraiserA.name ? "请先填写必要信息" : "下载报告"}
                                    >
                                        <svg className="reportgenerator-menu-icon" aria-hidden="true">
                                            <use xlinkHref="#icon-xiazaiwenjian1" />
                                        </svg>
                                        <span>下载</span>
                                    </li>
                                    {/* 开始/暂停计时切换按钮 */}
                                    <li onClick={handleToggleTimer} title={isTimerRunning ? "暂停计时" : "开始计时"}>
                                        <svg className="reportgenerator-menu-icon" aria-hidden="true">
                                            <use xlinkHref={isTimerRunning ? "#icon-jieshu" : "#icon-tingzhi1"} />
                                        </svg>
                                        <span>{isTimerRunning ? "暂停" : "开始"}</span>
                                    </li>
                                    {/* 清零计时按钮 */}
                                    <li onClick={handleResetTimer} title="清零计时">
                                        <svg className="reportgenerator-menu-icon" aria-hidden="true">
                                            <use xlinkHref="#icon-qingling" />
                                        </svg>
                                        <span>清零</span>
                                    </li>
                                    {/* 停止计时按钮 */}
                                    <li onClick={handleStopTimer} title="停止计时">
                                        <svg className="reportgenerator-menu-icon" aria-hidden="true">
                                            <use xlinkHref="#icon-jieshu2" />
                                        </svg>
                                        <span>停止</span>
                                    </li>


                                    <li
                                        onClick={handleMenuItemClick(handleViewQRCode)}
                                        title={!currentReportId ? "请先选择报告" : "查看二维码"}
                                        className={!currentReportId ? "reportgenerator-disabled" : ""}
                                    >
                                        <svg className="reportgenerator-menu-icon" aria-hidden="true">
                                            <use xlinkHref="#icon-1_huaban1" />
                                        </svg>
                                        <span>二维码</span>
                                    </li>

                                    <li
                                        onClick={handleMenuItemClick(handleViewUploadPicture)}
                                        title={!currentReportId ? "请先选择报告" : "上传照片"}
                                        className={!currentReportId ? "reportgenerator-disabled" : ""}
                                    >
                                        <svg className="reportgenerator-menu-icon" aria-hidden="true">
                                            <use xlinkHref="#icon-shangchuantupianicon" />
                                        </svg>
                                        <span>上传图片</span>
                                    </li>


                                    <li
                                        onClick={handleMenuItemClick(handleViewReportPreview)}
                                        title="报告预览"
                                    >
                                        <svg className="reportgenerator-menu-icon" aria-hidden="true">
                                            <use xlinkHref="#icon-docx" />
                                        </svg>
                                        <span>报告预览</span>
                                    </li>

                                    {/* {currentReportId ? (
                                        <Link
                                            to={`/reportqrcodepage?reportsID=${encodeURIComponent(currentReportId)}&location=${encodeURIComponent(reportgeneratorReportData.property.location || '未设置房产坐落')}`}
                                            title="查看二维码"
                                            className="reportgenerator-menu-link"
                                        >
                                            <svg className="reportgenerator-menu-icon" aria-hidden="true">
                                                <use xlinkHref="#icon-RectangleCopy18"></use>
                                            </svg>
                                            <span>二维码</span>
                                        </Link>
                                    ) : (
                                        <li
                                            className="reportgenerator-disabled"
                                            title="请先选择报告"
                                            onClick={() => notify('请先选择或创建报告', 'warning')}
                                        >
                                            <svg className="reportgenerator-menu-icon" aria-hidden="true">
                                                <use xlinkHref="#icon-RectangleCopy18"></use>
                                            </svg>
                                            <span>二维码</span>
                                        </li>
                                    )} */}

                                </ul>
                            </div>
                        </div>

                        {/* 搜索结果模态框 */}
                        {showSearchResults && reportgeneratorReportList.length > 0 && (
                            <div className="reportgenerator-search-modal">
                                <div className="reportgenerator-search-modal-content">
                                    <div className="reportgenerator-search-modal-header">
                                        <h3 className="reportgenerator-search-modal-title">搜索结果</h3>
                                        <button
                                            className="reportgenerator-search-modal-close"
                                            onClick={() => setShowSearchResults(false)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <ul className="reportgenerator-search-results-list">
                                        {reportgeneratorReportList.map((report, index) => (
                                            <li
                                                key={report.reportsID}
                                                className={`reportgenerator-search-result-item ${currentReportId === report.reportsID ? 'reportgenerator-result-active' : ''}`}
                                                onClick={() => loadReportData(report)}
                                            >
                                                <div className="reportgenerator-search-result-index">
                                                    {index + 1}.
                                                </div>
                                                <div className="reportgenerator-search-result-content">
                                                    {/* 第一行：location和communityName */}
                                                    <div className="reportgenerator-search-result-row reportgenerator-search-result-row-title">
                                                        <span className="reportgenerator-search-result-location">
                                                            {report.location || '无坐落信息'}
                                                        </span>
                                                        <span className="reportgenerator-search-result-community">
                                                            {report.communityName || '无小区名称'}
                                                        </span>
                                                    </div>
                                                    {/* 第二行：documentNo和entrustDate */}
                                                    <div className="reportgenerator-search-result-row">
                                                        <span className="reportgenerator-search-result-documentNo">
                                                            {report.documentNo ? ` ${report.documentNo}` : '无委托书号'}
                                                        </span>
                                                        <span className="reportgenerator-search-result-entrust-date">
                                                            {report.entrustDate ? `${new Date(report.entrustDate).toLocaleDateString()}` : '无委托日期'}
                                                        </span>
                                                    </div>
                                                    {/* 第三行：projectID、reportID、reportDate */}
                                                    <div className="reportgenerator-search-result-row">
                                                        <span className="reportgenerator-search-result-project">
                                                            {report.projectID ? `${report.projectID}` : '无项目编号'}
                                                        </span>
                                                        <span className="reportgenerator-search-result-reportid">
                                                            {report.reportID ? ` ${report.reportID}` : '无报告编号'}
                                                        </span>
                                                        <span className="reportgenerator-search-result-date">
                                                            {report.reportDate ? ` ${new Date(report.reportDate).toLocaleDateString()}` : '无报告日期'}
                                                        </span>
                                                    </div>


                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    {/* 在搜索结果模态框内容底部添加分页 */}
                                    <div className="reportgenerator-pagination">
                                        <div className="reportgenerator-pagination-info">
                                            共 {Math.ceil(totalReports / pageSize)} 页
                                        </div>

                                        <div className="reportgenerator-pagination-controls">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                            >
                                                &lt;
                                            </button>

                                            {/* 显示页码按钮 */}
                                            {Array.from({ length: Math.min(9, Math.ceil(totalReports / pageSize)) }, (_, i) => {
                                                const pageNum = i + 1;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={currentPage === pageNum ? 'active' : ''}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}

                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalReports / pageSize)))}
                                                disabled={currentPage === Math.ceil(totalReports / pageSize)}
                                            >
                                                &gt;
                                            </button>
                                        </div>

                                        <div className="reportgenerator-page-size-selector">
                                            <select
                                                value={pageSize}
                                                onChange={(e) => {
                                                    setPageSize(Number(e.target.value));
                                                    setCurrentPage(1); // 切换每页条数时回到第一页
                                                }}
                                            >
                                                <option value={10}>10条/页</option>
                                                <option value={20}>20条/页</option>
                                                <option value={50}>50条/页</option>
                                                <option value={100}>100条/页</option>
                                            </select>
                                        </div>

                                        <div className="reportgenerator-page-jump">
                                            <span>跳至</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max={Math.ceil(totalReports / pageSize)}
                                                value={currentPage}
                                                onChange={(e) => setCurrentPage(Math.min(Math.max(1, Number(e.target.value)), Math.ceil(totalReports / pageSize)))}
                                            />
                                            <span>页</span>
                                        </div>
                                    </div>
                                </div>



                            </div>
                        )}

                        {/* 主内容区 */}
                        <div className="reportgenerator-main-content"
                        >
                            {/* Tab导航栏 */}
                            <div className="reportgenerator-tab-navigation"
                            >
                                <button
                                    className={`reportgenerator-tab-button ${reportgeneratorActiveTab === 'entrustment' ? 'reportgenerator-active' : ''}`}
                                    onClick={() => setReportgeneratorActiveTab('entrustment')}
                                >
                                    委托书信息
                                </button>
                                <button
                                    className={`reportgenerator-tab-button ${reportgeneratorActiveTab === 'property' ? 'reportgenerator-active' : ''}`}
                                    onClick={() => setReportgeneratorActiveTab('property')}
                                >
                                    产权信息
                                </button>
                                <button
                                    className={`reportgenerator-tab-button ${reportgeneratorActiveTab === 'physicalCondition' ? 'reportgenerator-active' : ''}`}
                                    onClick={() => setReportgeneratorActiveTab('physicalCondition')}
                                >
                                    实物状况
                                </button>
                                <button
                                    className={`reportgenerator-tab-button ${reportgeneratorActiveTab === 'result' ? 'reportgenerator-active' : ''}`}
                                    onClick={() => setReportgeneratorActiveTab('result')}
                                >
                                    结果信息
                                </button>
                                <button
                                    className={`reportgenerator-tab-button ${reportgeneratorActiveTab === 'equityStatus' ? 'reportgenerator-active' : ''}`}
                                    onClick={() => setReportgeneratorActiveTab('equityStatus')}
                                >
                                    权益状况
                                </button>
                            </div>

                            {/* 委托书信息内容 */}
                            {reportgeneratorActiveTab === 'entrustment' && (
                                <div className="reportgenerator-tab-content">
                                    {/* <h2 className="reportgenerator-section-title">委托书信息</h2> */}
                                    {/* 委托方 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"  >委托方:</label>
                                        <input
                                            type="text"
                                            value={reportgeneratorReportData.entrustment.entrustingParty}
                                            onChange={(e) => reportgeneratorHandleInputChange('entrustment', 'entrustingParty', e.target.value)}
                                            className="reportgenerator-form-input-inline"

                                            placeholder="请输入委托单位/个人名称"
                                            required
                                        />
                                    </div>
                                    {/* 评估委托文书（选项值） */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >委托类型:</label>
                                        <select
                                            value={reportgeneratorReportData.entrustment.assessmentCommissionDocument || ""}
                                            onChange={(e) => reportgeneratorHandleInputChange('entrustment', 'assessmentCommissionDocument', e.target.value)}
                                            className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.entrustment.assessmentCommissionDocument ? "placeholder-style" : ""
                                                }`}
                                            required

                                        >
                                            <option value="" disabled
                                            >请选择委托文书 </option>
                                            {Array.from(new Set(
                                                reportgeneratorAppraiserOptions
                                                    .map(option => option.assessmentCommissionDocumentOptions)
                                                    .filter(Boolean)
                                            )).map((purpose, index) => (
                                                <option key={`assessmentCommissionDocument-${index}`} value={purpose}>
                                                    {purpose}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* 价值时点要求 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >时点要求 :</label>
                                        <select
                                            value={reportgeneratorReportData.entrustment.valueDateRequirements || ""}
                                            onChange={(e) => reportgeneratorHandleInputChange('entrustment', 'valueDateRequirements', e.target.value)}
                                            className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.entrustment.valueDateRequirements ? "placeholder-style" : ""
                                                }`}
                                            required

                                        >
                                            <option value="" disabled>价值时点要求 </option>
                                            {Array.from(new Set(
                                                reportgeneratorAppraiserOptions
                                                    .map(option => option.valueDateRequirementsOptions)
                                                    .filter(Boolean)
                                            )).map((purpose, index) => (
                                                <option key={`valueDateRequirements-${index}`} value={purpose}>
                                                    {purpose}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* 委托书号 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >委托书号:</label>
                                        <input
                                            type="text"
                                            value={reportgeneratorReportData.entrustment.documentNo}
                                            onChange={(e) => reportgeneratorHandleInputChange('entrustment', 'documentNo', e.target.value)}
                                            className="reportgenerator-form-input-inline"
                                            placeholder="请输入委托书编号"
                                            required

                                        />
                                    </div>

                                    {/* 委托日期 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >委托日期:</label>
                                        <DatePicker
                                            value={reportgeneratorReportData.entrustment.entrustDate ?
                                                dayjs(reportgeneratorReportData.entrustment.entrustDate) : null}
                                            onChange={(date) => reportgeneratorHandleInputChange('entrustment', 'entrustDate', date)}
                                            format="YYYY年M月D日"
                                            className="reportgenerator-form-input-inline"
                                            placeholder="请选择委托日期"

                                        />
                                    </div>



                                </div>
                            )}

                            {/* 产权信息内容 */}
                            {reportgeneratorActiveTab === 'property' && (
                                <div className="reportgenerator-tab-content"
                                >
                                    {/* <h2 className="reportgenerator-section-title">产权信息</h2> */}
                                    {/* 产权证号 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"  >产权证号:</label>
                                        <input
                                            type="text"
                                            value={reportgeneratorReportData.property.propertyCertificateNo}
                                            onChange={(e) => reportgeneratorHandleInputChange('property', 'propertyCertificateNo', e.target.value)}
                                            className="reportgenerator-form-input-inline"
                                            placeholder="请输入产权证号"
                                            required

                                        />
                                    </div>
                                    {/* 权利人 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >权利人:</label>
                                        <input
                                            type="text"
                                            value={reportgeneratorReportData.property.rightsHolder}
                                            onChange={(e) => reportgeneratorHandleInputChange('property', 'rightsHolder', e.target.value)}
                                            className="reportgenerator-form-input-inline"
                                            placeholder="请输入权利人姓名"
                                            required

                                        />
                                    </div>
                                    {/* 共有情况 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"

                                        >共有情况 :</label>
                                        <select
                                            value={reportgeneratorReportData.property.coOwnershipStatus || ""}
                                            onChange={(e) => reportgeneratorHandleInputChange('property', 'coOwnershipStatus', e.target.value)}
                                            className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.property.coOwnershipStatus ? "placeholder-style" : ""
                                                }`}
                                            required


                                        >
                                            <option value="" disabled>请选择共有情况 </option>
                                            {Array.from(new Set(
                                                reportgeneratorAppraiserOptions
                                                    .map(option => option.coOwnershipStatusOptions)
                                                    .filter(Boolean)
                                            )).map((purpose, index) => (
                                                <option key={`coOwnershipStatus-${index}`} value={purpose}>
                                                    {purpose}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* 坐落 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >坐落:</label>
                                        <input
                                            type="text"
                                            value={reportgeneratorReportData.property.location}
                                            onChange={(e) => reportgeneratorHandleInputChange('property', 'location', e.target.value)}
                                            className="reportgenerator-form-input-inline"
                                            placeholder="请输入房产坐落地址"
                                            required

                                        />
                                    </div>
                                    {/* 不动产单元号 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >不动产单元号:</label>
                                        <input
                                            type="text"
                                            value={reportgeneratorReportData.property.propertyUnitNo}
                                            onChange={(e) => reportgeneratorHandleInputChange('property', 'propertyUnitNo', e.target.value)}
                                            className="reportgenerator-form-input-inline"
                                            placeholder="请输入不动产单元号"
                                            required

                                        />
                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 权利性质 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >权利性质 :</label>
                                            <select
                                                value={reportgeneratorReportData.property.rightsNature || ""}
                                                onChange={(e) => reportgeneratorHandleInputChange('property', 'rightsNature', e.target.value)}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.property.rightsNature ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="" disabled>请选择权利性质 </option>
                                                {Array.from(new Set(
                                                    reportgeneratorAppraiserOptions
                                                        .map(option => option.rightsNatureOptions)
                                                        .filter(Boolean)
                                                )).map((purpose, index) => (
                                                    <option key={`rightsNature-${index}`} value={purpose}>
                                                        {purpose}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* 房屋结构 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >房屋结构 :</label>
                                            <select
                                                value={reportgeneratorReportData.property.houseStructure || ""}
                                                onChange={(e) => reportgeneratorHandleInputChange('property', 'houseStructure', e.target.value)}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.property.houseStructure ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="" disabled>请选择房屋结构 </option>
                                                {Array.from(new Set(
                                                    reportgeneratorAppraiserOptions
                                                        .map(option => option.houseStructureOptions)
                                                        .filter(Boolean)
                                                )).map((purpose, index) => (
                                                    <option key={`houseStructure-${index}`} value={purpose}>
                                                        {purpose}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 土地用途 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >土地用途 :</label>
                                            <select
                                                value={reportgeneratorReportData.property.landPurpose || ""}
                                                onChange={(e) => reportgeneratorHandleInputChange('property', 'landPurpose', e.target.value)}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.property.landPurpose ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="" disabled>请选择土地用途 </option>
                                                {Array.from(new Set(
                                                    reportgeneratorAppraiserOptions
                                                        .map(option => option.landPurposeOptions)
                                                        .filter(Boolean)
                                                )).map((purpose, index) => (
                                                    <option key={`landPurpose-${index}`} value={purpose}>
                                                        {purpose}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* 房屋用途 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >房屋用途:</label>
                                            <select
                                                value={reportgeneratorReportData.property.housePurpose || ""}
                                                onChange={(e) => reportgeneratorHandleInputChange('property', 'housePurpose', e.target.value)}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.property.housePurpose ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="" disabled>请选择房屋用途</option>
                                                {Array.from(new Set(
                                                    reportgeneratorAppraiserOptions
                                                        .map(option => option.housePurposeOptions)
                                                        .filter(Boolean)
                                                )).map((purpose, index) => (
                                                    <option key={`housePurpose-${index}`} value={purpose}>
                                                        {purpose}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 共有宗地面积 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >共有宗地(m²):</label>
                                            <input
                                                type="number"
                                                value={reportgeneratorReportData.property.sharedLandArea}
                                                onChange={(e) => reportgeneratorHandleInputChange('property', 'sharedLandArea', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                min="0"
                                                step="0.01"
                                                placeholder="请输入共有宗地面积"
                                                required

                                            />
                                        </div>
                                        {/* 建筑面积 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >建筑面积(m²):</label>
                                            <input
                                                type="number"
                                                value={reportgeneratorReportData.property.buildingArea}
                                                onChange={(e) => reportgeneratorHandleInputChange('property', 'buildingArea', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                min="0"
                                                step="0.01"
                                                placeholder="请输入建筑面积"
                                            />
                                        </div>
                                    </div>
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 土地使用权终止日期 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >土地终止日期:</label>
                                            <DatePicker
                                                value={reportgeneratorReportData.property.landUseRightEndDate ?
                                                    dayjs(reportgeneratorReportData.property.landUseRightEndDate) : null}
                                                onChange={(date) => reportgeneratorHandleInputChange('property', 'landUseRightEndDate', date)}
                                                format="YYYY年M月D日"
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请选择土地终止日期"
                                                required

                                            />
                                        </div>
                                        {/* 套内面积 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >套内面积(m²):</label>
                                            <input
                                                type="number"
                                                value={reportgeneratorReportData.property.interiorArea}
                                                onChange={(e) => reportgeneratorHandleInputChange('property', 'interiorArea', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                min="0"
                                                step="1"
                                                title='未记载的直接填写：0'
                                                placeholder="请选择套内面积"
                                            />
                                        </div>
                                    </div>



                                </div>
                            )}

                            {/* 实物状况内容 */}
                            {reportgeneratorActiveTab === 'physicalCondition' && (
                                <div className="reportgenerator-tab-content"
                                >
                                    {/* <h2 className="reportgenerator-section-title">实物状况</h2> */}
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 小区名称 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >名称:</label>
                                            <input
                                                type="text"
                                                value={reportgeneratorReportData.physicalCondition.communityName}
                                                onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'communityName', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请输入小区名称"
                                                required

                                            />
                                        </div>
                                        {/* 建成年份 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >年代:</label>
                                            <select
                                                value={reportgeneratorReportData.physicalCondition.yearBuilt}
                                                onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'yearBuilt', e.target.value)}
                                                c
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.physicalCondition.yearBuilt ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="" disabled>请选择年份</option>
                                                {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => {
                                                    const year = new Date().getFullYear() - i;
                                                    return (
                                                        <option key={year} value={year}>
                                                            {year}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 总层数 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >总层数:</label>
                                            <input
                                                type="number"
                                                value={reportgeneratorReportData.physicalCondition.totalFloors}
                                                onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'totalFloors', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                min="1"
                                                required
                                                placeholder="请输入总层数"
                                            />
                                        </div>

                                        {/* 所在楼层 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >楼层:</label>
                                            <input
                                                type="number"
                                                value={reportgeneratorReportData.physicalCondition.floorNumber}
                                                onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'floorNumber', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                min="1"
                                                required
                                                placeholder="请输入所在楼层"
                                            />
                                        </div>
                                    </div>
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 电梯 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >电梯:</label>
                                            <div className="reportgenerator-toggle-switch">
                                                <input
                                                    type="radio"
                                                    id="elevator-yes"
                                                    name="elevator"
                                                    checked={reportgeneratorReportData.physicalCondition.elevator === true}
                                                    onChange={() => reportgeneratorHandleInputChange('physicalCondition', 'elevator', true)}
                                                    className="reportgenerator-toggle-input"

                                                />
                                                <label htmlFor="elevator-yes" className="reportgenerator-toggle-option reportgenerator-toggle-option-left">有</label>

                                                <input
                                                    type="radio"
                                                    id="elevator-no"
                                                    name="elevator"
                                                    checked={reportgeneratorReportData.physicalCondition.elevator === false}
                                                    onChange={() => reportgeneratorHandleInputChange('physicalCondition', 'elevator', false)}
                                                    className="reportgenerator-toggle-input"
                                                />
                                                <label htmlFor="elevator-no" className="reportgenerator-toggle-option reportgenerator-toggle-option-right">无</label>

                                                <span className="reportgenerator-toggle-selection"></span>
                                            </div>
                                        </div>

                                        {/* 通气 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >通气:</label>
                                            <div className="reportgenerator-toggle-switch">
                                                <input
                                                    type="radio"
                                                    id="ventilation-yes"
                                                    name="ventilation"
                                                    checked={reportgeneratorReportData.physicalCondition.ventilationStatus === true}
                                                    onChange={() => reportgeneratorHandleInputChange('physicalCondition', 'ventilationStatus', true)}
                                                    className="reportgenerator-toggle-input"
                                                />
                                                <label htmlFor="ventilation-yes" className="reportgenerator-toggle-option reportgenerator-toggle-option-left">有</label>

                                                <input
                                                    type="radio"
                                                    id="ventilation-no"
                                                    name="ventilation"
                                                    checked={reportgeneratorReportData.physicalCondition.ventilationStatus === false}
                                                    onChange={() => reportgeneratorHandleInputChange('physicalCondition', 'ventilationStatus', false)}
                                                    className="reportgenerator-toggle-input"
                                                />
                                                <label htmlFor="ventilation-no" className="reportgenerator-toggle-option reportgenerator-toggle-option-right">无</label>

                                                <span className="reportgenerator-toggle-selection"></span>
                                            </div>
                                        </div>
                                    </div>


                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 空间布局 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >户型:</label>
                                            <input
                                                type="text"
                                                value={reportgeneratorReportData.physicalCondition.spaceLayout}
                                                onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'spaceLayout', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请输入空间布局"
                                                title="例如：平层三室两厅一厨两卫"
                                                required

                                            />
                                        </div>
                                        {/* 朝向 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >朝向 :</label>
                                            <select
                                                value={reportgeneratorReportData.physicalCondition.orientation || ""}
                                                onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'orientation', e.target.value)}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.physicalCondition.orientation ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="" disabled>请选择朝向 </option>
                                                {Array.from(new Set(
                                                    reportgeneratorAppraiserOptions
                                                        .map(option => option.orientationOptions)
                                                        .filter(Boolean)
                                                )).map((purpose, index) => (
                                                    <option key={`orientation-${index}`} value={purpose}>
                                                        {purpose}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>


                                    </div>
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 土地形状 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >形状 :</label>
                                            <select
                                                value={reportgeneratorReportData.physicalCondition.landShape || ""}
                                                onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'landShape', e.target.value)}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.physicalCondition.landShape ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="" disabled>请选择土地形状 </option>
                                                {Array.from(new Set(
                                                    reportgeneratorAppraiserOptions
                                                        .map(option => option.landShapeOptions)
                                                        .filter(Boolean)
                                                )).map((purpose, index) => (
                                                    <option key={`landShape-${index}`} value={purpose}>
                                                        {purpose}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 外墙面 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            {/* <label className="reportgenerator-field-label">外墙 :</label> */}
                                            <label
                                                className="reportgenerator-field-label reportgenerator-field-label-showHandBaiduDataGrabber"
                                                onDoubleClick={(e) => {
                                                    e.preventDefault();
                                                    if (reportgeneratorReportData.property.location) {
                                                        setShowBaiduDataGrabber(true);
                                                    } else {
                                                        notify('请先填写房产坐落', 'warning');
                                                    }
                                                }}
                                                title={!reportgeneratorReportData.property.location ? "请先填写房产坐落" : "双击自动获取周边配套"}
                                                style={{
                                                    cursor: reportgeneratorReportData.property.location ? 'pointer' : 'not-allowed',
                                                    userSelect: 'none',

                                                }}


                                            >
                                                外墙:
                                            </label>
                                            <select
                                                value={reportgeneratorReportData.physicalCondition.exteriorWallMaterial || ""}
                                                onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'exteriorWallMaterial', e.target.value)}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.physicalCondition.exteriorWallMaterial ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="" disabled>请选择外墙面 </option>
                                                {Array.from(new Set(
                                                    reportgeneratorAppraiserOptions
                                                        .map(option => option.exteriorWallMaterialOptions)
                                                        .filter(Boolean)
                                                )).map((purpose, index) => (
                                                    <option key={`exteriorWallMaterial-${index}`} value={purpose}>
                                                        {purpose}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 临街状况 */}
                                        <div className="reportgenerator-form-field-vertical-container ">
                                            <label className="reportgenerator-field-label"
                                            >临街:</label>

                                            <input
                                                type="text"
                                                value={reportgeneratorReportData.physicalCondition.streetStatus}
                                                onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'streetStatus', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请输入临街状况"
                                                title="例如：临滨江路"
                                                required

                                            />
                                        </div>
                                        {/* 方位 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label
                                                className="reportgenerator-field-label reportgenerator-field-label-showHandBaiduDataGrabber"
                                                onDoubleClick={(e) => {
                                                    e.preventDefault();
                                                    if (reportgeneratorReportData.property.location) {
                                                        setShowHandBaiduDataGrabber(true);
                                                    } else {
                                                        notify('请先填写房产坐落', 'warning');
                                                    }
                                                }}
                                                title={!reportgeneratorReportData.property.location ? "请先填写房产坐落" : "双击手动获取周边配套"}
                                                style={{
                                                    cursor: reportgeneratorReportData.property.location ? 'pointer' : 'not-allowed',
                                                    userSelect: 'none',




                                                }}

                                            >
                                                方位:
                                            </label>
                                            <input
                                                type="text"
                                                value={reportgeneratorReportData.physicalCondition.direction}
                                                onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'direction', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请输入方位"
                                                title="例如：滨江路西侧"
                                                required

                                            />
                                        </div>
                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 距离 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >距离:</label>
                                            <input
                                                type="text"
                                                value={reportgeneratorReportData.physicalCondition.distance}
                                                onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'distance', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请输入距重要场所距离"
                                                title="例如：距轻轨环线海峡路站3号口约500米"
                                                required

                                            />
                                        </div>
                                        {/* 四至 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >四至:</label>
                                            <input
                                                type="text"
                                                value={reportgeneratorReportData.physicalCondition.boundaries}
                                                onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'boundaries', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请输入四至"
                                                required

                                            />
                                        </div>
                                    </div>
                                    {/* 停车状况 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >停车 :</label>
                                        <select
                                            value={reportgeneratorReportData.physicalCondition.parkingStatus || ""}
                                            onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'parkingStatus', e.target.value)}
                                            className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.physicalCondition.parkingStatus ? "placeholder-style" : ""
                                                }`}
                                            required

                                        >
                                            <option value="" disabled>请选择停车状况 </option>
                                            {Array.from(new Set(
                                                reportgeneratorAppraiserOptions
                                                    .map(option => option.parkingStatusOptions)
                                                    .filter(Boolean)
                                            )).map((purpose, index) => (
                                                <option key={`parkingStatus-${index}`} value={purpose}>
                                                    {purpose}
                                                </option>
                                            ))}
                                        </select>

                                    </div>

                                    {/* 装饰装修 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label
                                            className="reportgenerator-field-label"
                                            onDoubleClick={() => {
                                                if (!reportgeneratorReportData.physicalCondition.decorationStatus) {
                                                    reportgeneratorHandleInputChange(
                                                        'physicalCondition',
                                                        'decorationStatus',
                                                        '入户门防盗门，铝合金窗；室内客厅地面地砖，墙面墙布，天棚吊顶，卧室地面木地板，墙面墙布，天棚刷漆，厨卫：地面地砖，墙砖到顶，扣板吊顶'
                                                    );
                                                }
                                            }}

                                        >
                                            装修:
                                        </label>
                                        <textarea
                                            value={reportgeneratorReportData.physicalCondition.decorationStatus}
                                            onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'decorationStatus', e.target.value)}
                                            className="reportgenerator-form-input-inline reportgenerator-form-input-inline-textarea"
                                            placeholder="请输入装饰装修情况"
                                            title="入户门防盗门，铝合金窗；室内客厅地面地砖，墙面墙布，天棚吊顶，卧室地面木地板，墙面墙布，天棚刷漆，厨卫：地面地砖，墙砖到顶，扣板吊顶"
                                            required

                                        />
                                    </div>
                                    {/* 银行 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >银行:</label>
                                        <textarea
                                            value={reportgeneratorReportData.physicalCondition.bank}
                                            onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'bank', e.target.value)}
                                            className="reportgenerator-form-input-inline  reportgenerator-form-input-inline-textarea"
                                            placeholder="请输入周边银行"
                                            required

                                        />
                                    </div>
                                    {/* 超市 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >超市:</label>
                                        <textarea
                                            value={reportgeneratorReportData.physicalCondition.supermarket}
                                            onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'supermarket', e.target.value)}
                                            className="reportgenerator-form-input-inline  reportgenerator-form-input-inline-textarea"
                                            placeholder="请输入周边超市"
                                            required

                                        />
                                    </div>
                                    {/* 医院 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >医院:</label>
                                        <textarea
                                            value={reportgeneratorReportData.physicalCondition.hospital}
                                            onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'hospital', e.target.value)}
                                            className="reportgenerator-form-input-inline  reportgenerator-form-input-inline-textarea"
                                            placeholder="请输入周边医院"
                                            required

                                        />
                                    </div>
                                    {/* 学校 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >学校:</label>
                                        <textarea
                                            value={reportgeneratorReportData.physicalCondition.school}
                                            onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'school', e.target.value)}
                                            className="reportgenerator-form-input-inline  reportgenerator-form-input-inline-textarea"
                                            placeholder="请输入周边学校"
                                            required

                                        />
                                    </div>
                                    {/* 附近小区 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >小区:</label>
                                        <textarea
                                            value={reportgeneratorReportData.physicalCondition.nearbyCommunity}
                                            onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'nearbyCommunity', e.target.value)}
                                            className="reportgenerator-form-input-inline  reportgenerator-form-input-inline-textarea"
                                            placeholder="请输入周边附近小区"
                                            required

                                        />
                                    </div>
                                    {/* 公交站名 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >公交:</label>
                                        <textarea
                                            value={reportgeneratorReportData.physicalCondition.busStopName}
                                            onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'busStopName', e.target.value)}
                                            className="reportgenerator-form-input-inline  reportgenerator-form-input-inline-textarea"
                                            placeholder="请输入周边公交站名"
                                            required

                                        />
                                    </div>
                                    {/* 附近公交线路 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >线路:</label>
                                        <textarea
                                            value={reportgeneratorReportData.physicalCondition.busRoutes}
                                            onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'busRoutes', e.target.value)}
                                            className="reportgenerator-form-input-inline  reportgenerator-form-input-inline-textarea"
                                            placeholder="请输入周边公交线路"
                                            required

                                        />
                                    </div>
                                    {/* 道路 */}
                                    <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label"
                                        >道路:</label>
                                        <textarea
                                            value={reportgeneratorReportData.physicalCondition.areaRoad}
                                            onChange={(e) => reportgeneratorHandleInputChange('physicalCondition', 'areaRoad', e.target.value)}
                                            className="reportgenerator-form-input-inline  reportgenerator-form-input-inline-textarea"
                                            placeholder="请输入周边道路"
                                            required

                                        />
                                    </div>

                                </div>
                            )}

                            {/* 结果信息内容 */}
                            {reportgeneratorActiveTab === 'result' && (
                                <div className="reportgenerator-tab-content"
                                >
                                    {/* <h2 className="reportgenerator-section-title">结果信息</h2> */}

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 是否包含家具家电 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >家具家电:</label>
                                            <div className="reportgenerator-toggle-switch">
                                                <input
                                                    type="radio"
                                                    id="hasFurnitureElectronics-yes"
                                                    name="hasFurnitureElectronics"
                                                    checked={reportgeneratorReportData.result.hasFurnitureElectronics === true}
                                                    onChange={() => reportgeneratorHandleInputChange('result', 'hasFurnitureElectronics', true)}
                                                    className="reportgenerator-toggle-input"

                                                />
                                                <label htmlFor="hasFurnitureElectronics-yes"
                                                    className="reportgenerator-toggle-option reportgenerator-toggle-option-left"
                                                >有</label>

                                                <input
                                                    type="radio"
                                                    id="hasFurnitureElectronics-no"
                                                    name="hasFurnitureElectronics"
                                                    checked={reportgeneratorReportData.result.hasFurnitureElectronics === false}
                                                    onChange={() => reportgeneratorHandleInputChange('result', 'hasFurnitureElectronics', false)}
                                                    className="reportgenerator-toggle-input"

                                                />
                                                <label htmlFor="hasFurnitureElectronics-no" className="reportgenerator-toggle-option reportgenerator-toggle-option-right">无</label>

                                                <span className="reportgenerator-toggle-selection"></span>
                                            </div>
                                        </div>

                                        {/* 家具家电评估总价 - 有平滑过渡效果 */}
                                        <div
                                            className="reportgenerator-form-field-vertical-container"
                                            style={{
                                                opacity: reportgeneratorReportData.result.hasFurnitureElectronics ? 1 : 0,
                                                height: reportgeneratorReportData.result.hasFurnitureElectronics ? 'auto' : 0,
                                                overflow: 'hidden',
                                                transition: 'all 0.3s ease',
                                                visibility: reportgeneratorReportData.result.hasFurnitureElectronics ? 'visible' : 'hidden'
                                            }}
                                        >
                                            <label className="reportgenerator-field-label"
                                            >家具(元):</label>
                                            <input
                                                type="number"
                                                value={reportgeneratorReportData.result.furnitureElectronicsEstimatedPrice}
                                                onChange={(e) => reportgeneratorHandleInputChange('result', 'furnitureElectronicsEstimatedPrice', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请输入家具家电评估总价"
                                                min="0"
                                                step="1"

                                            />
                                        </div>
                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 价值时点 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >价值时点:</label>
                                            <DatePicker
                                                value={reportgeneratorReportData.result.valueDate ?
                                                    dayjs(reportgeneratorReportData.result.valueDate) : null}
                                                onChange={(date) => reportgeneratorHandleInputChange('result', 'valueDate', date)}
                                                format="YYYY年M月D日"
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请选择价值时点"
                                                required

                                            />
                                        </div>
                                        {/* 报告出具日期 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >报告日期:</label>
                                            <DatePicker
                                                value={reportgeneratorReportData.result.reportDate ?
                                                    dayjs(reportgeneratorReportData.result.reportDate) : null}
                                                onChange={(date) => reportgeneratorHandleInputChange('result', 'reportDate', date)}
                                                format="YYYY年M月D日"
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请选择报告日期"
                                                required

                                            />
                                        </div>
                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 估价方法 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >估价方法 :</label>
                                            <select
                                                value={reportgeneratorReportData.result.valuationMethod || ""}
                                                onChange={(e) => reportgeneratorHandleInputChange('result', 'valuationMethod', e.target.value)}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.result.valuationMethod ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="" disabled>请选择估价方法 </option>
                                                {Array.from(new Set(
                                                    reportgeneratorAppraiserOptions
                                                        .map(option => option.valuationMethodOptions)
                                                        .filter(Boolean)
                                                )).map((purpose, index) => (
                                                    <option key={`valuationMethod-${index}`} value={purpose}>
                                                        {purpose}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 评估单价 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >单价(元/㎡):</label>
                                            <input
                                                type="number"
                                                value={reportgeneratorReportData.result.valuationPrice}
                                                onChange={(e) => reportgeneratorHandleInputChange('result', 'valuationPrice', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请输入建面评估单价"
                                                min="0"
                                                step="0.01"

                                            />
                                        </div>
                                    </div>


                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 新增项目编号字段 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >项目编号:</label>
                                            <input
                                                type="text"
                                                value={reportgeneratorReportData.result.projectID}
                                                onChange={(e) => reportgeneratorHandleInputChange('result', 'projectID', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请输入项目编号"
                                                required

                                            />
                                        </div>

                                        {/* 新增报告编号字段 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label
                                                className="reportgenerator-field-label"
                                                onDoubleClick={() => {
                                                    if (!reportgeneratorReportData.result.reportID) {
                                                        reportgeneratorHandleInputChange('result', 'reportID', `渝房评〔2025〕司字第***号`);
                                                    }
                                                }}

                                            >
                                                报告编号:
                                            </label>
                                            <input
                                                type="text"
                                                value={reportgeneratorReportData.result.reportID}
                                                onChange={(e) => reportgeneratorHandleInputChange('result', 'reportID', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请输入报告编号"
                                                required

                                            />
                                        </div>
                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 估价师A */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >估价师姓名:</label>
                                            <select
                                                value={reportgeneratorReportData.result.appraiserA.name}
                                                onChange={(e) => {
                                                    const selectedOption = reportgeneratorAppraiserOptions.find(
                                                        option => option.AppraiserNameOptions === e.target.value
                                                    );
                                                    reportgeneratorHandleAppraiserChange('A', selectedOption || {});
                                                }}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.result.appraiserA.name ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="">请选择估价师</option>
                                                {reportgeneratorAppraiserOptions.map((option, index) => (
                                                    <option key={`appraiserA-${index}`} value={option.AppraiserNameOptions}>
                                                        {option.AppraiserNameOptions}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* 后端操作，前端不显示 */}
                                        {/* <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label">注册号:</label>
                                        <input
                                            type="text"
                                            value={reportgeneratorReportData.result.appraiserA.licenseNo}
                                            readOnly
                                            className="reportgenerator-form-input-inline"
                                            placeholder="自动填充注册号"
                                        />
                                    </div> */}
                                        {/*  估价师B */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >估价师姓名:</label>
                                            <select
                                                value={reportgeneratorReportData.result.appraiserB.name}
                                                onChange={(e) => {
                                                    const selectedOption = reportgeneratorAppraiserOptions.find(
                                                        option => option.AppraiserNameOptions === e.target.value
                                                    );
                                                    reportgeneratorHandleAppraiserChange('B', selectedOption || {});
                                                }}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.result.appraiserB.name ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="">请选择估价师</option>
                                                {reportgeneratorAppraiserOptions.map((option, index) => (
                                                    <option key={`appraiserB-${index}`} value={option.AppraiserNameOptions}>
                                                        {option.AppraiserNameOptions}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* 后端操作，前端不显示 */}
                                        {/* <div className="reportgenerator-form-field-horizontal">
                                        <label className="reportgenerator-field-label">注册号:</label>
                                        <input
                                            type="text"
                                            value={reportgeneratorReportData.result.appraiserB.licenseNo}
                                            readOnly
                                            className="reportgenerator-form-input-inline"
                                            placeholder="自动填充注册号"
                                        />
                                    </div> */}
                                    </div>


                                    {/* 估价师信息 */}
                                    {/* <div className="reportgenerator-appraiser-container">
                                  
                                    <div className="reportgenerator-appraiser-card">
                                        <h3 className="reportgenerator-appraiser-title">估价师A</h3>
                                        <div className="reportgenerator-form-field-horizontal">
                                            <label className="reportgenerator-field-label">姓名:</label>
                                            <select
                                                value={reportgeneratorReportData.result.appraiserA.name}
                                                onChange={(e) => {
                                                    const selectedOption = reportgeneratorAppraiserOptions.find(
                                                        option => option.AppraiserNameOptions === e.target.value
                                                    );
                                                    reportgeneratorHandleAppraiserChange('A', selectedOption || {});
                                                }}
                                                className="reportgenerator-form-select-inline"
                                                required
                                            >
                                                <option value="">请选择估价师</option>
                                                {reportgeneratorAppraiserOptions.map((option, index) => (
                                                    <option key={`appraiserA-${index}`} value={option.AppraiserNameOptions}>
                                                        {option.AppraiserNameOptions}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="reportgenerator-form-field-horizontal">
                                            <label className="reportgenerator-field-label">注册号:</label>
                                            <input
                                                type="text"
                                                value={reportgeneratorReportData.result.appraiserA.licenseNo}
                                                readOnly
                                                className="reportgenerator-form-input-inline"
                                                placeholder="自动填充注册号"
                                            />
                                        </div>
                                    </div>

                                     
                                    <div className="reportgenerator-appraiser-card">
                                        <h3 className="reportgenerator-appraiser-title">估价师B</h3>
                                        <div className="reportgenerator-form-field-horizontal">
                                            <label className="reportgenerator-field-label">姓名:</label>
                                            <select
                                                value={reportgeneratorReportData.result.appraiserB.name}
                                                onChange={(e) => {
                                                    const selectedOption = reportgeneratorAppraiserOptions.find(
                                                        option => option.AppraiserNameOptions === e.target.value
                                                    );
                                                    reportgeneratorHandleAppraiserChange('B', selectedOption || {});
                                                }}
                                                className="reportgenerator-form-select-inline"
                                            >
                                                <option value="">请选择估价师</option>
                                                {reportgeneratorAppraiserOptions.map((option, index) => (
                                                    <option key={`appraiserB-${index}`} value={option.AppraiserNameOptions}>
                                                        {option.AppraiserNameOptions}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="reportgenerator-form-field-horizontal">
                                            <label className="reportgenerator-field-label">注册号:</label>
                                            <input
                                                type="text"
                                                value={reportgeneratorReportData.result.appraiserB.licenseNo}
                                                readOnly
                                                className="reportgenerator-form-input-inline"
                                                placeholder="自动填充注册号"
                                            />
                                        </div>
                                    </div>
                                </div> */}
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 租金 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >租金（元/㎡）:</label>
                                            <input
                                                type="number" title='建面月租金'
                                                value={reportgeneratorReportData.result.rent}
                                                onChange={(e) => reportgeneratorHandleInputChange('result', 'rent', e.target.value)}
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请输入建面月租金：元/㎡.月"
                                                min="0"
                                                step="1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 权益状况内容 */}
                            {reportgeneratorActiveTab === 'equityStatus' && (
                                <div className="reportgenerator-tab-content"
                                >
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 抵押 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >抵押:</label>
                                            <div className="reportgenerator-toggle-switch">
                                                <input
                                                    type="radio"
                                                    id="mortgageStatus-yes"
                                                    name="mortgageStatus"
                                                    checked={reportgeneratorReportData.equityStatus.mortgageStatus === true}
                                                    onChange={() => reportgeneratorHandleInputChange('equityStatus', 'mortgageStatus', true)}
                                                    className="reportgenerator-toggle-input"

                                                />
                                                <label htmlFor="mortgageStatus-yes" className="reportgenerator-toggle-option reportgenerator-toggle-option-left"
                                                >有</label>

                                                <input
                                                    type="radio"
                                                    id="mortgageStatus-no"
                                                    name="mortgageStatus"
                                                    checked={reportgeneratorReportData.equityStatus.mortgageStatus === false}
                                                    onChange={() => reportgeneratorHandleInputChange('equityStatus', 'mortgageStatus', false)}
                                                    className="reportgenerator-toggle-input"
                                                />
                                                <label htmlFor="mortgageStatus-no" className="reportgenerator-toggle-option reportgenerator-toggle-option-right">无</label>

                                                <span className="reportgenerator-toggle-selection"></span>
                                            </div>
                                        </div>
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >抵押依据 :</label>
                                            <select
                                                value={reportgeneratorReportData.equityStatus.mortgageBasis || ""}
                                                onChange={(e) => reportgeneratorHandleInputChange('equityStatus', 'mortgageBasis', e.target.value)}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.equityStatus.mortgageBasis ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="" disabled>请选择抵押依据 </option>
                                                {Array.from(new Set(
                                                    reportgeneratorAppraiserOptions
                                                        .map(option => option.mortgageBasisOptions)
                                                        .filter(Boolean)
                                                )).map((purpose, index) => (
                                                    <option key={`mortgageBasis-${index}`} value={purpose}>
                                                        {purpose}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>


                                    </div>
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 查封 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >查封:</label>
                                            <div className="reportgenerator-toggle-switch">
                                                <input
                                                    type="radio"
                                                    id="seizureStatus-yes"
                                                    name="seizureStatus"
                                                    checked={reportgeneratorReportData.equityStatus.seizureStatus === true}
                                                    onChange={() => reportgeneratorHandleInputChange('equityStatus', 'seizureStatus', true)}
                                                    className="reportgenerator-toggle-input"

                                                />
                                                <label htmlFor="seizureStatus-yes" className="reportgenerator-toggle-option reportgenerator-toggle-option-left">有</label>

                                                <input
                                                    type="radio"
                                                    id="seizureStatus-no"
                                                    name="seizureStatus"
                                                    checked={reportgeneratorReportData.equityStatus.seizureStatus === false}
                                                    onChange={() => reportgeneratorHandleInputChange('equityStatus', 'seizureStatus', false)}
                                                    className="reportgenerator-toggle-input"
                                                />
                                                <label htmlFor="seizureStatus-no" className="reportgenerator-toggle-option reportgenerator-toggle-option-right">无</label>

                                                <span className="reportgenerator-toggle-selection"></span>
                                            </div>
                                        </div>
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >查封依据 :</label>
                                            <select
                                                value={reportgeneratorReportData.equityStatus.seizureBasis || ""}
                                                onChange={(e) => reportgeneratorHandleInputChange('equityStatus', 'seizureBasis', e.target.value)}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.equityStatus.seizureBasis ? "placeholder-style" : ""
                                                    }`}
                                                required

                                            >
                                                <option value="" disabled>请选择查封依据 </option>
                                                {Array.from(new Set(
                                                    reportgeneratorAppraiserOptions
                                                        .map(option => option.seizureBasisOptions)
                                                        .filter(Boolean)
                                                )).map((purpose, index) => (
                                                    <option key={`seizureBasis-${index}`} value={purpose}>
                                                        {purpose}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>


                                    </div>
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 利用状况 */}
                                        <div className="reportgenerator-form-field-vertical-container">
                                            <label className="reportgenerator-field-label"
                                            >利用状况 :</label>
                                            <select
                                                value={reportgeneratorReportData.equityStatus.utilizationStatus || ""}
                                                onChange={(e) => reportgeneratorHandleInputChange('equityStatus', 'utilizationStatus', e.target.value)}
                                                className={`reportgenerator-form-select-inline ${!reportgeneratorReportData.equityStatus.utilizationStatus ? "placeholder-style" : ""}`}
                                                required

                                            >
                                                <option value="" disabled>请选择利用状况</option>
                                                {Array.from(new Set(
                                                    reportgeneratorAppraiserOptions
                                                        .map(option => option.utilizationStatusOptions)
                                                        .filter(Boolean)
                                                )).map((purpose, index) => (
                                                    <option key={`utilizationStatus-${index}`} value={purpose}>
                                                        {purpose}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 条件渲染：只有当利用状况为"出租"时才显示租约选项 */}
                                        {showLeaseOption && (
                                            <div className="reportgenerator-form-field-vertical-container">
                                                <label className="reportgenerator-field-label"
                                                >是否考虑租约:</label>
                                                <div className="reportgenerator-toggle-switch">
                                                    <input
                                                        type="radio"
                                                        id="isLeaseConsidered-yes"
                                                        name="isLeaseConsidered"
                                                        checked={reportgeneratorReportData.equityStatus.isLeaseConsidered === true}
                                                        onChange={() => reportgeneratorHandleInputChange('equityStatus', 'isLeaseConsidered', true)}
                                                        className="reportgenerator-toggle-input"
                                                    />
                                                    <label htmlFor="isLeaseConsidered-yes" className="reportgenerator-toggle-option reportgenerator-toggle-option-left">是</label>

                                                    <input
                                                        type="radio"
                                                        id="isLeaseConsidered-no"
                                                        name="isLeaseConsidered"
                                                        checked={reportgeneratorReportData.equityStatus.isLeaseConsidered === false}
                                                        onChange={() => reportgeneratorHandleInputChange('equityStatus', 'isLeaseConsidered', false)}
                                                        className="reportgenerator-toggle-input"
                                                    />
                                                    <label htmlFor="isLeaseConsidered-no" className="reportgenerator-toggle-option reportgenerator-toggle-option-right">否</label>

                                                    <span className="reportgenerator-toggle-selection"></span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 百度数据采集模态框 ，传递location */}
                        {showBaiduDataGrabber && (
                            <BaiduDataGrabber
                                location={reportgeneratorReportData.property.location}
                                initialData={{
                                    bank: reportgeneratorReportData.physicalCondition.bank,
                                    supermarket: reportgeneratorReportData.physicalCondition.supermarket,
                                    hospital: reportgeneratorReportData.physicalCondition.hospital,
                                    school: reportgeneratorReportData.physicalCondition.school,
                                    nearbyCommunity: reportgeneratorReportData.physicalCondition.nearbyCommunity,
                                    busStopName: reportgeneratorReportData.physicalCondition.busStopName,
                                    busRoutes: reportgeneratorReportData.physicalCondition.busRoutes,
                                    areaRoad: reportgeneratorReportData.physicalCondition.areaRoad,
                                    streetStatus: reportgeneratorReportData.physicalCondition.streetStatus, // 新增传递 新增临街状况字段 
                                    direction: reportgeneratorReportData.physicalCondition.direction, // 新增传递 新增方位字段 
                                    orientation: reportgeneratorReportData.physicalCondition.orientation, // 新增传递 新增朝向字段
                                    distance: reportgeneratorReportData.physicalCondition.distance, // 新增传递 新增距离字段 （重要场所）
                                    boundaries: reportgeneratorReportData.physicalCondition.boundaries, // 新增传递 新增四至
                                }}
                                onSave={handleSaveSurroundingInfo}
                                onClose={() => setShowBaiduDataGrabber(false)}
                            />
                        )}
                        {/* 百度数据采集模态框 ，传递location */}
                        {showHandBaiduDataGrabber && (
                            <HandBaiduDataGrabber
                                location={reportgeneratorReportData.property.location}
                                initialData={{
                                    bank: reportgeneratorReportData.physicalCondition.bank,
                                    supermarket: reportgeneratorReportData.physicalCondition.supermarket,
                                    hospital: reportgeneratorReportData.physicalCondition.hospital,
                                    school: reportgeneratorReportData.physicalCondition.school,
                                    nearbyCommunity: reportgeneratorReportData.physicalCondition.nearbyCommunity,
                                    busStopName: reportgeneratorReportData.physicalCondition.busStopName,
                                    busRoutes: reportgeneratorReportData.physicalCondition.busRoutes,
                                    areaRoad: reportgeneratorReportData.physicalCondition.areaRoad,
                                    streetStatus: reportgeneratorReportData.physicalCondition.streetStatus, // 新增传递 新增临街状况字段 
                                    direction: reportgeneratorReportData.physicalCondition.direction, // 新增传递 新增方位字段 
                                    orientation: reportgeneratorReportData.physicalCondition.orientation, // 新增传递 新增朝向字段
                                    distance: reportgeneratorReportData.physicalCondition.distance, // 新增传递 新增距离字段 （重要场所）
                                    boundaries: reportgeneratorReportData.physicalCondition.boundaries, // 新增传递 新增四至
                                }}
                                onSave={handleSaveSurroundingInfo}
                                onClose={() => setShowHandBaiduDataGrabber(false)}
                            />
                        )}

                        {/* 添加报告预览模态框 */}

                        {showReportPreview && (
                            <div className="report-preview-overlay">
                                <div className="report-preview-modal">
                                    <WordEditingPreview
                                        initialData={reportgeneratorReportData}
                                        templateType={previewTemplateType}
                                        hasFurnitureElectronics={reportgeneratorReportData.result.hasFurnitureElectronics}
                                        isPreviewMode={true}
                                        onClose={() => setShowReportPreview(false)}
                                        onSave={handleSavePreviewData} // 新增：传递保存回调
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </ConfirmationDialogManager>
        </ConfigProvider>
    );
};

export default WordReportGenerator;