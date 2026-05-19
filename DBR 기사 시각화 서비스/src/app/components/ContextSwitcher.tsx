import { ChevronDown, Clock, Star, Grid, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';

interface ContextSwitcherProps {
  onSelect: (context: string) => void;
  currentContext: string;
  darkMode?: boolean;
  language?: string;
}

interface ContextItem {
  id: string;
  name: string;
  type: 'project' | 'strategy' | 'workspace';
  lastUsed?: Date;
  isFavorite?: boolean;
}

export function ContextSwitcher({ onSelect, currentContext, darkMode = false, language = 'ko' }: ContextSwitcherProps) {
  const t = {
    ko: {
      currentContext: '현재 컨텍스트',
      searchPlaceholder: '프로젝트, 전략, 워크스페이스 검색...',
      createNew: '새 항목 만들기',
      name: '이름',
      namePlaceholder: '예: 신규 마케팅 캠페인',
      type: '유형',
      create: '생성하기',
      recentSelections: '최근 선택',
      favorites: '즐겨찾기',
      searchResults: '검색 결과',
      newProject: '새 프로젝트 생성',
      project: '프로젝트',
      strategy: '전략',
      workspace: '워크스페이스',
    },
    en: {
      currentContext: 'Current Context',
      searchPlaceholder: 'Search projects, strategies, workspaces...',
      createNew: 'Create New Item',
      name: 'Name',
      namePlaceholder: 'e.g., New Marketing Campaign',
      type: 'Type',
      create: 'Create',
      recentSelections: 'Recent Selections',
      favorites: 'Favorites',
      searchResults: 'Search Results',
      newProject: 'Create New Project',
      project: 'Project',
      strategy: 'Strategy',
      workspace: 'Workspace',
    }
  };
  const text = language === 'en' ? t.en : t.ko;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<'project' | 'strategy' | 'workspace'>('project');

  const [items, setItems] = useState<ContextItem[]>([
    { id: '1', name: '디지털 전환 프로젝트', type: 'project', lastUsed: new Date(), isFavorite: true },
    { id: '2', name: '소셜미디어 마케팅', type: 'strategy', lastUsed: new Date(Date.now() - 3600000) },
    { id: '3', name: 'Q2 전략 워크스페이스', type: 'workspace', lastUsed: new Date(Date.now() - 7200000) },
    { id: '4', name: '글로벌 확장 전략', type: 'strategy', isFavorite: true },
    { id: '5', name: '리스크 분석 대시보드', type: 'workspace', isFavorite: true },
    { id: '6', name: 'M&A 검토 프로젝트', type: 'project' },
    { id: '7', name: '비용 절감 전략', type: 'strategy' },
    { id: '8', name: '고객 분석 워크스페이스', type: 'workspace' },
  ]);

  const recentItems = items.filter(i => i.lastUsed).sort((a, b) =>
    (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0)
  ).slice(0, 3);

  const savedItems = items.filter(i => i.isFavorite);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    if (darkMode) {
      switch (type) {
        case 'project': return 'bg-[#444655] text-[#A9AABC]';
        case 'strategy': return 'bg-green-900 text-green-300';
        case 'workspace': return 'bg-purple-900 text-purple-300';
        default: return 'bg-gray-700 text-gray-300';
      }
    } else {
      switch (type) {
        case 'project': return 'bg-gray-100 text-[#142755]';
        case 'strategy': return 'bg-green-100 text-green-700';
        case 'workspace': return 'bg-purple-100 text-purple-700';
        default: return 'bg-gray-100 text-gray-700';
      }
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'project': return text.project;
      case 'strategy': return text.strategy;
      case 'workspace': return text.workspace;
      default: return '';
    }
  };

  const handleCreate = () => {
    if (!newProjectName.trim()) return;

    const newItem: ContextItem = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      type: newProjectType,
      lastUsed: new Date(),
      isFavorite: false,
    };

    setItems([newItem, ...items]);
    onSelect(newItem.name);
    setNewProjectName('');
    setIsCreating(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 ${darkMode ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : 'bg-white border-gray-300 hover:bg-gray-50'} border rounded-lg transition-colors w-full`}
      >
        <div className="flex-1 text-left min-w-0">
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{text.currentContext}</div>
          <div className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentContext}</div>
        </div>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setIsCreating(false);
            }}
          />
          <div className={`absolute top-full left-0 right-0 mt-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-2xl z-50 min-w-[400px] max-h-[600px] overflow-hidden flex flex-col`}>
            {/* 검색 */}
            <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="relative">
                <Search className={`absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={text.searchPlaceholder}
                  className={`w-full pl-8 pr-3 py-2 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142755]`}
                />
              </div>
            </div>

            {isCreating ? (
              /* 새 프로젝트 생성 폼 */
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{text.createNew}</h3>
                  <button
                    onClick={() => setIsCreating(false)}
                    className={`${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>{text.name}</label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                      placeholder={text.namePlaceholder}
                      className={`w-full px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142755]`}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>{text.type}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['project', 'strategy', 'workspace'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setNewProjectType(type)}
                          className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                            newProjectType === type
                              ? getTypeColor(type)
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {getTypeLabel(type)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCreate}
                    disabled={!newProjectName.trim()}
                    className="w-full px-4 py-2 bg-[#142755] text-white text-sm rounded-lg hover:bg-[#444655] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {text.create}
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto">
                {/* 최근 선택 */}
                <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <h3 className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>{text.recentSelections}</h3>
                  </div>
                  <div className="space-y-1">
                    {recentItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelect(item.name);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors group`}
                      >
                        <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${getTypeColor(item.type)} flex-shrink-0`}>
                          {getTypeLabel(item.type)}
                        </span>
                        <span className={`text-sm flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</span>
                        {item.isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 즐겨찾기 */}
                <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <h3 className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>{text.favorites}</h3>
                  </div>
                  <div className="space-y-1">
                    {savedItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelect(item.name);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                      >
                        <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${getTypeColor(item.type)} flex-shrink-0`}>
                          {getTypeLabel(item.type)}
                        </span>
                        <span className={`text-sm flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 검색 결과 */}
                {searchQuery && (
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Grid className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <h3 className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>
                        {text.searchResults} ({filteredItems.length})
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {filteredItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelect(item.name);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                        >
                          <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${getTypeColor(item.type)} flex-shrink-0`}>
                            {getTypeLabel(item.type)}
                          </span>
                          <span className={`text-sm flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</span>
                          {item.isFavorite && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 새로 생성 버튼 */}
            {!isCreating && (
              <div className={`p-3 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}>
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#142755] text-white rounded-lg hover:bg-[#444655] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs font-medium">{text.newProject}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
