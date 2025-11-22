
import { create } from 'zustand';

export type ModalType = 
    | 'createProject' 
    | 'saveProject' 
    | 'renameProject' 
    | 'deleteProject' 
    | 'layoutSelection' 
    | 'dashboardSettings' 
    | 'chartMaximize' 
    | 'kpiDetail' 
    | 'reportTemplate' 
    | 'addColumn' 
    | 'chooseColumns' 
    | 'filterRows' 
    | 'groupBy'
    | null;

interface UIState {
    // Sidebar
    isSidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;

    // Modals
    activeModal: ModalType;
    modalProps: any; // Flexible props for the active modal
    openModal: (type: ModalType, props?: any) => void;
    closeModal: () => void;

    // Analysis Views
    globalFilters: Record<string, Set<string>>;
    timeFilter: { type: string; start?: string; end?: string };
    setGlobalFilters: (filters: Record<string, Set<string>>) => void;
    setTimeFilter: (filter: { type: string; start?: string; end?: string }) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: window.innerWidth >= 1024,
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),

    activeModal: null,
    modalProps: {},
    openModal: (type, props = {}) => set({ activeModal: type, modalProps: props }),
    closeModal: () => set({ activeModal: null, modalProps: {} }),

    globalFilters: {},
    timeFilter: { type: 'all' },
    setGlobalFilters: (filters) => set({ globalFilters: filters }),
    setTimeFilter: (filter) => set({ timeFilter: filter }),
}));
