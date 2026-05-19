import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from './TextBox.module.css';

// 日期工具函数
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const TextBox = ({
  label = "标签",
  onChange,
  value,
  searchList = [],
  leftIcon = "#icon-edit",
  rightIcon = "#icon-a-duicuocuo",
  Type = "SearchBox",
  min,
  max,
  step = 1,
  placeholder,
  dateFormat = 'YYYY-MM-DD',
  editable = true,
  multiple = false,
  connector = '、',
  trueLabel = "是",
  falseLabel = "否",
  onLabelDoubleClick,
  enableInputSearch = true, // 新增属性：是否启用输入框搜索功能，默认启用
   showCondition = true,  // 新增：控制是否显示的条件
 
}) => {
  const [inputValue, setInputValue] = useState(() => {
    if (Type === "Switch") {
      if (value === true) return trueLabel;
      if (value === false) return falseLabel;
      return '';
    }
    return value || '';
  });
  
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const inputWrapperRef = useRef(null);
  const defaultPlaceholder = placeholder || (
    Type === "DatePicker" ? "请选择日期" :
      Type === "NumberInput" ? "请输入数字" :
        Type === "ComboBox" ? "请选择或输入..." :
          Type === "Switch" ? "请选择..." :
            "请输入内容..."
  );
  const inputRef = useRef(null);

  // ComboBox 多选相关状态
  const [selectedItems, setSelectedItems] = useState(() => {
    if (value && multiple) {
      if (typeof value === 'string') {
        return value.split(connector).map(s => s.trim()).filter(s => s);
      }
      return Array.isArray(value) ? value : [];
    }
    return [];
  });

  // Switch 模式内部状态
  const [switchValue, setSwitchValue] = useState(() => {
    if (Type === "Switch") {
      if (value === true) return true;
      if (value === false) return false;
      return null;
    }
    return null;
  });

  // 同步外部 value
// 同步外部 value
useEffect(() => {
  if (value !== undefined && value !== null) {
    if (Type === "ComboBox" && multiple) {
      if (typeof value === 'string') {
        const items = value.split(connector).map(s => s.trim()).filter(s => s);
        setSelectedItems(items);
        setInputValue(value);
      } else if (Array.isArray(value)) {
        setSelectedItems(value);
        setInputValue(value.join(connector));
      }
    } else if (Type === "Switch") {
      if (value === true) {
        setInputValue(trueLabel);
        setSwitchValue(true);
      } else if (value === false) {
        setInputValue(falseLabel);
        setSwitchValue(false);
      } else {
        setInputValue('');
        setSwitchValue(null);
      }
    } else if (Type === "DatePicker") {
      // DatePicker 模式：将存储格式转换为显示格式
      if (value) {
        try {
          const displayValue = formatDate(value, dateFormat);
          setInputValue(displayValue);
          const parsedDate = parseDate(value);
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            setTempDate(parsedDate);
          } else {
            const today = new Date();
            setTempDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
          }
        } catch (e) {
          console.warn('Date parsing error:', e);
          setInputValue('');
          const today = new Date();
          setTempDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
        }
      } else {
        setInputValue('');
        const today = new Date();
        setTempDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
      }
    } else if (value !== inputValue) {
      setInputValue(value);
    }
  }
}, [value, Type, multiple, connector, trueLabel, falseLabel, dateFormat]);

  // 日期选择器相关状态
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [viewMode, setViewMode] = useState('day');
  const [tempDate, setTempDate] = useState(() => {
    if (value && Type === "DatePicker") return parseDate(value);
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });
  const [yearDecadeStart, setYearDecadeStart] = useState(() => {
    const year = (value && Type === "DatePicker" ? parseDate(value) : new Date()).getFullYear();
    return Math.floor(year / 10) * 10;
  });

  // 同步年份 decade
  useEffect(() => {
    if (Type === "DatePicker") {
      const year = tempDate.getFullYear();
      setYearDecadeStart(Math.floor(year / 10) * 10);
    }
  }, [tempDate, Type]);

  // 解析日期字符串
