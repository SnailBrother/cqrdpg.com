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
import { TextBox } from '../../../components/UI';
// 导入你封装的 UI 组件

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
const socket = io('https://www.cqrdpg.com:5202');


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

//保存看有没有新增加的选项 👇
// 收集表单中所有需要同步的选项字段的当前值
const collectNewOptions = () => {
    const optionsToSync = {
        assessmentCommissionDocument: [],
        valueDateRequirements: [],
        coOwnershipStatus: [],
        rightsNature: [],
        houseStructure: [],
        landPurpose: [],
        housePurpose: [],
        orientation: [],
        landShape: [],
        exteriorWallMaterial: [],
        parkingStatus: [],
        valuationMethod: [],
        mortgageBasis: [],
        seizureBasis: [],
        utilizationStatus: []
    };
    
    // 从当前表单数据中收集
    if (reportgeneratorReportData.entrustment.assessmentCommissionDocument) {
        optionsToSync.assessmentCommissionDocument.push(reportgeneratorReportData.entrustment.assessmentCommissionDocument);
    }
    if (reportgeneratorReportData.entrustment.valueDateRequirements) {
        optionsToSync.valueDateRequirements.push(reportgeneratorReportData.entrustment.valueDateRequirements);
    }
    if (reportgeneratorReportData.property.coOwnershipStatus) {
        optionsToSync.coOwnershipStatus.push(reportgeneratorReportData.property.coOwnershipStatus);
    }
    if (reportgeneratorReportData.property.rightsNature) {
        optionsToSync.rightsNature.push(reportgeneratorReportData.property.rightsNature);
    }
    if (reportgeneratorReportData.property.houseStructure) {
        optionsToSync.houseStructure.push(reportgeneratorReportData.property.houseStructure);
    }
    if (reportgeneratorReportData.property.landPurpose) {
        optionsToSync.landPurpose.push(reportgeneratorReportData.property.landPurpose);
    }
    if (reportgeneratorReportData.property.housePurpose) {
        optionsToSync.housePurpose.push(reportgeneratorReportData.property.housePurpose);
    }
    if (reportgeneratorReportData.physicalCondition.orientation) {
        optionsToSync.orientation.push(reportgeneratorReportData.physicalCondition.orientation);
    }
    if (reportgeneratorReportData.physicalCondition.landShape) {
        optionsToSync.landShape.push(reportgeneratorReportData.physicalCondition.landShape);
    }
    if (reportgeneratorReportData.physicalCondition.exteriorWallMaterial) {
        optionsToSync.exteriorWallMaterial.push(reportgeneratorReportData.physicalCondition.exteriorWallMaterial);
    }
    if (reportgeneratorReportData.physicalCondition.parkingStatus) {
        optionsToSync.parkingStatus.push(reportgeneratorReportData.physicalCondition.parkingStatus);
    }
    if (reportgeneratorReportData.result.valuationMethod) {
        optionsToSync.valuationMethod.push(reportgeneratorReportData.result.valuationMethod);
    }
    if (reportgeneratorReportData.equityStatus.mortgageBasis) {
        optionsToSync.mortgageBasis.push(reportgeneratorReportData.equityStatus.mortgageBasis);
    }
    if (reportgeneratorReportData.equityStatus.seizureBasis) {
        optionsToSync.seizureBasis.push(reportgeneratorReportData.equityStatus.seizureBasis);
    }
    if (reportgeneratorReportData.equityStatus.utilizationStatus) {
        optionsToSync.utilizationStatus.push(reportgeneratorReportData.equityStatus.utilizationStatus);
    }
    
    return optionsToSync;
};

