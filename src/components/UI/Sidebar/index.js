//// src/components/UI/Sidebar/index.js   侧边栏页面
import React from 'react';
import IconButton from '../IconButton';
import styles from './Sidebar.module.css';

// 菜单项组件
const MenuItem = ({
  item,
  isActive,
  isCollapsed,
  onClick
}) => {
  return (
    <div
      className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
      onClick={() => onClick(item)}
      title={isCollapsed ? item.label : ''}
    >
      <span className={styles.menuIcon}>
        <svg className={styles.menuSvgIcon} aria-hidden="true">
          <use xlinkHref={item.icon}></use>
        </svg>
      </span>

      {!isCollapsed && (
        <span className={styles.menuLabel}>{item.label}</span>
      )}
      {!isCollapsed && item.children && (
        <span className={styles.arrow}>▶</span>
      )}
    </div>
  );
};

// 侧边栏组件 - 现在只负责 UI 渲染
const Sidebar = ({
  menuItems = [],
  activeKey,
  onMenuClick,
  collapsed = false,
  onToggle
}) => {
  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>

      <div className={styles.sidebarHeader}>

        {/* {!collapsed && <h3 className={styles.sidebarTitle}>
          <svg className={styles.SidebarLayouticon} aria-hidden="true">
            <use xlinkHref="#icon-shouye3"></use>
          </svg>
        </h3>} */}

        <IconButton
          icon={collapsed ? "#icon-zhankaizhedieyou" : "#icon-zhankaizhediezuo"}
          onClick={onToggle}
          title={collapsed ? '展开菜单' : '折叠菜单'}
          variant="ghost"
          size="small"
        />
      </div>

      <div className={styles.menu}>
        {menuItems.map(item => (
          <MenuItem
            key={item.key}
            item={item}
            isActive={activeKey === item.key}
            isCollapsed={collapsed}
            onClick={onMenuClick}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;