// 解析日期 - 支持多种输入格式，返回 Date 对象
function parseDate(dateStr) {
  // 处理 null、undefined 或空值
  if (!dateStr) return new Date();
  
  // 如果已经是 Date 对象，直接返回
  if (dateStr instanceof Date) {
    return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());
  }
  
  // 如果是数字（时间戳）
  if (typeof dateStr === 'number') {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
  }
  
  // 确保是字符串
  const str = String(dateStr);
  
  // 支持 ISO 格式: 2025-12-25
  let match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  
  // 支持斜杠格式: 2025/12/25
  match = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  
  // 支持中文格式: 2025年12月25日 或 2025年1月5日
  match = str.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  
  // 尝试直接用 Date 解析
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  
  // 所有解析失败，返回当前日期
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

  // 格式化日期
// 格式化日期 - 支持自定义格式，输入可以是 Date 对象或各种日期字符串
function formatDate(dateInput, formatStr = dateFormat) {
  if (!dateInput) return '';
  
  // 解析为 Date 对象
  let d;
  if (dateInput instanceof Date) {
    d = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  } else {
    const parsed = parseDate(dateInput);
    if (isNaN(parsed.getTime())) return '';
    d = parsed;
  }
  
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  let result = formatStr;
  
  // 替换年份
  result = result.replace('YYYY', year.toString());
  
  // 替换月份（处理 MM 和 M）
  if (formatStr.includes('MM')) {
    result = result.replace('MM', String(month).padStart(2, '0'));
  } else {
    result = result.replace('M', month.toString());
  }
  
  // 替换日期（处理 DD 和 D）
  if (formatStr.includes('DD')) {
    result = result.replace('DD', String(day).padStart(2, '0'));
  } else {
    result = result.replace('D', day.toString());
  }

  return result;
}
  // 日历数据
  const calendarDays = useMemo(() => {
    if (Type !== "DatePicker") return [];
    const year = tempDate.getFullYear();
    const month = tempDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);

    let firstDay = getFirstDayOfMonth(year, month);
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const prevMonthDays = getDaysInMonth(year, month - 1);
    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  }, [tempDate, Type]);

  // 十年视图年份列表
  const decadeYears = useMemo(() => {
    const years = [];
    years.push(yearDecadeStart - 1);
    for (let i = 0; i < 10; i++) {
      years.push(yearDecadeStart + i);
    }
    years.push(yearDecadeStart + 10);
    return years;
  }, [yearDecadeStart]);

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 日期选择处理
const handleSelectDate = (date) => {
  // 存储格式：YYYY-MM-DD（ISO 格式）
  const isoFormat = formatDate(date, 'YYYY-MM-DD');
  // 显示格式：根据 dateFormat 属性
  const displayFormat = formatDate(date, dateFormat);
  
  setInputValue(displayFormat);
  onChange?.(isoFormat);  // 传递 ISO 格式给父组件
  setIsDatePickerOpen(false);
  setViewMode('day');
};

  const handleSelectMonth = (month) => {
    setTempDate(prev => new Date(prev.getFullYear(), month, 1));
    setViewMode('day');
  };

  const handleSelectYear = (year) => {
    setTempDate(prev => new Date(year, prev.getMonth(), 1));
    setViewMode('month');
  };

