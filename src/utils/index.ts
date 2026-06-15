export const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const generateToken = (): string => {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
};

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm');
};

export const daysBetween = (date1: string | Date, date2: string | Date): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const daysFromNow = (date: string | Date): number => {
  return daysBetween(new Date(), date);
};

export const addDays = (date: string | Date, days: number): Date => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const validateEmail = (email: string): boolean => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  if (!phone) return true;
  return /^1[3-9]\d{9}$/.test(phone);
};

export const validateIdCard = (idCard: string): boolean => {
  if (!idCard) return true;
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard);
};

export const validateChineseName = (name: string): boolean => {
  if (!name) return false;
  return /^[\u4e00-\u9fa5·•]{2,20}$/.test(name.trim());
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
};

export const downloadFile = (content: Blob | string, filename: string): void => {
  let blob: Blob;
  if (typeof content === 'string') {
    blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  } else {
    blob = content;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const maskIdCard = (idCard: string): string => {
  if (!idCard || idCard.length < 8) return idCard;
  return idCard.slice(0, 4) + '**********' + idCard.slice(-4);
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timer: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

export const validateName = validateChineseName;

export const generateSubmitLink = (token: string): string => {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#/submit/${token}`;
};
