import React from 'react';

function GoalFilters({ activeTab, onTabChange, cycles, selectedCycle, onCycleChange, searchTerm, onSearchChange }) {
    var tabs = [
        { key: 'my', label: 'My Goals' },
        { key: 'team', label: 'My Team' },
        { key: 'all', label: 'All Goals' },
    ];

    return (
        <div className="goals-filters">
            <div className="goals-filters__tabs">
                {tabs.map(function (tab) {
                    return (
                        <button
                            key={tab.key}
                            className={'goals-filters__tab' + (activeTab === tab.key ? ' goals-filters__tab--active' : '')}
                            onClick={function () { onTabChange(tab.key); }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="goals-filters__controls" style={{ display: 'flex', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Search goals..." 
                    value={searchTerm} 
                    onChange={function (e) { onSearchChange(e.target.value); }}
                    className="goals-filters__search"
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
                <select
                    className="goals-filters__cycle-select"
                    value={selectedCycle}
                    onChange={function (e) { onCycleChange(e.target.value); }}
                >
                    <option value="">All Cycles</option>
                    {cycles.map(function (c) {
                        return <option key={c._id} value={c._id}>{c.name} ({c.year})</option>;
                    })}
                </select>
            </div>
        </div>
    );
}

export default GoalFilters;