const handleToday = () => {
  const today = new Date();
  const isoFormat = formatDate(today, 'YYYY-MM-DD');
  const displayFormat = formatDate(today, dateFormat);
  
  setInputValue(displayFormat);
  onChange?.(isoFormat);
  setTempDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  setIsDatePickerOpen(false);
  setViewMode('day');
};

  const isSelected = (date) => {
    if (!inputValue) return false;
    const parsed = parseDate(inputValue);
    return date.getFullYear() === parsed.getFullYear() &&
      date.getMonth() === parsed.getMonth() &&
      date.getDate() === parsed.getDate();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  };

  // 日期导航
  const toPrevMonth = () => setTempDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const toNextMonth = () => setTempDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const toPrevYear = () => setTempDate(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
  const toNextYear = () => setTempDate(prev => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
  const toPrevDecade = () => setYearDecadeStart(prev => prev - 10);
  const toNextDecade = () => setYearDecadeStart(prev => prev + 10);

  // 处理主输入框的变化
  const handleInputChange = (e) => {
    let val = e.target.value;

    if (Type === "NumberInput") {
      val = val.replace(/[^0-9.-]/g, '');
      if ((val.match(/\./g) || []).length > 1) return;
      if ((val.match(/-/g) || []).length > 1) return;
      if (val.indexOf('-') > 0) return;
      setInputValue(val);
      onChange && onChange(val === '' ? '' : Number(val));
    } else if (Type === "ComboBox") {
      if (!editable) return;
      setInputValue(val);

      // 如果启用输入框搜索，则同步搜索关键词
      if (enableInputSearch) {
        setSearchQuery(val);
      }

      if (!multiple) {
        setSelectedItems([]);
        onChange?.(val);
      } else {
        onChange?.(val);
      }
    } else if (Type === "SearchBox") {
      setInputValue(val);
      onChange && onChange(val);

      // 如果启用输入框搜索，则同步搜索关键词
      if (enableInputSearch) {
        setSearchQuery(val);
      }
    } else if (Type === "Switch") {
      return;
    } else {
      setInputValue(val);
      onChange && onChange(val);
    }
  };

  // 清空输入框
  const handleClear = () => {
    if (Type === "Switch") {
      setInputValue('');
      setSwitchValue(null);
      onChange?.(null);
    } else {
      setInputValue('');
      if (Type === "ComboBox" && multiple) {
        setSelectedItems([]);
      }
      onChange && onChange(multiple ? [] : '');

      // 清空搜索关键词
      if (enableInputSearch && (Type === "SearchBox" || Type === "ComboBox")) {
        setSearchQuery('');
      }
    }
    inputRef.current?.focus();
  };

  // NumberInput 增减
  const handleIncrement = () => {
    const currentVal = inputValue === '' ? 0 : Number(inputValue);
    const newVal = currentVal + step;
    if (max !== undefined && newVal > max) return;
    setInputValue(newVal);
    onChange && onChange(newVal);
    inputRef.current?.focus();
  };

  const handleDecrement = () => {
    const currentVal = inputValue === '' ? 0 : Number(inputValue);
    const newVal = currentVal - step;
    if (min !== undefined && newVal < min) return;
    setInputValue(newVal);
    onChange && onChange(newVal);
    inputRef.current?.focus();
  };

  // 输入框获得焦点时显示下拉
  const handleInputFocus = () => {
    if (Type === "SearchBox" || Type === "ComboBox" || Type === "Switch") {
      setIsDropdownVisible(true);
      // 如果启用输入框搜索且当前有值，在显示下拉时同步当前输入值到搜索框
      if (enableInputSearch && (Type === "SearchBox" || Type === "ComboBox") && inputValue) {
        setSearchQuery(inputValue);
      }
    }
  };

  // 点击输入框区域（DatePicker 模式）
  const handleDatePickerClick = () => {
    if (Type === "DatePicker") {
      setIsDatePickerOpen(!isDatePickerOpen);
      setViewMode('day');
      setIsDropdownVisible(false);
    }
  };

  // Switch 模式：选择 true/false
  const handleSwitchSelect = (newValue) => {
    const displayText = newValue === true ? trueLabel : falseLabel;
    setInputValue(displayText);
    setSwitchValue(newValue);
    onChange?.(newValue);
    setIsDropdownVisible(false);
  };

  // 处理 ComboBox 选项的勾选
  const handleCheckboxChange = (item, isChecked) => {
    let newSelectedItems;
    if (isChecked) {
      newSelectedItems = [...selectedItems, item];
    } else {
      newSelectedItems = selectedItems.filter(selected => selected !== item);
    }

    setSelectedItems(newSelectedItems);
    const displayValue = newSelectedItems.join(connector);
    setInputValue(displayValue);

    onChange?.(multiple ? newSelectedItems : displayValue);
  };

  // 处理单选模式下的选项选择
  const handleSingleSelect = (item) => {
    setInputValue(item);
    setSelectedItems([item]);
    onChange?.(item);
    setIsDropdownVisible(false);
    setSearchQuery(''); // 清空搜索
  };

  // 选择下拉项 (SearchBox 模式)
  const handleSelectItem = (item) => {
    setInputValue(item);
    onChange && onChange(item);
    setIsDropdownVisible(false);
    setSearchQuery(''); // 清空搜索
    inputRef.current?.focus();
  };

  // 搜索输入框变化处理
  const handleSearchInputChange = (e) => {
    e.stopPropagation();
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
        setSearchQuery('');
        setIsDatePickerOpen(false);
        setViewMode('day');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 搜索过滤
  const getFilteredData = () => {
    if (enableInputSearch) {
      return searchList.filter(item =>
        item.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      return searchList.filter(item =>
        item.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  };

  const filteredData = getFilteredData();

  const handleKeyDown = (e) => {
    if (Type === "NumberInput") {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      }
    }
  };

  // 渲染 Switch 下拉面板
  const renderSwitchPanel = () => {
    if (Type !== "Switch" || !isDropdownVisible) return null;

    const options = [
      { label: trueLabel, value: true },
      { label: falseLabel, value: false }
    ];

    return (
      <div className={styles.dropdownPanel}>
        <ul className={styles.resultList}>
          {options.map((option) => (
            <li
              key={option.label}
              className={`${styles.resultItem} ${switchValue === option.value ? styles.selectedItem : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSwitchSelect(option.value);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // 渲染 SearchBox 下拉面板
  const renderSearchBoxPanel = () => {
    if (Type !== "SearchBox" || !isDropdownVisible || searchList.length === 0) return null;

    return (
      <div className={styles.dropdownPanel}>
        {/* 只在未启用输入框搜索时显示搜索输入框 */}
        {!enableInputSearch && (
          <input
            type="text"
            className={styles.dropdownSearchInput}
            placeholder="搜索选项..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        )}

        {/* 启用输入框搜索时的提示 */}
        {/*  {enableInputSearch && (
          <div className={styles.searchHint} style={{ padding: '8px 12px', fontSize: '12px', color: '#999', borderBottom: '1px solid #eee' }}>
            💡 在输入框中输入关键词进行搜索
          </div>
        )}*/}

        <ul className={styles.resultList}>
          {filteredData.length > 0 ? (
            filteredData.map((item, index) => (
              <li
                key={index}
                className={styles.resultItem}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectItem(item);
                }}
              >
                {item}
              </li>
            ))
          ) : (
            <li className={styles.resultItem} style={{ color: '#999' }}>无匹配内容</li>
          )}
        </ul>
      </div>
    );
  };

  // 渲染 ComboBox 下拉面板
  const renderComboBoxPanel = () => {
    if (Type !== "ComboBox" || !isDropdownVisible) return null;

    return (
      <div className={styles.dropdownPanel}>
        {/* 只在未启用输入框搜索时显示搜索输入框 */}
        {editable && !enableInputSearch && (
          <input
            type="text"
            className={styles.dropdownSearchInput}
            placeholder="搜索选项..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        )}

        {/* 启用输入框搜索时的提示 */}
        {/*  {editable && enableInputSearch && (
          <div className={styles.searchHint} style={{ padding: '8px 12px', fontSize: '12px', color: '#999', borderBottom: '1px solid #eee' }}>
            💡 在输入框中输入关键词进行搜索
          </div>
        )}*/}

        <ul className={styles.resultList}>
          {filteredData.length > 0 ? (
            filteredData.map((item, index) => {
              const isChecked = selectedItems.includes(item);

              if (multiple) {
                return (
                  <li
                    key={index}
                    className={`${styles.resultItem} ${styles.checkboxItem}`}
                    onClick={() => handleCheckboxChange(item, !isChecked)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <span className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => { }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </span>
                    <span className={styles.itemText}>{item}</span>
                  </li>
                );
              } else {
                return (
                  <li
                    key={index}
                    className={`${styles.resultItem} ${selectedItems[0] === item ? styles.selectedItem : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSingleSelect(item);
                    }}
                  >
                    {item}
                  </li>
                );
              }
            })
          ) : (
            <li className={styles.resultItem} style={{ color: '#999' }}>无匹配内容</li>
          )}
        </ul>
      </div>
    );
  };

  // 渲染日期选择器面板
  const renderDatePickerPanel = () => {
    if (Type !== "DatePicker" || !isDatePickerOpen) return null;

    const renderHeader = () => {
      if (viewMode === 'day') {
        return (
          <div className={styles.dateHeaderBar}>
            <button className={styles.dateNavBtn} onClick={toPrevYear} title="上一年">«</button>
            <button className={styles.dateNavBtn} onClick={toPrevMonth} title="上一月">‹</button>
            <div className={styles.dateTitleGroup}>
              <span className={styles.dateClickableTitle} onClick={() => setViewMode('year')}>
                {tempDate.getFullYear()}年
              </span>
              <span className={styles.dateClickableTitle} onClick={() => setViewMode('month')}>
                {tempDate.getMonth() + 1}月
              </span>
            </div>
            <button className={styles.dateNavBtn} onClick={toNextMonth} title="下一月">›</button>
            <button className={styles.dateNavBtn} onClick={toNextYear} title="下一年">»</button>
          </div>
        );
      }

      if (viewMode === 'month') {
        return (
          <div className={styles.dateHeaderBar}>
            <button className={styles.dateNavBtn} onClick={toPrevYear} title="上一年">«</button>
            <span className={styles.dateClickableTitle} onClick={() => setViewMode('year')}>
              {tempDate.getFullYear()}年
            </span>
            <button className={styles.dateNavBtn} onClick={toNextYear} title="下一年">»</button>
          </div>
        );
      }

      if (viewMode === 'year') {
        return (
          <div className={styles.dateHeaderBar}>
            <button className={styles.dateNavBtn} onClick={toPrevDecade} title="前十年">«</button>
            <span className={styles.dateNormalTitle}>
              {yearDecadeStart}年 - {yearDecadeStart + 9}年
            </span>
            <button className={styles.dateNavBtn} onClick={toNextDecade} title="后十年">»</button>
          </div>
        );
      }
    };

    const renderContent = () => {
      if (viewMode === 'day') {
        return (
          <>
            <div className={styles.dateWeekdays}>
              {['一', '二', '三', '四', '五', '六', '日'].map(day => (
                <div key={day} className={styles.dateWeekday}>{day}</div>
              ))}
            </div>
            <div className={styles.dateDaysGrid}>
              {calendarDays.map((item, index) => {
                const date = item.date;
                return (
                  <div
                    key={index}
                    className={`${styles.dateDayCell} ${!item.isCurrentMonth ? styles.dateOtherMonth : ''} ${isSelected(date) ? styles.dateSelected : ''} ${isToday(date) ? styles.dateToday : ''}`}
                    onClick={() => handleSelectDate(date)}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
            <div className={styles.dateFooter}>
              <button className={styles.dateTodayBtn} onClick={handleToday}>今天</button>
            </div>
          </>
        );
      }

      if (viewMode === 'month') {
        return (
          <div className={styles.dateMonthGrid}>
            {months.map((month, index) => (
              <div
                key={month}
                className={`${styles.dateMonthCell} ${tempDate.getMonth() === index ? styles.dateActive : ''}`}
                onClick={() => handleSelectMonth(index)}
              >
                {month}
              </div>
            ))}
          </div>
        );
      }

      if (viewMode === 'year') {
        const currentYear = tempDate.getFullYear();
        return (
          <div className={styles.dateYearGrid}>
            {decadeYears.map((year) => {
              const isInDecade = year >= yearDecadeStart && year <= yearDecadeStart + 9;
              return (
                <div
                  key={year}
                  className={`${styles.dateYearCell} ${!isInDecade ? styles.dateOutOfDecade : ''} ${currentYear === year ? styles.dateActive : ''}`}
                  onClick={() => isInDecade && handleSelectYear(year)}
                >
                  {year}
                </div>
              );
            })}
          </div>
        );
      }
    };

    return (
      <div className={styles.datePickerPanel}>
        {renderHeader()}
        <div className={styles.datePanelBody}>
          {renderContent()}
        </div>
      </div>
    );
  };
 if (!showCondition) return null;
  return (
    <div className={styles.container} ref={containerRef}>
      <label className={styles.label}
        onDoubleClick={(e) => {
          if (onLabelDoubleClick) {
            onLabelDoubleClick(e);
          }
        }}
      >
        {label}
      </label>

      <div className={styles.inputWrapper} ref={inputWrapperRef}>
        {/* 左边图标 */}
        <svg className={styles.icon} aria-hidden="true">
          <use xlinkHref={leftIcon}></use>
        </svg>

        <input
          ref={inputRef}
          type="text"
          className={`${styles.input} ${Type === "NumberInput" ? styles.numberInput : ''} 
    ${Type === "DatePicker" ? styles.dateInput : ''}`}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={defaultPlaceholder}
          inputMode={Type === "NumberInput" ? "numeric" : "text"}
          readOnly={Type === "DatePicker" || Type === "Switch" || (Type === "ComboBox" && !editable)}
          onClick={(e) => {
            if (Type === "DatePicker") {
              e.stopPropagation();
              handleDatePickerClick();
            }
          }}
        />

        {/* 清空图标逻辑 */}
        {((Type === "SearchBox" || Type === "ComboBox") && inputValue) ||
          (Type === "Switch" && inputValue) ? (
          <svg
            className={`${styles.icon} ${styles.rightIcon}`}
            aria-hidden="true"
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
          >
            <use xlinkHref={rightIcon}></use>
          </svg>
        ) : null}

        {/* ComboBox 模式：下拉箭头图标 */}
        {Type === "ComboBox" && !inputValue && (
          <svg
            className={`${styles.icon} ${styles.rightIcon}`}
            aria-hidden="true"
          >
            <use xlinkHref="#icon-arrow-down"></use>
          </svg>
        )}

        {/* Switch 模式：下拉箭头图标 */}
        {Type === "Switch" && !inputValue && (
          <svg
            className={`${styles.icon} ${styles.rightIcon}`}
            aria-hidden="true"
          >
            <use xlinkHref="#icon-arrow-down"></use>
          </svg>
        )}

        {/* DatePicker 模式：右侧图标 */}
        {Type === "DatePicker" && (
          inputValue ? (
            <svg
              className={`${styles.icon} ${styles.rightIcon}`}
              aria-hidden="true"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
            >
              <use xlinkHref={rightIcon}></use>
            </svg>
          ) : (
            <svg
              className={`${styles.icon} ${styles.rightIcon}`}
              aria-hidden="true"
            >
              <use xlinkHref="#icon-rili2"></use>
            </svg>
          )
        )}

        {/* NumberInput 模式：加减按钮 */}
        {Type === "NumberInput" && (
          <div className={styles.numberControls}>
            <button
              className={styles.numberBtn}
              onClick={(e) => { e.stopPropagation(); handleIncrement(); }}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex={-1}
            >
              <svg className={styles.numberIcon} aria-hidden="true">
                <use xlinkHref="#icon-arrow-up-bold"></use>
              </svg>
            </button>
            <button
              className={styles.numberBtn}
              onClick={(e) => { e.stopPropagation(); handleDecrement(); }}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex={-1}
            >
              <svg className={styles.numberIcon} aria-hidden="true">
                <use xlinkHref="#icon-arrow-down-bold"></use>
              </svg>
            </button>
          </div>
        )}

        {/* SearchBox 模式：下拉搜索界面 */}
        {renderSearchBoxPanel()}

        {/* ComboBox 模式：下拉多选/单选界面 */}
        {renderComboBoxPanel()}

        {/* Switch 模式：下拉选择界面 */}
        {renderSwitchPanel()}

        {/* DatePicker 模式：日期选择面板 */}
        {renderDatePickerPanel()}
      </div>
    </div>
  );
};

export default TextBox;