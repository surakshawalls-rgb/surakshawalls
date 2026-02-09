/**
 * Date formatting utilities
 */

/**
 * Converts date string from YYYY-MM-DD format to DD-MM-YYYY
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted date string in DD-MM-YYYY format
 */
export function formatDateToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  
  // Handle YYYY-MM-DD format
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  
  return dateStr;
}

/**
 * Converts date string from DD-MM-YYYY format to YYYY-MM-DD
 * @param dateStr - Date string in DD-MM-YYYY format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateToYYYYMMDD(dateStr: string): string {
  if (!dateStr) return '';
  
  // Handle DD-MM-YYYY format
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  
  return dateStr;
}

/**
 * Gets today's date in YYYY-MM-DD format
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayYYYYMMDD(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Gets today's date in DD/MM/YYYY format
 * @returns Today's date in DD/MM/YYYY format
 */
export function getTodayDDMMYYYY(): string {
  return formatDateToDDMMYYYY(getTodayYYYYMMDD());
}
