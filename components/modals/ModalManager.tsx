
import React from 'react';
import { useUIStore } from '../../store/uiStore.ts';
import { useProjectStore } from '../../store/projectStore.ts';
import { LayoutInfo } from '../../types.ts';

// Import all modals
import { CreateProjectModal } from './CreateProjectModal.tsx';
import { SaveProjectModal } from './SaveProjectModal.tsx';
import { RenameProjectModal } from './RenameProjectModal.tsx';
import { DeleteConfirmationModal } from './DeleteConfirmationModal.tsx';
import { LayoutSelectionModal } from '../../features/dashboard/components/modals/LayoutSelectionModal.tsx';
import { DashboardSettingsModal } from '../../features/dashboard/components/modals/DashboardSettingsModal.tsx';
import { ChartMaximizeModal } from '../../features/dashboard/components/modals/ChartMaximizeModal.tsx';
import { KpiDetailModal } from '../../features/dashboard/components/modals/KpiDetailModal.tsx';
import { ReportTemplateSelectionModal } from '../../features/report-studio/components/modals/ReportTemplateSelectionModal.tsx';
import { AddColumnModal } from '../../features/data-studio/components/modals/AddColumnModal.tsx';
import { ChooseColumnsModal } from './ChooseColumnsModal.tsx';
import { FilterRowsModal } from '../../features/data-studio/components/modals/FilterRowsModal.tsx';
import { GroupByModal } from '../../features/data-studio/components/modals/GroupByModal.tsx';

const LAYOUTS: LayoutInfo[] = [
  { id: '2-2-2', name: 'Balanced Grid', rows: [2, 2, 2], totalCharts: 6, description: 'Standard layout with 6 charts.', usedBy: 'General Purpose' },
  { id: '3-3', name: 'Dense Grid', rows: [3, 3], totalCharts: 6, description: 'Compact view for smaller charts.', usedBy: 'Data Heavy Dashboards' },
  { id: '1-2-2', name: 'Hero Chart', rows: [1, 2, 2], totalCharts: 5, description: 'One large chart followed by supporting metrics.', usedBy: 'Executive Summary' },
  { id: '2-3-2', name: 'Middle Density', rows: [2, 3, 2], totalCharts: 7, description: 'Good balance for 7 metrics.', usedBy: 'Operational Dashboards' },
  { id: '3-4', name: 'Maximum Density', rows: [3, 4], totalCharts: 7, description: 'High density view.', usedBy: 'Monitoring' }
];

export const ModalManager: React.FC = () => {
    const { activeModal, modalProps, closeModal } = useUIStore();
    const { projects, activeProjectId } = useProjectStore();
    const activeProject = projects.find(p => p.id === activeProjectId);

    if (!activeModal) return null;

    // Wrappers to inject store actions if needed, or pass props directly
    switch (activeModal) {
        case 'createProject':
            return <CreateProjectModal isOpen={true} onClose={closeModal} {...modalProps} />;
        case 'saveProject':
            return <SaveProjectModal isOpen={true} onClose={closeModal} {...modalProps} />;
        case 'renameProject':
            return <RenameProjectModal isOpen={true} onClose={closeModal} {...modalProps} />;
        case 'deleteProject':
            return <DeleteConfirmationModal isOpen={true} onClose={closeModal} {...modalProps} />;
        case 'layoutSelection':
            return <LayoutSelectionModal isOpen={true} onClose={closeModal} layouts={LAYOUTS} {...modalProps} />;
        case 'dashboardSettings':
            return activeProject ? <DashboardSettingsModal isOpen={true} onClose={closeModal} project={activeProject} layouts={LAYOUTS} {...modalProps} /> : null;
        case 'chartMaximize':
            return <ChartMaximizeModal isOpen={true} onClose={closeModal} {...modalProps} />;
        case 'kpiDetail':
            return activeProject ? <KpiDetailModal isOpen={true} onClose={closeModal} project={activeProject} {...modalProps} /> : null;
        case 'reportTemplate':
            return <ReportTemplateSelectionModal isOpen={true} onClose={closeModal} {...modalProps} />;
        case 'addColumn':
            return <AddColumnModal onClose={closeModal} {...modalProps} />;
        case 'chooseColumns':
            return <ChooseColumnsModal onClose={closeModal} {...modalProps} />;
        case 'filterRows':
            return <FilterRowsModal onClose={closeModal} {...modalProps} />;
        case 'groupBy':
            return <GroupByModal onClose={closeModal} {...modalProps} />;
        default:
            return null;
    }
};
