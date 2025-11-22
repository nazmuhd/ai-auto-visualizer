
import React from 'react';
import { useUIStore } from '../../store/uiStore.ts';
import { useProjectStore } from '../../store/projectStore.ts';

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
            return <LayoutSelectionModal isOpen={true} onClose={closeModal} {...modalProps} />;
        case 'dashboardSettings':
            return activeProject ? <DashboardSettingsModal isOpen={true} onClose={closeModal} project={activeProject} {...modalProps} /> : null;
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
