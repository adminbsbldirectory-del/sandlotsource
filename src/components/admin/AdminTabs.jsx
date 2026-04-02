export default function AdminTabs({
  tabs,
  featuredTabs,
  activeTab,
  onTabChange,
  styles,
}) {
  return (
    <div style={styles.tabs}>
      {tabs.map((tab) => {
        const isFeatured = featuredTabs.includes(tab)
        const isActive = activeTab === tab

        return (
          <button
            key={tab}
            type="button"
            style={isFeatured ? styles.featuredTab(isActive) : styles.tab(isActive)}
            onClick={() => onTabChange(tab)}
          >
            {isFeatured ? `★ ${tab}` : tab}
          </button>
        )
      })}
    </div>
  )
}