# Unused Files

The following files have been deprecated or replaced by new features and can be safely deleted from the codebase to maintain a clean project structure. Their content has been "neutralized" (emptied) in the current codebase.

## Pages & Routing
*   `components/LandingPage.tsx`
*   `components/pages/LoginPage.tsx`
*   `components/pages/SignupPage.tsx`
*   `components/pages/AboutPage.tsx`
*   `components/pages/ContactPage.tsx`
*   `components/pages/PricingPage.tsx`
*   `components/pages/AccountPage.tsx`
*   `components/pages/SettingsPage.tsx`

## Landing Page Components
*   `components/landing/Header.tsx`
*   `components/landing/HeroSection.tsx`
*   `components/landing/HowItWorksSection.tsx`
*   `components/landing/AboutSection.tsx`
*   `components/landing/SolutionsSection.tsx`
*   `components/landing/ComparisonSection.tsx`
*   `components/landing/TestimonialsSection.tsx`
*   `components/landing/FAQSection.tsx`
*   `components/landing/FinalCTASection.tsx`
*   `components/landing/WhyChooseUsSection.tsx`
*   `components/Footer.tsx`
*   `components/ui/hero-section.tsx`

## Deprecated/Replaced Components
*   `components/AIReportView.tsx` (Replaced by `features/report-studio`)
*   `components/DataStudio.tsx` (Replaced by `features/data-studio`)
*   `components/DataPreview.tsx` (Replaced by `components/EmbeddedDataPreview.tsx`)
*   `components/FileUpload.tsx` (Replaced by `components/FileUploadContainer.tsx`)
*   `components/DataTable.tsx` (Replaced by `features/data-studio/components/DataTable.tsx`)
*   `components/FilterPanel.tsx` (Replaced by `features/dashboard/components/FilterBar.tsx`)
*   `components/DataScanner.tsx` (Logic moved to hooks)
*   `components/EmbeddedFileUpload.tsx` (Replaced by `components/FileUploadContainer.tsx`)

## Deprecated Modals
*   `components/LoginModal.tsx`
*   `components/SaveDashboardModal.tsx` (Replaced by `components/modals/SaveProjectModal.tsx`)
*   `components/HelpModal.tsx`
*   `components/SettingsModal.tsx`
*   `components/modals/RenameDashboardModal.tsx` (Replaced by `components/modals/RenameProjectModal.tsx`)
*   `components/modals/ContactModal.tsx`
*   `components/modals/KpiManagerModal.tsx` (Replaced by `features/dashboard/components/modals/DashboardSettingsModal.tsx`)
