// Helper functions for pill generation and styling

export const generateColorFromString = (str: string | undefined): string => {
  if (!str || typeof str !== 'string' || str.length === 0) { 
    return 'hsl(220, 10%, 70%)'; // Default for empty/undefined string
  }

  // Logic from lib/menu-list.ts
  const prefix = str.match(/^[A-Za-z]+/);
  const mainPrefix = prefix ? prefix[0].toUpperCase() : str;
  
  let hash = 0;
  for (let i = 0; i < mainPrefix.length; i++) {
    hash = mainPrefix.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const primaryHue = Math.abs(hash) % 360;
  
  let secondaryHash = 0;
  for (let i = 0; i < str.length; i++) {
    secondaryHash = str.charCodeAt(i) + ((secondaryHash << 5) - secondaryHash);
  }
  
  const hueVariation = (secondaryHash % 41) - 20; // Range from -20 to +20
  const finalHue = (primaryHue + hueVariation + 360) % 360;
  
  const s = 85; // Saturation from lib/menu-list.ts
  const l = 65; // Lightness from lib/menu-list.ts

  return `hsl(${finalHue}, ${s}%, ${l}%)`;
};

export const getTextColor = (backgroundColor: string): string => {
  if (!backgroundColor || typeof backgroundColor !== 'string') {
    return 'text-white'; // Fallback for invalid input
  }
  const match = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (match && match[1] && match[2] && match[3]) {
    const h = parseInt(match[1], 10);
    const s_val_percent = parseInt(match[2], 10) / 100;
    const l_val_percent = parseInt(match[3], 10) / 100;

    const getRGB = (h_val: number, s_val: number, l_val: number) => {
      const c = (1 - Math.abs(2 * l_val - 1)) * s_val;
      const x = c * (1 - Math.abs(((h_val / 60) % 2) - 1));
      const m = l_val - c / 2;
      let r_val, g_val, b_val;
      if (h_val >= 0 && h_val < 60) { [r_val, g_val, b_val] = [c, x, 0]; }
      else if (h_val >= 60 && h_val < 120) { [r_val, g_val, b_val] = [x, c, 0]; }
      else if (h_val >= 120 && h_val < 180) { [r_val, g_val, b_val] = [0, c, x]; }
      else if (h_val >= 180 && h_val < 240) { [r_val, g_val, b_val] = [0, x, c]; }
      else if (h_val >= 240 && h_val < 300) { [r_val, g_val, b_val] = [x, 0, c]; }
      else { [r_val, g_val, b_val] = [c, 0, x]; }
      return [r_val + m, g_val + m, b_val + m];
    };

    const [r, g, b] = getRGB(h, s_val_percent, l_val_percent);
    const sRGB = [r, g, b].map(c_val => {
      return c_val <= 0.03928 ? c_val / 12.92 : Math.pow((c_val + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    return luminance > 0.4 ? 'text-gray-900' : 'text-white';
  }
  return 'text-white';
};

export const getSemesterInfo = (dateString?: string) => {
  if (!dateString) return { code: 'N/A', color: 'hsl(220, 10%, 70%)' };

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; 

  const semesterPrefix = month >= 1 && month <= 6 ? 'V' : 'H';
  const code = `${semesterPrefix}${year}`;
  const semesterKey = `semester-${code}`;
  return {
    code,
    color: generateColorFromString(semesterKey)
  };
}; 