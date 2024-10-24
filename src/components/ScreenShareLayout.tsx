import React, { useState, useEffect, type ReactNode } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScreenShareLayoutProps {
  isScreenSharing: boolean;
  screenContent: ReactNode;
  sharerInfo: string | null;
  children: ReactNode;
}

const ScreenShareLayout: React.FC<ScreenShareLayoutProps> = ({ 
  isScreenSharing,
  screenContent,
  sharerInfo,
  children 
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <div className="relative w-full h-full">
      {isScreenSharing && (
        <div className={`${isMaximized ? 'fixed inset-0 z-50' : 'relative w-full h-full'}`}>
          {/* 分享畫面容器 */}
          <div className="relative w-full h-full bg-black">
            {screenContent}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
              {sharerInfo}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-black/70 text-white hover:bg-black/90"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
      
      {/* 視訊畫面容器 */}
      <div className={`
        ${isScreenSharing ? 'absolute' : 'relative'} 
        ${isMaximized ? 'bottom-4 right-4 w-64 h-auto z-50' : 'w-full h-full'}
        ${isScreenSharing ? 'transition-all duration-300' : ''}
      `}>
        {children}
      </div>
    </div>
  );
};

export default ScreenShareLayout;