// 示例1：使用文字导航
<SlidingNavView
    pages={[
        { component: ComponentA, props: { data: 'some data' } },
        { component: ComponentB, props: {} },
        { component: ComponentC, props: {} }
    ]}
    labels={['页面1', '页面2', '页面3']}
    navType="text"
    navPosition="floating"
    activeColor="#ff6b6b"
    onPageChange={(index) => console.log('Page changed:', index)}
/>

// 示例2：使用点状导航，不显示指示器
<SlidingNavView
    pages={pages}
    navType="dots"
    navPosition="inline"
    showIndicator={false}
    defaultIndex={1}
    activeColor="#4ecdc4"
    inactiveColor="#95a5a6"
/>

// 示例3：自定义导航渲染
<SlidingNavView
    pages={pages}
    renderNav={(activeIndex, onChange) => (
        <div style={{ display: 'flex', gap: '20px' }}>
            {['第一页', '第二页', '第三页'].map((label, i) => (
                <button
                    key={i}
                    onClick={() => onChange(i)}
                    style={{
                        color: activeIndex === i ? 'red' : 'black',
                        fontWeight: activeIndex === i ? 'bold' : 'normal'
                    }}
                >
                    {label}
                </button>
            ))}
        </div>
    )}
/>