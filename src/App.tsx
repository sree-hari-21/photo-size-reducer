import React, { useState } from 'react';
import { ArchitectureView } from './components/ArchitectureView';
import { DesktopHeader } from './components/DesktopHeader';
import { DesktopSidebar } from './components/DesktopSidebar';
import { FileConverter } from './components/FileConverter/FileConverter';
import { ImageStudio } from './components/ImageStudio/ImageStudio';
import { PdfEditor } from './components/PdfEditor/PdfEditor';
import { StatusBar } from './components/StatusBar';
import { WorkspaceTab } from './types';
import { createSamplePdfFile, createSamplePhotoFile } from './utils/mockSamples';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('image');
  const [statusMessage, setStatusMessage] = useState<string>(
    'OmniStudio Desktop Ready. Select a workspace or click "Sample Photo" / "Sample PDF" to test.'
  );
  const [activeDetails, setActiveDetails] = useState<string | undefined>('100% Local Engine');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Active files passed across views
  const [activeImageFile, setActiveImageFile] = useState<File | null>(null);
  const [activePdfFile, setActivePdfFile] = useState<File | null>(null);

  // Sample photo generator trigger
  const handleLoadSamplePhoto = async () => {
    setIsProcessing(true);
    setStatusMessage('Generating sample high-resolution identification portrait...');
    try {
      const file = await createSamplePhotoFile();
      setActiveImageFile(file);
      setActiveTab('image');
      setIsProcessing(false);
      setStatusMessage('Loaded Sample Photo (1200x1200 px). Ready for resizing & captioning.');
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  // Sample PDF generator trigger
  const handleLoadSamplePdf = async () => {
    setIsProcessing(true);
    setStatusMessage('Generating sample 3-page executive PDF document...');
    try {
      const file = await createSamplePdfFile();
      setActivePdfFile(file);
      setActiveTab('pdf');
      setIsProcessing(false);
      setStatusMessage('Loaded Sample 3-Page PDF Document. Ready for page reordering & annotations.');
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleStatusChange = (msg: string, details?: string) => {
    setStatusMessage(msg);
    if (details) setActiveDetails(details);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#F5F5F7] font-sans text-[#1C1C1E] overflow-hidden select-none">
      {/* Desktop Top Header Bar */}
      <DesktopHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoadSampleImage={handleLoadSamplePhoto}
        onLoadSamplePdf={handleLoadSamplePdf}
        activeFileName={activePdfFile?.name || activeImageFile?.name}
        isProcessing={isProcessing}
      />

      {/* Main App Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <DesktopSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          imageCount={activeImageFile ? 1 : 0}
          pdfPagesCount={activePdfFile ? 3 : 0}
        />

        {/* Primary Workspace Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#F5F5F7]">
          {activeTab === 'image' && (
            <ImageStudio
              onStatusChange={handleStatusChange}
              onSetIsProcessing={setIsProcessing}
              initialFile={activeImageFile}
            />
          )}

          {activeTab === 'pdf' && (
            <PdfEditor
              onStatusChange={handleStatusChange}
              onSetIsProcessing={setIsProcessing}
              initialPdfFile={activePdfFile}
            />
          )}

          {activeTab === 'converter' && (
            <FileConverter
              onStatusChange={handleStatusChange}
              onSetIsProcessing={setIsProcessing}
              initialPdfFile={activePdfFile}
            />
          )}

          {activeTab === 'architecture' && <ArchitectureView />}
        </main>
      </div>

      {/* Bottom Desktop Status Bar */}
      <StatusBar statusMessage={statusMessage} activeDetails={activeDetails} />
    </div>
  );
}
