'use client';

import Link from 'next/link';
import Image from 'next/image';
import { generateColorFromString } from '@/lib/menu-list';

export type StudentModuleCardProps = {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  updated_at?: string;
  createdAt?: string;
  courseId?: string;
  courseName?: string;
  href?: string;
  viewMode?: 'grid' | 'list';
  deadline?: string;
  teacherUsername?: string;
};

// Function to determine if text should be white or black based on background color
const getTextColor = (backgroundColor: string): string => {
  // For HSL colors, we can use a more accurate calculation
  const match = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (match && match[1] && match[2] && match[3]) {
    const h = parseInt(match[1], 10);
    const s = parseInt(match[2], 10) / 100;
    const l = parseInt(match[3], 10) / 100;
    
    // Calculate relative luminance using the W3C formula
    const getRGB = (h: number, s: number, l: number) => {
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = l - c / 2;
      
      let r, g, b;
      if (h >= 0 && h < 60) {
        [r, g, b] = [c, x, 0];
      } else if (h >= 60 && h < 120) {
        [r, g, b] = [x, c, 0];
      } else if (h >= 120 && h < 180) {
        [r, g, b] = [0, c, x];
      } else if (h >= 180 && h < 240) {
        [r, g, b] = [0, x, c];
      } else if (h >= 240 && h < 300) {
        [r, g, b] = [x, 0, c];
      } else {
        [r, g, b] = [c, 0, x];
      }
      
      return [r + m, g + m, b + m];
    };
    
    const [r, g, b] = getRGB(h, s, l);
    
    // Convert to sRGB for luminance calculation
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    // Calc relative luminance
    const luminance = 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    
    // WCAG contrast threshold is 4.5:1 for normal text
    return luminance > 0.4 ? 'text-gray-900' : 'text-white';
  }
  
  // Fallback to white text if we can't determine
  return 'text-white';
};

// Generate semester code and color based on deadline date
const getSemesterInfo = (dateString: string) => {
  if (!dateString) return { code: 'N/A', color: '#9ca3af' };
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  
  // Norwegian semester system: V = Vår (Spring), H = Høst (Fall)
  const semesterPrefix = month >= 1 && month <= 6 ? 'V' : 'H';
  const code = `${semesterPrefix}${year}`;
  
  // Use consistent color generation with a unique identifier for semester
  const semesterKey = `semester-${code}`;
  return {
    code,
    color: generateColorFromString(semesterKey)
  };
};

// Generate avatar color and initial for teacher
const getTeacherAvatar = (username?: string) => {
  if (!username) return { initial: '?', color: '#9ca3af' };
  
  const initial = username.charAt(0).toUpperCase();
  
  // Generate color based on initial
  const charCode = initial.charCodeAt(0);
  const hue = (charCode * 15) % 360;
  const color = `hsl(${hue}, 75%, 65%)`;
  
  return { initial, color };
};

const StudentModuleCard = ({ 
  id, 
  title, 
  description,
  thumbnail_url,
  updated_at,
  createdAt,
  courseId, 
  courseName,
  href,
  viewMode = 'grid',
  deadline,
  teacherUsername
}: StudentModuleCardProps) => {
  const lastUpdated = updated_at || createdAt || '';
  const displayText = description || '';
  const route = href || (
    courseId 
      ? `/student/courses/${courseId}/modules/${id}`
      : `/student/modules/${id}`
  );
  
  // Generate course pill styles if courseName is provided
  const coursePillBg = courseName ? generateColorFromString(courseName) : '';
  const coursePillTextColor = courseName ? getTextColor(coursePillBg) : '';
  
  // Generate semester pill information based on deadline
  const deadlineDate = deadline || '';
  const { code: semesterCode, color: semesterColor } = getSemesterInfo(deadlineDate);
  const semesterTextColor = getTextColor(semesterColor);
  
  // Generate teacher avatar
  const { initial: teacherInitial, color: teacherAvatarColor } = getTeacherAvatar(teacherUsername);
  
  if (viewMode === 'list') {
    return (
      <div className="relative group">
        <Link href={route} className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary/50 hover:shadow-xl shadow-sm transition-all h-24">
            <div className="flex items-center gap-4 h-full">
              <div className="relative flex-shrink-0">
                <div className="relative w-24 h-16 rounded-md overflow-hidden">
                  {thumbnail_url ? (
                    thumbnail_url.startsWith('#') ? (
                      <div 
                        className="absolute inset-0" 
                        style={{ backgroundColor: thumbnail_url }}
                      />
                    ) : (
                      <Image 
                        src={thumbnail_url} 
                        alt={`${title} thumbnail`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                <div className="flex items-center gap-2 mb-1">
                  {courseName && (
                    <div 
                      className={`px-3 py-1 rounded-full text-xs font-medium ${coursePillTextColor}`}
                      style={{ backgroundColor: coursePillBg }}
                    >
                      {courseName}
                    </div>
                  )}
                  <div 
                    className={`px-3 py-1 rounded-full text-xs font-medium ${semesterTextColor}`}
                    style={{ backgroundColor: semesterColor }}
                  >
                    {semesterCode}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors truncate">{title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-1">{displayText}</p>
                </div>
              </div>
              {teacherUsername && (
                <div 
                  className="absolute bottom-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-md"
                  style={{ backgroundColor: teacherAvatarColor }}
                >
                  {teacherInitial}
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative group h-full">
      <Link href={route} className="block h-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-transparent hover:shadow-xl transition-all h-full flex flex-col group-hover:scale-[1.02] duration-300">
          <div className="relative w-full pt-[50%] flex-shrink-0 rounded-t-xl overflow-hidden">
            {thumbnail_url ? (
              thumbnail_url.startsWith('#') ? (
                <div 
                  className="absolute inset-0 rounded-t-xl"
                  style={{ backgroundColor: thumbnail_url }}
                />
              ) : (
                <Image 
                  src={thumbnail_url} 
                  alt={`${title} thumbnail`}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="group-hover:scale-105 transition-transform duration-500 rounded-t-xl"
                />
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-purple-200 rounded-t-xl" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-t-xl" />
          </div>
          
          <div className="p-3 flex flex-col flex-1 relative rounded-b-xl">
            <div className="flex flex-wrap gap-2 mb-2">
              {courseName && (
                <div 
                  className={`px-3 py-1 rounded-full text-xs font-medium ${coursePillTextColor}`}
                  style={{ backgroundColor: coursePillBg }}
                >
                  {courseName}
                </div>
              )}
              <div 
                className={`px-3 py-1 rounded-full text-xs font-medium ${semesterTextColor}`}
                style={{ backgroundColor: semesterColor }}
              >
                {semesterCode}
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2">{title}</h2>
            </div>
            
            <div className="mt-auto pt-2 flex justify-between items-center">
              <span className="text-xs font-medium text-muted-foreground">
                Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'N/A'}
              </span>
              
              {teacherUsername && (
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
                  style={{ backgroundColor: teacherAvatarColor }}
                >
                  {teacherInitial}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default StudentModuleCard; 