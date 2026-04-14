export default function GenericAdminTableContent({
  tabName,
  cfg,
  isFeaturedTab,
  filters,
  search,
  onSearchChange,
  filterValues,
  onFilterValueChange,
  filterOptions,
  displayed,
  loading,
  sortKey,
  sortDir,
  onSort,
  onSave,
  CellComponent,
  styles,
  formatFilterOption,
  renderRowActions,
  rowActionsHeaderLabel = 'Actions',
}) {
  const showRowActions = typeof renderRowActions === 'function'

  return (
    <div style={styles.card}>
      <div style={styles.toolbar}>
        <div style={styles.filterRow}>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${tabName.toLowerCase()}…`}
            style={styles.searchInput}
          />

          {filters.map((filter) => (
            <select
              key={filter.key}
              value={filterValues[filter.key] || ''}
              onChange={(e) => onFilterValueChange(filter.key, e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">{filter.placeholder}</option>
              {(filterOptions[filter.key] || []).map((option) => (
                <option key={option} value={option}>
                  {formatFilterOption(option)}
                </option>
              ))}
            </select>
          ))}

          <span style={styles.countBadge}>{displayed.length} shown</span>
        </div>
      </div>

      <div style={styles.tableWrap}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>No records match.</div>
        ) : (
          <table style={styles.table}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                {cfg.fields.map((field) => (
                  <th
                    key={field.key}
                    style={isFeaturedTab ? styles.featuredTh : styles.th}
                    onClick={() => onSort(field.key)}
                    title="Click to sort"
                  >
                    {field.label}
                    {sortKey === field.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}

                {showRowActions ? (
                  <th style={isFeaturedTab ? styles.featuredTh : styles.th}>
                    {rowActionsHeaderLabel}
                  </th>
                ) : null}
              </tr>
            </thead>

            <tbody>
              {displayed.map((record) => (
                <tr key={record.id}>
                  {cfg.fields.map((field) => (
                    <CellComponent
                      key={field.key}
                      tableName={cfg.table}
                      record={record}
                      field={field}
                      onSave={onSave}
                      isFeaturedTab={isFeaturedTab}
                      styles={styles}
                      formatFilterOption={formatFilterOption}
                    />
                  ))}

                  {showRowActions ? (
                    <td style={isFeaturedTab ? styles.featuredTd : styles.td}>
                      {renderRowActions(record)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}