"use client";

import Link from "next/link";
import { Layers, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';

interface CreateFirstModuleProps {
  courseId?: string;
}

export const CreateFirstModule = ({ courseId }: CreateFirstModuleProps) => {
  const t = useTranslations();
  return (
    <div className="bg-white p-15">
      <div className="text-center space-y-4">
        <Layers className="h-16 w-16 mx-auto text-muted-foreground" />
        <h2 className="text-2xl font-bold">{t('teacher.dashboard.firstModuleText')}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('teacher.dashboard.firstModuleDesc')}
        </p>
        <div className="pt-4">
          <Link href={`/teacher/modules/create${courseId ? `?preselectedCourseId=${courseId}` : ''}`}>
            <Button
              size="lg"
              className="bg-primaryStyling text-white hover:bg-indigo-700 cursor-pointer"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              {t('common.buttons.createModule')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