// 调用同步API
const syncNewOptions = async () => {
    const optionsToSync = collectNewOptions();
    
    // 检查是否有需要同步的数据
    const hasData = Object.values(optionsToSync).some(arr => arr.length > 0);
    if (!hasData) return;
    
    try {
        await axios.post('/api/syncWordReportOptions', {
            optionsData: optionsToSync
        });
        // 同步成功后，可以重新获取选项列表来更新前端下拉框
        const response = await axios.get('/api/getWordReportOptions');
        setReportgeneratorAppraiserOptions(response.data);
    } catch (error) {
        console.error('同步选项失败:', error);
        // 不阻塞主流程，只记录错误
    }
};
//保存看有没有新增加的选项 👆



    // 组件加载时获取初始数据
    useEffect(() => {
        // 获取估价师选项
        const fetchAppraiserOptions = async () => {
            try {
                const response = await axios.get('/api/getWordReportOptions');
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
                const response = await axios.get('/api/searchWordReports');
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
                floorNumber: reportData.floorNumber || '',
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
                `/api/searchWordReports?documentNo=${reportgeneratorSearchTerm}&page=${currentPage}&pageSize=${pageSize}`
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
                floorNumber: reportgeneratorReportData.physicalCondition.floorNumber || '',
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
                `/api/checkReportByReportID?reportID=${encodeURIComponent(reportData.reportID)}`
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
                        `/api/updateWordReport/${existingReport.reportsID}`,
                        reportData
                    );
                    notify('报告更新成功！', 'success');
                    // 👇 添加这行：同步新选项
    //await syncNewOptions();
    // 不等待同步完成
syncNewOptions().catch(err => console.error('同步选项失败:', err));
                }
            } else {
                // 不存在相同报告编号的报告，创建新报告
                await axios.post('/api/createWordReport', reportData);
                notify('报告创建成功！', 'success');
                // 👇 添加这行：同步新选项
    //await syncNewOptions();
    // 不等待同步完成
syncNewOptions().catch(err => console.error('同步选项失败:', err));
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
                await axios.delete(`/api/deleteWordReport/${currentReportId}`);
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
            let dateValue = '';
            if (value) {
                // 使用 dayjs 统一处理各种格式
                const dayjsValue = dayjs(value);
                if (dayjsValue.isValid()) {
                    dateValue = dayjsValue.format('YYYY-MM-DD');
                }
            }
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



    // 自定义ui组件👇
    // 委托类型:
    const assessmentCommissionSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.assessmentCommissionDocumentOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //时点要求:
    const valueDateRequirementsSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.valueDateRequirementsOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //共有情况
    const coOwnershipStatusSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.coOwnershipStatusOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //权利性质
    const rightsNatureSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.rightsNatureOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //房屋结构
    const houseStructureSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.houseStructureOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //土地用途
    const landPurposeSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.landPurposeOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //房屋用途
    const housePurposeSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.housePurposeOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //建成年代
    const yearBuiltSearchList = React.useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear; year >= 1900; year--) {
            years.push(year.toString());
        }
        return years;
    }, []);
    //所在楼层
    // 楼层列表：-6 到 50，从小到大排序（纯数字字符串）
    const floorNumberSearchList = React.useMemo(() => {
        const floors = [];
        // 从 -6 循环到 50，从小到大
        for (let floor = -6; floor <= 50; floor++) {
            floors.push(floor.toString());
        }
        return floors;
    }, []);
    //朝向
    const orientationSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.orientationOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //土地形状
    const landShapeSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.landShapeOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //外墙面 
    const exteriorWallMaterialSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.exteriorWallMaterialOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //停车状况
    const parkingStatusSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.parkingStatusOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //估价方法
    const valuationMethodSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.valuationMethodOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //估价师A
    const appraiserNameSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.AppraiserNameOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //抵押依据
    const mortgageBasisSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.mortgageBasisOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //查封依据
    const seizureBasisSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.seizureBasisOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    //利用状况
    const utilizationStatusSearchList = React.useMemo(() => {
        const options = reportgeneratorAppraiserOptions
            .map(option => option.utilizationStatusOptions)
            .filter(Boolean);
        return [...new Set(options)]; // 去重
    }, [reportgeneratorAppraiserOptions]);
    // 自定义ui组件👆



    //添加跳转二维码 👇
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


    // 添加查看二维码的处理函数


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
                                    <TextBox
                                        label="委托方:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入搜索内容"
                                        tooltipPosition="bottom"
                                        tooltipDelay={500}
                                        tooltip="请输入您的用户名，长度不超过20个字符"
                                        value={reportgeneratorReportData.entrustment.entrustingParty}
                                        onChange={(value) => reportgeneratorHandleInputChange('entrustment', 'entrustingParty', value)}
                                        required
                                    />


                                    {/* 评估委托文书（选项值） */}
                                    <TextBox
                                        label="委托类型:"
                                        Type="SearchBox"
                                        placeholder="请选择委托文书"
                                        searchList={assessmentCommissionSearchList}
                                        value={reportgeneratorReportData.entrustment.assessmentCommissionDocument || ""}
                                        onChange={(value) => reportgeneratorHandleInputChange('entrustment', 'assessmentCommissionDocument', value)}
                                        required
                                    />

                                    {/* 价值时点要求 */}
                                    <TextBox
                                        label="时点要求:"
                                        Type="SearchBox"
                                        placeholder="价值时点要求"
                                        searchList={valueDateRequirementsSearchList}
                                        value={reportgeneratorReportData.entrustment.valueDateRequirements || ""}
                                        onChange={(value) => reportgeneratorHandleInputChange('entrustment', 'valueDateRequirements', value)}
                                        required
                                    />

                                    {/* 委托书号 */}
                                    <TextBox
                                        label="委托书号:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入委托书编号"
                                        value={reportgeneratorReportData.entrustment.documentNo}
                                        onChange={(value) => reportgeneratorHandleInputChange('entrustment', 'documentNo', value)}
                                        required
                                    />

                                    {/* 委托日期 */}

                                    <TextBox
                                        label="委托日期:"
                                        Type="DatePicker"
                                        leftIcon="#icon-edit"
                                        dateFormat="YYYY年M月D日"
                                        value={reportgeneratorReportData.entrustment.entrustDate || ''}
                                        onChange={(date) => reportgeneratorHandleInputChange('entrustment', 'entrustDate', date)}
                                    />

                                </div>
                            )}

                            {/* 产权信息内容 */}
                            {reportgeneratorActiveTab === 'property' && (
                                <div className="reportgenerator-tab-content"
                                >
                                    {/* <h2 className="reportgenerator-section-title">产权信息</h2> */}
                                    {/* 产权证号 */}
                                    <TextBox
                                        label="产权证号:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入产权证号"
                                        value={reportgeneratorReportData.property.propertyCertificateNo}
                                        onChange={(value) => reportgeneratorHandleInputChange('property', 'propertyCertificateNo', value)}
                                        required
                                    />

                                    {/* 权利人 */}
                                    <TextBox
                                        label="权利人:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入权利人"
                                        value={reportgeneratorReportData.property.rightsHolder}
                                        onChange={(value) => reportgeneratorHandleInputChange('property', 'rightsHolder', value)}
                                        required
                                    />

                                    {/* 共有情况 */}
                                    <TextBox
                                        label="共有情况:"
                                        Type="SearchBox"
                                        placeholder="请选择共有情况"
                                        searchList={coOwnershipStatusSearchList}
                                        value={reportgeneratorReportData.property.coOwnershipStatus || ""}
                                        onChange={(value) => reportgeneratorHandleInputChange('property', 'coOwnershipStatus', value)}
                                        required
                                    />

                                    {/* 坐落 */}
                                    <TextBox
                                        label="坐落:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入房产坐落地址"
                                        value={reportgeneratorReportData.property.location}
                                        onChange={(value) => reportgeneratorHandleInputChange('property', 'location', value)}
                                        required
                                    />

                                    {/* 不动产单元号 */}
                                    <TextBox
                                        label="不动产单元号:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入不动产单元号"
                                        value={reportgeneratorReportData.property.propertyUnitNo}
                                        onChange={(value) => reportgeneratorHandleInputChange('property', 'propertyUnitNo', value)}
                                        required
                                    />
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 权利性质 */}
                                        <TextBox
                                            label="权利性质:"
                                            Type="SearchBox"
                                            placeholder="请选择权利性质"
                                            searchList={rightsNatureSearchList}
                                            value={reportgeneratorReportData.property.rightsNature || ""}
                                            onChange={(value) => reportgeneratorHandleInputChange('property', 'rightsNature', value)}
                                            required
                                        />

                                        {/* 房屋结构 */}
                                        <TextBox
                                            label="房屋结构:"
                                            Type="SearchBox"
                                            placeholder="请选择房屋结构"
                                            searchList={houseStructureSearchList}
                                            value={reportgeneratorReportData.property.houseStructure || ""}
                                            onChange={(value) => reportgeneratorHandleInputChange('property', 'houseStructure', value)}
                                            required
                                        />

                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 土地用途 */}
                                        <TextBox
                                            label="土地用途:"
                                            Type="SearchBox"
                                            placeholder="请选择土地用途"
                                            searchList={landPurposeSearchList}
                                            value={reportgeneratorReportData.property.landPurpose || ""}
                                            onChange={(value) => reportgeneratorHandleInputChange('property', 'landPurpose', value)}
                                            required
                                        />

                                        {/* 房屋用途 */}
                                        <TextBox
                                            label="房屋用途:"
                                            Type="SearchBox"
                                            placeholder="请选择房屋用途"
                                            searchList={housePurposeSearchList}
                                            value={reportgeneratorReportData.property.housePurpose || ""}
                                            onChange={(value) => reportgeneratorHandleInputChange('property', 'housePurpose', value)}
                                            required
                                        />

                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 共有宗地面积 */}
                                        <TextBox
                                            label="共有宗地(m²):"
                                            Type="NumberInput"
                                            leftIcon="#icon-edit"
                                            min={0}
                                            max={100000}
                                            step={10}
                                            placeholder="请输入共有宗地面积"
                                            value={reportgeneratorReportData.property.sharedLandArea}
                                            onChange={(value) => reportgeneratorHandleInputChange('property', 'sharedLandArea', value)}
                                        />

                                        {/* 建筑面积 */}
                                        <TextBox
                                            label="建筑面积(m²):"
                                            Type="NumberInput"
                                            leftIcon="#icon-edit"
                                            min={0}
                                            max={100000}
                                            step={10}
                                            placeholder="请输入建筑面积"
                                            value={reportgeneratorReportData.property.buildingArea}
                                            onChange={(value) => reportgeneratorHandleInputChange('property', 'buildingArea', value)}
                                        />

                                    </div>
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 土地使用权终止日期 */}
                                        <TextBox
                                            label="土地终止日期:"
                                            Type="DatePicker"
                                            leftIcon="#icon-edit"
                                            dateFormat="YYYY年M月D日"
                                            placeholder="请选择土地终止日期:"

                                            value={reportgeneratorReportData.property.landUseRightEndDate || ''}  // 存储格式 YYYY-MM-DD
                                            onChange={(date) => reportgeneratorHandleInputChange('property', 'landUseRightEndDate', date)}
                                        />

                                        {/* 套内面积 */}
                                        <TextBox
                                            label="套内面积(m²):"
                                            Type="NumberInput"
                                            leftIcon="#icon-edit"
                                            min={0}
                                            max={100000}
                                            step={10}
                                            placeholder="请选择套内面积"
                                            value={reportgeneratorReportData.property.interiorArea}
                                            onChange={(value) => reportgeneratorHandleInputChange('property', 'interiorArea', value)}
                                        />
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

                                        <TextBox
                                            label="名称:"
                                            Type="SearchBox"
                                            leftIcon="#icon-edit"
                                            rightIcon="#icon-a-duicuocuo"
                                            placeholder="请输入小区名称"
                                            value={reportgeneratorReportData.physicalCondition.communityName}
                                            onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'communityName', value)}
                                            required
                                        />

                                        {/* 建成年份 */}
                                        <TextBox
                                            label="年代:"
                                            Type="SearchBox"
                                            placeholder="请选择年份"
                                            searchList={yearBuiltSearchList}
                                            value={reportgeneratorReportData.physicalCondition.yearBuilt || ""}
                                            onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'yearBuilt', value)}
                                            required
                                        />

                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 总层数 */}
                                        <TextBox
                                            label="总层数:"
                                            Type="NumberInput"
                                            leftIcon="#icon-edit"
                                            min={0}
                                            max={100}
                                            step={10}
                                            placeholder="请输入总层数"
                                            value={reportgeneratorReportData.physicalCondition.totalFloors}
                                            onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'totalFloors', value)}
                                        />
                                        {/* 所在楼层 */}
                                        <TextBox
                                            label="楼层:"
                                            Type="ComboBox"
                                            searchList={floorNumberSearchList}
                                            leftIcon="#icon-unedit"
                                            rightIcon="#icon-a-duicuocuo"
                                            placeholder="请输入所在楼层（可多选）"
                                            editable={true}
                                            multiple={true}
                                            value={reportgeneratorReportData.physicalCondition.floorNumber}
                                            connector="、"
                                            onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'floorNumber', value)}
                                            required
                                        />

                                    </div>
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 电梯 */}
                                        <TextBox
                                            label="电梯："
                                            Type="Switch"
                                            value={reportgeneratorReportData.physicalCondition.elevator === true}
                                            onChange={(value) => {
                                                reportgeneratorHandleInputChange('physicalCondition', 'elevator', value);
                                            }}
                                            trueLabel="有"
                                            falseLabel="无"
                                        />
                                        {/* 通气 */}
                                        <TextBox
                                            label="通气:"
                                            Type="Switch"
                                            value={reportgeneratorReportData.physicalCondition.ventilationStatus === true}
                                            onChange={(value) => {
                                                reportgeneratorHandleInputChange('physicalCondition', 'ventilationStatus', value);
                                            }}
                                            trueLabel="有"
                                            falseLabel="无"
                                        />

                                    </div>


                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 空间布局 */}
                                        <TextBox
                                            label="户型:"
                                            Type="SearchBox"
                                            leftIcon="#icon-edit"
                                            rightIcon="#icon-a-duicuocuo"
                                            placeholder="请输入空间布局"
                                            value={reportgeneratorReportData.physicalCondition.spaceLayout}
                                            onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'spaceLayout', value)}
                                            required
                                        />

                                        {/* 朝向 */}
                                        <TextBox
                                            label="朝向:"
                                            Type="SearchBox"
                                            placeholder="请选择朝向"
                                            searchList={orientationSearchList}
                                            value={reportgeneratorReportData.physicalCondition.orientation || ""}
                                            onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'orientation', value)}
                                            required
                                        />

                                    </div>
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 土地形状 */}
                                        <TextBox
                                            label="形状:"
                                            Type="SearchBox"
                                            placeholder="请选择土地形状"
                                            searchList={landShapeSearchList}
                                            value={reportgeneratorReportData.physicalCondition.landShape || ""}
                                            onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'landShape', value)}
                                            required
                                        />

                                        {/* 外墙面 */}
                                        <TextBox
                                            label="外墙:"
                                            Type="SearchBox"
                                            placeholder="请选择外墙面"
                                            searchList={exteriorWallMaterialSearchList}
                                            value={reportgeneratorReportData.physicalCondition.exteriorWallMaterial || ""}
                                            onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'exteriorWallMaterial', value)}
                                            onLabelDoubleClick={() => {
                                                if (reportgeneratorReportData.property.location) {
                                                    setShowBaiduDataGrabber(true);
                                                } else {
                                                    notify('请先填写房产坐落', 'warning');
                                                }
                                            }}
                                            required
                                        />


                                    </div>
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 临街状况 */}
                                        <TextBox
                                            label="临街:"
                                            Type="SearchBox"
                                            leftIcon="#icon-edit"
                                            rightIcon="#icon-a-duicuocuo"
                                            placeholder="请输入临街状况"
                                            value={reportgeneratorReportData.physicalCondition.streetStatus}
                                            onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'streetStatus', value)}
                                            required
                                        />

                                        {/* 方位 */}
                                        <TextBox
                                            label="方位:"
                                            Type="SearchBox"
                                            leftIcon="#icon-edit"
                                            rightIcon="#icon-a-duicuocuo"
                                            placeholder="请输入方位"
                                            value={reportgeneratorReportData.physicalCondition.direction}
                                            onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'direction', value)}
                                            onLabelDoubleClick={() => {
                                                if (reportgeneratorReportData.property.location) {
                                                    setShowHandBaiduDataGrabber(true);
                                                } else {
                                                    notify('请先填写房产坐落', 'warning');
                                                }
                                            }}
                                            required
                                        />

                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 距离 */}
                                        <TextBox
                                            label="距离:"
                                            Type="SearchBox"
                                            leftIcon="#icon-edit"
                                            rightIcon="#icon-a-duicuocuo"
                                            placeholder="请输入距重要场所距离"
                                            value={reportgeneratorReportData.physicalCondition.distance}
                                            onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'distance', value)}
                                            required
                                        />

                                        {/* 四至 */}
                                        <TextBox
                                            label="四至:"
                                            Type="SearchBox"
                                            leftIcon="#icon-edit"
                                            rightIcon="#icon-a-duicuocuo"
                                            placeholder="请输入四至"
                                            multiline="true"
                                            value={reportgeneratorReportData.physicalCondition.boundaries}
                                            onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'boundaries', value)}
                                            required
                                        />
                                    </div>
                                    {/* 停车状况 */}
                                    <TextBox
                                        label="停车:"
                                        Type="SearchBox"
                                        placeholder="请选择停车状况"
                                        searchList={parkingStatusSearchList}
                                        value={reportgeneratorReportData.physicalCondition.parkingStatus || ""}
                                        onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'parkingStatus', value)}
                                        required
                                    />

                                    {/* 装饰装修 */}
                                    <TextBox
                                        label="装修:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入装修:"
                                         multiline="true"
                                        value={reportgeneratorReportData.physicalCondition.decorationStatus}
                                        onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'decorationStatus', value)}
                                        onLabelDoubleClick={() => {
                                            if (!reportgeneratorReportData.physicalCondition.decorationStatus) {
                                                reportgeneratorHandleInputChange(
                                                    'physicalCondition',
                                                    'decorationStatus',
                                                    '入户门防盗门，铝合金窗；室内客厅地面地砖，墙面墙布，天棚吊顶，卧室地面木地板，墙面墙布，天棚刷漆，厨卫：地面地砖，墙砖到顶，扣板吊顶'
                                                );
                                            }
                                        }}
                                        required
                                    />

                                    {/* 银行 */}
                                    <TextBox
                                        label="银行:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入周边银行"
                                        value={reportgeneratorReportData.physicalCondition.bank}
                                        onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'bank', value)}
                                        required
                                    />

                                    {/* 超市 */}
                                    <TextBox
                                        label="超市:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入周边超市"
                                        value={reportgeneratorReportData.physicalCondition.supermarket}
                                        onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'supermarket', value)}
                                        required
                                    />

                                    {/* 医院 */}
                                    <TextBox
                                        label="医院:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入医院"
                                        value={reportgeneratorReportData.physicalCondition.hospital}
                                        onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'hospital', value)}
                                        required
                                    />

                                    {/* 学校 */}
                                    <TextBox
                                        label="学校:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入学校"
                                        value={reportgeneratorReportData.physicalCondition.school}
                                        onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'school', value)}
                                        required
                                    />

                                    {/* 附近小区 */}
                                    <TextBox
                                        label="小区:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入小区"
                                        value={reportgeneratorReportData.physicalCondition.nearbyCommunity}
                                        onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'nearbyCommunity', value)}
                                        required
                                    />

                                    {/* 公交站名 */}
                                    <TextBox
                                        label="公交:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入公交"
                                        value={reportgeneratorReportData.physicalCondition.busStopName}
                                        onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'busStopName', value)}
                                        required
                                    />

                                    {/* 附近公交线路 */}
                                    <TextBox
                                        label="线路:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="周边公交线路"
                                        value={reportgeneratorReportData.physicalCondition.busRoutes}
                                        onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'busRoutes', value)}
                                        required
                                    />

                                    {/* 道路 */}
                                    <TextBox
                                        label="道路:"
                                        Type="SearchBox"
                                        leftIcon="#icon-edit"
                                        rightIcon="#icon-a-duicuocuo"
                                        placeholder="请输入周边道路"
                                        value={reportgeneratorReportData.physicalCondition.areaRoad}
                                        onChange={(value) => reportgeneratorHandleInputChange('physicalCondition', 'areaRoad', value)}
                                        required
                                    />

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
                                        <TextBox
                                            label="家具家电:"
                                            Type="Switch"
                                            value={reportgeneratorReportData.result.hasFurnitureElectronics === true}
                                            onChange={(value) => reportgeneratorHandleInputChange('result', 'hasFurnitureElectronics', value)}
                                            trueLabel="有"
                                            falseLabel="无"
                                        />

                                        {/* 家具家电评估总价 - 有平滑过渡效果 */}
                                        <TextBox
                                            label="家具(元):"
                                            Type="NumberInput"
                                            leftIcon="#icon-edit"
                                            min={0}
                                            max={1000000}
                                            step={1000}
                                            placeholder="请输入家具家电评估总价"
                                            value={reportgeneratorReportData.result.furnitureElectronicsEstimatedPrice}
                                            onChange={(value) => reportgeneratorHandleInputChange('result', 'furnitureElectronicsEstimatedPrice', value)}
                                            showCondition={reportgeneratorReportData.result.hasFurnitureElectronics === true}
                                            animate={true}
                                        />
                                        {/*  <div
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
                                                onChange={(value) => reportgeneratorHandleInputChange('result', 'furnitureElectronicsEstimatedPrice', value)}
                                                className="reportgenerator-form-input-inline"
                                                placeholder="请输入家具家电评估总价"
                                                min="0"
                                                step="1"

                                           
                                        </div> />*/}
                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 价值时点 */}
                                        <TextBox
                                            label="价值时点:"
                                            Type="DatePicker"
                                            leftIcon="#icon-edit"
                                            dateFormat="YYYY年M月D日"
                                            placeholder="请选择价值时点:"

                                            value={reportgeneratorReportData.result.valueDate || ''}

                                            onChange={(date) => reportgeneratorHandleInputChange('result', 'valueDate', date)}
                                        />

                                        {/* 报告出具日期 */}
                                        <TextBox
                                            label="报告日期:"
                                            Type="DatePicker"
                                            leftIcon="#icon-edit"
                                            dateFormat="YYYY年M月D日"
                                            placeholder="请选择报告日期:"

                                            value={reportgeneratorReportData.result.reportDate || ''}

                                            onChange={(date) => reportgeneratorHandleInputChange('result', 'reportDate', date)}
                                        />

                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 估价方法 */}
                                        <TextBox
                                            label="估价方法:"
                                            Type="SearchBox"
                                            placeholder="请选择估价方法"
                                            searchList={valuationMethodSearchList}
                                            value={reportgeneratorReportData.result.valuationMethod || ""}
                                            onChange={(value) => reportgeneratorHandleInputChange('result', 'valuationMethod', value)}
                                            required
                                        />

                                        {/* 评估单价 */}
                                        <TextBox
                                            label="单价(元/㎡):"
                                            Type="NumberInput"
                                            leftIcon="#icon-edit"
                                            min={0}
                                            max={150000}
                                            step={100}
                                            placeholder="请输入建面评估单价"
                                            value={reportgeneratorReportData.result.valuationPrice}
                                            onChange={(value) => reportgeneratorHandleInputChange('result', 'valuationPrice', value)}
                                        />

                                    </div>


                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 新增项目编号字段 */}
                                        <TextBox
                                            label="项目编号:"
                                            Type="SearchBox"
                                            leftIcon="#icon-edit"
                                            rightIcon="#icon-a-duicuocuo"
                                            placeholder="请输入项目编号:"
                                            value={reportgeneratorReportData.result.projectID}
                                            onChange={(value) => reportgeneratorHandleInputChange('result', 'projectID', value)}
                                            required
                                        />
                                        {/* 新增报告编号字段 */}
                                        <TextBox
                                            label="报告编号:"
                                            Type="SearchBox"
                                            leftIcon="#icon-edit"
                                            rightIcon="#icon-a-duicuocuo"
                                            placeholder="请输入报告编号"
                                            value={reportgeneratorReportData.result.reportID}
                                            onChange={(value) => reportgeneratorHandleInputChange('result', 'reportID', value)}
                                            onLabelDoubleClick={() => {
                                                if (!reportgeneratorReportData.result.reportID) {
                                                    reportgeneratorHandleInputChange('result', 'reportID', `渝瑞达房评〔2026〕司字第***号`);
                                                }
                                            }}

                                            required
                                        />

                                    </div>

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 估价师A */}
                                        <TextBox
                                            label="估价师姓名:"
                                            Type="SearchBox"
                                            placeholder="请选择估价师"
                                            searchList={appraiserNameSearchList}
                                            value={reportgeneratorReportData.result.appraiserA.name || ""}
                                            onChange={(value) => {
                                                const selectedOption = reportgeneratorAppraiserOptions.find(
                                                    option => option.AppraiserNameOptions === value
                                                );
                                                reportgeneratorHandleAppraiserChange('A', selectedOption || {});
                                            }}
                                            required
                                        />

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
                                        <TextBox
                                            label="估价师姓名:"
                                            Type="SearchBox"
                                            placeholder="请选择估价师"
                                            searchList={appraiserNameSearchList}
                                            value={reportgeneratorReportData.result.appraiserB.name || ""}
                                            onChange={(value) => {
                                                const selectedOption = reportgeneratorAppraiserOptions.find(
                                                    option => option.AppraiserNameOptions === value
                                                );
                                                reportgeneratorHandleAppraiserChange('B', selectedOption || {});
                                            }}
                                            required
                                        />

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

                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 租金 */}
                                        <TextBox
                                            label="租金（元/㎡）:"
                                            Type="NumberInput"
                                            leftIcon="#icon-edit"
                                            min={0}
                                            max={2000}
                                            step={10}
                                            placeholder="请输入建面月租金：元/㎡.月"
                                            value={reportgeneratorReportData.result.rent}
                                            onChange={(value) => reportgeneratorHandleInputChange('result', 'rent', value)}
                                        />

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
                                        <TextBox
                                            label="抵押:"
                                            Type="Switch"
                                            value={reportgeneratorReportData.equityStatus.mortgageStatus === true}
                                            onChange={(value) => reportgeneratorHandleInputChange('equityStatus', 'mortgageStatus', value)}
                                            trueLabel="有"
                                            falseLabel="无"
                                        />

                                        {/* 抵押依据 */}
                                        <TextBox
                                            label="抵押依据:"
                                            Type="SearchBox"
                                            placeholder="请选择抵押依据"
                                            searchList={mortgageBasisSearchList}
                                            value={reportgeneratorReportData.equityStatus.mortgageBasis || ""}
                                            onChange={(value) => reportgeneratorHandleInputChange('equityStatus', 'mortgageBasis', value)}
                                            required
                                        />


                                    </div>
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 查封 */}
                                        <TextBox
                                            label="查封:"
                                            Type="Switch"
                                            value={reportgeneratorReportData.equityStatus.seizureStatus === true}
                                            onChange={(value) => reportgeneratorHandleInputChange('equityStatus', 'seizureStatus', value)}
                                            trueLabel="有"
                                            falseLabel="无"
                                        />

                                        {/* 查封依据 : */}
                                        <TextBox
                                            label="查封依据:"
                                            Type="SearchBox"
                                            placeholder="请选择查封依据"
                                            searchList={seizureBasisSearchList}
                                            value={reportgeneratorReportData.equityStatus.seizureBasis || ""}
                                            onChange={(value) => reportgeneratorHandleInputChange('equityStatus', 'seizureBasis', value)}
                                            required
                                        />

                                    </div>
                                    {/* 一行多列 */}
                                    <div className="reportgenerator-form-field-vertical">
                                        {/* 利用状况 */}
                                        <TextBox
                                            label="利用状况:"
                                            Type="SearchBox"
                                            placeholder="请选择利用状况"
                                            searchList={utilizationStatusSearchList}
                                            value={reportgeneratorReportData.equityStatus.utilizationStatus || ""}
                                            onChange={(value) => reportgeneratorHandleInputChange('equityStatus', 'utilizationStatus', value)}
                                            required
                                        />

                                        {/* 条件渲染：只有当利用状况为"出租"时才显示租约选项 */}
                                        {showLeaseOption && (

                                            <TextBox
                                                label="是否考虑租约:"
                                                Type="Switch"
                                                value={reportgeneratorReportData.equityStatus.isLeaseConsidered === true}
                                                onChange={(value) => reportgeneratorHandleInputChange('equityStatus', 'isLeaseConsidered', value)}
                                                trueLabel="是"
                                                falseLabel="否"
                                            />

                                            // <div className="reportgenerator-form-field-vertical-container">
                                            //     <label className="reportgenerator-field-label"
                                            //     >是否考虑租约:</label>
                                            //     <div className="reportgenerator-toggle-switch">
                                            //         <input
                                            //             type="radio"
                                            //             id="isLeaseConsidered-yes"
                                            //             name="isLeaseConsidered"
                                            //             checked={reportgeneratorReportData.equityStatus.isLeaseConsidered === true}
                                            //             onChange={() => reportgeneratorHandleInputChange('equityStatus', 'isLeaseConsidered', true)}
                                            //             className="reportgenerator-toggle-input"
                                            //         />
                                            //         <label htmlFor="isLeaseConsidered-yes" className="reportgenerator-toggle-option reportgenerator-toggle-option-left">是</label>

                                            //         <input
                                            //             type="radio"
                                            //             id="isLeaseConsidered-no"
                                            //             name="isLeaseConsidered"
                                            //             checked={reportgeneratorReportData.equityStatus.isLeaseConsidered === false}
                                            //             onChange={() => reportgeneratorHandleInputChange('equityStatus', 'isLeaseConsidered', false)}
                                            //             className="reportgenerator-toggle-input"
                                            //         />
                                            //         <label htmlFor="isLeaseConsidered-no" className="reportgenerator-toggle-option reportgenerator-toggle-option-right">否</label>

                                            //         <span className="reportgenerator-toggle-selection"></span>
                                            //     </div>
                                            // </div>
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