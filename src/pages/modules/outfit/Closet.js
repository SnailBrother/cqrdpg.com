import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Closet.css';

const Closet = () => {
    const [showMannequin, setShowMannequin] = useState(false);
    const [wardrobeData, setWardrobeData] = useState({
        tops: [],
        bottoms: [],
        dresses: [],
        shoes: [],
        accessories: []
    });
    const [activeTab, setActiveTab] = useState('tops');
    const [selectedItems, setSelectedItems] = useState({
        top: null,
        bottom: null,
        dress: null,
        shoes: null,
        accessories: []
    });
    const [showEffect, setShowEffect] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [itemTransforms, setItemTransforms] = useState({});
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fetchWardrobeData = async () => {
            try {
                const response = await fetch('/api/getWardrobeStewardData');
                const data = await response.json();
                if (data.success) {
                    setWardrobeData(data.data);
                }
            } catch (error) {
                console.error('Error fetching wardrobe data:', error);
            }
        };

        fetchWardrobeData();
    }, []);

    const toggleMannequin = () => {
        setShowMannequin(!showMannequin);
    };

    const toggleEffect = () => {
        setShowEffect(!showEffect);
    };

    const handleItemClick = (item, type) => {
        const itemKey = `${type}-${item.id}`;
        
        // 初始化变换数据（如果不存在）
        if (!itemTransforms[itemKey]) {
            setItemTransforms(prev => ({
                ...prev,
                [itemKey]: { x: 0, y: 0, scale: 1 }
            }));
        }
        
        // 设置当前选中的衣物
        setSelectedItemId(itemKey);
        
        // 更新选中的衣物
        if (type === 'tops') {
            setSelectedItems(prev => ({ ...prev, top: item, dress: null }));
        } else if (type === 'bottoms') {
            setSelectedItems(prev => ({ ...prev, bottom: item, dress: null }));
        } else if (type === 'dresses') {
            setSelectedItems(prev => ({ ...prev, dress: item, top: null, bottom: null }));
        } else if (type === 'shoes') {
            setSelectedItems(prev => ({ ...prev, shoes: item }));
        } else if (type === 'accessories') {
            setSelectedItems(prev => ({
                ...prev,
                accessories: prev.accessories.includes(item) ? 
                    prev.accessories.filter(acc => acc.id !== item.id) : 
                    [...prev.accessories, item]
            }));
        }
    };

    const getFilteredItems = () => {
        const items = wardrobeData[activeTab] || [];
        return searchTerm ? 
            items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) : 
            items;
    };

    const getImageUrl = (item) => {
        return showEffect && item ? item.effectImage : item.image;
    };

    // 处理衣物拖动开始
    const handleDragStart = (e, itemKey) => {
        setDragging(true);
        setSelectedItemId(itemKey);
        setStartPos({
            x: e.clientX - (itemTransforms[itemKey]?.x || 0),
            y: e.clientY - (itemTransforms[itemKey]?.y || 0)
        });
        e.preventDefault();
    };

    // 处理衣物拖动
    const handleDrag = (e) => {
        if (!dragging || !selectedItemId) return;
        
        const newX = e.clientX - startPos.x;
        const newY = e.clientY - startPos.y;
        
        setItemTransforms(prev => ({
            ...prev,
            [selectedItemId]: {
                ...prev[selectedItemId],
                x: newX,
                y: newY
            }
        }));
    };

    // 处理拖动结束
    const handleDragEnd = () => {
        setDragging(false);
    };

    // 处理缩放
    const handleZoom = (direction, itemKey) => {
        setSelectedItemId(itemKey);
        setItemTransforms(prev => ({
            ...prev,
            [itemKey]: {
                ...prev[itemKey],
                scale: direction === 'in' ? 
                    Math.min((prev[itemKey]?.scale || 1) + 0.1, 2) : 
                    Math.max((prev[itemKey]?.scale || 1) - 0.1, 0.5)
            }
        }));
    };

    // 移除配饰
    const removeAccessory = (id) => {
        setSelectedItems(prev => ({
            ...prev,
            accessories: prev.accessories.filter(acc => acc.id !== id)
        }));
        
        // 清除变换数据
        const itemKey = `accessories-${id}`;
        setItemTransforms(prev => {
            const newTransforms = { ...prev };
            delete newTransforms[itemKey];
            return newTransforms;
        });
    };

    // 渲染衣物项
    const renderClothingItem = (type, item) => {
        if (!item) return null;
        
        const itemKey = `${type}-${item.id}`;
        const transform = itemTransforms[itemKey] || { x: 0, y: 0, scale: 1 };
        const isSelected = selectedItemId === itemKey;
        
        return (
            <div
                key={itemKey}
                className={`mannequin-${type} ${isSelected ? 'selected' : ''}`}
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: 'center center',
                    cursor: 'move',
                    zIndex: isSelected ? 10 : 1
                }}
                onMouseDown={(e) => handleDragStart(e, itemKey)}
            >
                <img
                    src={getImageUrl(item)}
                    alt={item.name}
                    className={`mannequin-${type}-img`}
                    draggable="false"
                />
                {isSelected && (
                    <div className="item-controls">
                        <button onClick={() => handleZoom('in', itemKey)}>+</button>
                        <button onClick={() => handleZoom('out', itemKey)}>-</button>
                    </div>
                )}
            </div>
        );
    };

    // 渲染配饰
    const renderAccessories = () => {
        return selectedItems.accessories.map(accessory => {
            const itemKey = `accessories-${accessory.id}`;
            const transform = itemTransforms[itemKey] || { x: 100, y: 100, scale: 1 };
            const isSelected = selectedItemId === itemKey;
            
            return (
                <div
                    key={accessory.id}
                    className={`accessory-item ${isSelected ? 'selected' : ''}`}
                    style={{
                        position: 'absolute',
                        left: `${transform.x}px`,
                        top: `${transform.y}px`,
                        transform: `scale(${transform.scale})`,
                        transformOrigin: 'center center',
                        zIndex: isSelected ? 10 : 1,
                        cursor: 'move'
                    }}
                    onMouseDown={(e) => handleDragStart(e, itemKey)}
                >
                    <img
                        src={getImageUrl(accessory)}
                        alt={accessory.name}
                        draggable="false"
                    />
                    <button 
                        className="remove-accessory-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeAccessory(accessory.id);
                        }}
                    >
                        ×
                    </button>
                    {isSelected && (
                        <div className="item-controls">
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleZoom('in', itemKey);
                            }}>+</button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleZoom('out', itemKey);
                            }}>-</button>
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div 
            className="wardrobe-container"
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
        >
            <div className="wardrobe-content-container">
                {/* 穿搭预览效果界面 */}
                <div className="wardrobe-results-container">
                    {/* 顶部功能 */}
                    <div className="wardrobe-results-header-container">
                        <h2 className="wardrobe-results-title">预览效果</h2>
                        <div className="wardrobe-results-function-container">
                            <button 
                                onClick={toggleEffect}
                                className={`wardrobe-effect-btn ${showEffect ? 'active' : ''}`}
                            >
                                {showEffect ? '普通视图' : '上身效果'}
                            </button>
                            <button
                                onClick={toggleMannequin}
                                className={`wardrobe-mannequin-btn ${showMannequin ? 'active' : ''}`}
                            >
                                {showMannequin ? '隐藏模特' : '显示模特'}
                            </button>
                        </div>
                    </div>

                    {/* 模特展示区域 */}
                    <div className="wardrobe-mannequin" style={{ backgroundImage: showMannequin ? "url('mannequin.png')" : "none" }}>
                        <div className="image-container">
                            {/* 头 */}
                            <div className="mannequin-header"></div>
                            {/* 衣服 */}
                            {renderClothingItem('top', selectedItems.top)}
                            {renderClothingItem('dress', selectedItems.dress)}
                            {!selectedItems.dress && renderClothingItem('bottom', selectedItems.bottom)}
                            {renderClothingItem('shoes', selectedItems.shoes)}
                            {renderAccessories()}
                        </div>
                    </div>
                </div>

                {/* 衣物选择界面 */}
                <div className="wardrobe-preview-container">
                    <div className="wardrobe-preview-header">
                        <h2 className="wardrobe-preview-title">衣物选择</h2>
                        <Link to="/updatewardrobesteward" className="wardrobe-preview-link">&gt;&gt;</Link>
                    </div>

                    <div className="wardrobe-preview-content-container">
                        <div className="wardrobe-preview-tab-container">
                            <div className="wardrobe-preview-tab-nav-container">
                                {['tops', 'bottoms', 'dresses', 'shoes', 'accessories'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                    >
                                        {{ tops: '上衣', bottoms: '裤子', dresses: '连衣裙', shoes: '鞋子', accessories: '配饰' }[tab]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="wardrobe-previewimage-container">
                            <div className="wardrobe-preview-search-container">
                                <input
                                    type="text"
                                    placeholder="搜索衣物..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="wardrobe-search-input"
                                />
                            </div>

                            <div className="wardrobe-preview-items-container">
                                {getFilteredItems().map(item => (
                                    <div
                                        key={item.id}
                                        className="wardrobe-item"
                                        onClick={() => handleItemClick(item, activeTab)}
                                    >
                                        <div className="wardrobe-item-image-container">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="wardrobe-item-image"
                                            />
                                        </div>
                                        <p className="wardrobe-item-name">{item.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Closet;
