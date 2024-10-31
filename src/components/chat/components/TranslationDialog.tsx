import React from 'react';
import { TranslationLanguage, AllLanguages, LanguageConfig } from '@/config/translation';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from '@/components/ui/separator';

interface TranslationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  autoTranslateLanguage: TranslationLanguage;
  onAutoTranslateChange: (lang: TranslationLanguage) => void;
  onTranslateClick: (lang: TranslationLanguage) => void;
  addSystemMessage: (message: string) => void;
  translationConfig: {
    languages: Record<AllLanguages, LanguageConfig>;
  };
}

interface TranslationButtonProps {
  code: TranslationLanguage;
  lang: LanguageConfig;
  isActive: boolean;
  onClick: (lang: TranslationLanguage) => void;
}

const TranslationButton: React.FC<TranslationButtonProps> = ({
  code,
  lang,
  isActive,
  onClick
}) => (
  <Button 
    variant={isActive ? "default" : "outline"}
    onClick={() => onClick(code)}
  >
    {lang.displayName}
    {isActive && " ✓"}
  </Button>
);

const AutoTranslateSection: React.FC<{
  autoTranslateLanguage: TranslationLanguage;
  onAutoTranslateChange: (lang: TranslationLanguage) => void;
  translationConfig: { languages: Record<AllLanguages, LanguageConfig> };
}> = ({ autoTranslateLanguage, onAutoTranslateChange, translationConfig }) => (
  <div>
    <h4 className="font-medium">即時翻譯</h4>
    <div className="grid grid-cols-1 gap-2 mt-2">
      <Button 
        variant={autoTranslateLanguage === ('none' as TranslationLanguage) ? "default" : "outline"}
        onClick={() => onAutoTranslateChange('none' as TranslationLanguage)}
      >
        關閉翻譯
        {autoTranslateLanguage === ('none' as TranslationLanguage) && " ✓"}
      </Button>
      <div className="grid grid-cols-1 gap-2">
        {(Object.entries(translationConfig.languages) as [AllLanguages, LanguageConfig][])
          .filter(([code]) => code !== 'none')
          .map(([code, lang]) => (
            <TranslationButton
              key={code}
              code={code as TranslationLanguage}
              lang={lang}
              isActive={autoTranslateLanguage === code}
              onClick={onAutoTranslateChange}
            />
          ))}
      </div>
    </div>
  </div>
);

const ManualTranslateSection: React.FC<{
  onTranslateClick: (lang: TranslationLanguage) => void;
  translationConfig: { languages: Record<AllLanguages, LanguageConfig> };
}> = ({ onTranslateClick, translationConfig }) => (
  <div>
    <h4 className="font-medium">聊天記錄翻譯</h4>
    <div className="grid grid-cols-2 gap-2 mt-2">
      {(Object.entries(translationConfig.languages) as [AllLanguages, LanguageConfig][])
        .filter(([code]) => code !== 'none')
        .map(([code, lang]) => (
          <Button 
            key={code}
            variant="outline"
            onClick={() => onTranslateClick(code as TranslationLanguage)}
          >
            {lang.displayName}
          </Button>
        ))}
    </div>
  </div>
);

export const TranslationDialog: React.FC<TranslationDialogProps> = ({
  isOpen,
  onOpenChange,
  autoTranslateLanguage,
  onAutoTranslateChange,
  onTranslateClick,
  addSystemMessage,
  translationConfig
}) => {
  const handleAutoTranslateChange = (lang: TranslationLanguage) => {
    onAutoTranslateChange(lang);
    addSystemMessage(
      lang === ('none' as TranslationLanguage)
        ? '已關閉即時翻譯'
        : `已開啟即時翻譯（${translationConfig.languages[lang].displayName}）`
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>翻譯設定</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <AutoTranslateSection
              autoTranslateLanguage={autoTranslateLanguage}
              onAutoTranslateChange={handleAutoTranslateChange}
              translationConfig={translationConfig}
            />

            <Separator className="my-4" />
            
            <ManualTranslateSection
              onTranslateClick={onTranslateClick}
              translationConfig={translationConfig}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};