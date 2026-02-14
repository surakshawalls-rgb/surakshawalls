// src/app/services/library.service.ts
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseService } from './supabase.service';

export interface LibraryStudent {
  id: string;
  name: string;
  mobile: string;
  emergency_contact: string;
  emergency_contact_name?: string;
  address: string;
  dob?: string;
  gender?: 'Male' | 'Female';
  photo_url?: string;
  joining_date: string;
  registration_fee_paid: number;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LibrarySeat {
  seat_no: number;
  full_time_student_id?: string;
  full_time_expiry?: string;
  first_half_student_id?: string;
  first_half_expiry?: string;
  second_half_student_id?: string;
  second_half_expiry?: string;
  updated_at: string;
  
  // Populated from joins
  full_time_student?: LibraryStudent;
  first_half_student?: LibraryStudent;
  second_half_student?: LibraryStudent;
}

export interface LibraryFeePayment {
  id: string;
  student_id: string;
  seat_no: number;
  shift_type: 'full_time' | 'first_half' | 'second_half' | 'registration';
  amount_paid: number;
  payment_date: string;
  valid_from: string;
  valid_until: string;
  payment_mode: 'cash' | 'upi' | 'card' | 'other';
  transaction_reference?: string;
  notes?: string;
  created_at: string;
}

export interface LibraryExpense {
  id: string;
  date: string;
  category: 'electricity' | 'wifi' | 'water' | 'cleaning' | 'maintenance' | 'stationery' | 'other';
  amount: number;
  vendor_name?: string;
  description?: string;
  payment_mode: string;
  created_at: string;
}

export interface LibraryAttendance {
  id: string;
  student_id: string;
  date: string;
  check_in_time: string;
  check_out_time?: string;
  status: 'present' | 'late' | 'absent';
  created_at: string;
  
  // Populated from joins
  student?: LibraryStudent;
}

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private SEATS_CACHE_KEY = 'library_seats_cache';
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private platformId = inject(PLATFORM_ID);

  constructor(private supabase: SupabaseService) {}

  // ========================================
  // CACHE MANAGEMENT
  // ========================================

  private getCachedSeats(): LibrarySeat[] | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const cached = sessionStorage.getItem(this.SEATS_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - timestamp > this.CACHE_DURATION) {
        sessionStorage.removeItem(this.SEATS_CACHE_KEY);
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  }

  private setCachedSeats(seats: LibrarySeat[]) {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      sessionStorage.setItem(this.SEATS_CACHE_KEY, JSON.stringify({
        data: seats,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('[LibraryService] Failed to cache seats:', error);
    }
  }

  clearSeatsCache() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.SEATS_CACHE_KEY);
    }
  }

  // ========================================
  // STUDENT MANAGEMENT
  // ========================================

  async getAllStudents(status?: 'active' | 'inactive'): Promise<LibraryStudent[]> {
    try {
      let query = this.supabase.supabase
        .from('library_students')
        .select('*')
        .order('name');

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[LibraryService] getAllStudents error:', error);
      throw error;
    }
  }

  async getStudentById(id: string): Promise<LibraryStudent | null> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('library_students')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('[LibraryService] getStudentById error:', error);
      return null;
    }
  }

  async getStudentByMobile(mobile: string): Promise<LibraryStudent | null> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('library_students')
        .select('*')
        .eq('mobile', mobile)
        .single();

      if (error) {
        // If no student found, return null
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (error: any) {
      console.error('[LibraryService] getStudentByMobile error:', error);
      return null;
    }
  }

  async addStudent(student: Partial<LibraryStudent>): Promise<{success: boolean, student?: LibraryStudent, error?: string}> {
    try {
      // Clean the student object - convert empty strings to null for date fields
      const cleanedStudent = { ...student };
      if (cleanedStudent.dob === '') {
        cleanedStudent.dob = null as any;
      }
      if (cleanedStudent.joining_date === '') {
        cleanedStudent.joining_date = null as any;
      }
      
      const { data, error } = await this.supabase.supabase
        .from('library_students')
        .insert(cleanedStudent)
        .select()
        .single();

      if (error) throw error;
      return { success: true, student: data };
    } catch (error: any) {
      console.error('[LibraryService] addStudent error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateStudent(id: string, updates: Partial<LibraryStudent>): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await this.supabase.supabase
        .from('library_students')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('[LibraryService] updateStudent error:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // SEAT MANAGEMENT
  // ========================================

  async getAllSeats(useCache: boolean = true): Promise<LibrarySeat[]> {
    try {
      // Check cache if enabled
      if (useCache) {
        const cached = this.getCachedSeats();
        if (cached) {
          console.log('[LibraryService] Using cached seats');
          return cached;
        }
      }

      // Fetch from database
      console.log('[LibraryService] Fetching seats from database with student joins');
      const { data, error } = await this.supabase.supabase
        .from('library_seats')
        .select(`
          *,
          full_time_student:library_students!library_seats_full_time_student_id_fkey(*),
          first_half_student:library_students!library_seats_first_half_student_id_fkey(*),
          second_half_student:library_students!library_seats_second_half_student_id_fkey(*)
        `)
        .order('seat_no');

      if (error) {
        console.error('[LibraryService] Supabase query error:', error);
        throw error;
      }
      
      const seats = data || [];
      console.log('[LibraryService] Fetched seats count:', seats.length);
      console.log('[LibraryService] Sample seat data:', seats[0]);
      
      // Verify student data is loaded
      const seatsWithStudents = seats.filter(s => 
        s.full_time_student || s.first_half_student || s.second_half_student
      );
      console.log('[LibraryService] Seats with students:', seatsWithStudents.length);
      
      // Cache the result
      if (useCache) {
        this.setCachedSeats(seats);
      }
      
      return seats;
    } catch (error: any) {
      console.error('[LibraryService] getAllSeats error:', error);
      throw error;
    }
  }

  async assignSeat(
    seatNo: number, 
    studentId: string, 
    shiftType: 'full_time' | 'first_half' | 'second_half',
    validUntil: string
  ): Promise<{success: boolean, error?: string}> {
    try {
      const updates: any = {};

      if (shiftType === 'full_time') {
        updates.full_time_student_id = studentId;
        updates.full_time_expiry = validUntil;
        // Clear half shifts if assigning full time
        updates.first_half_student_id = null;
        updates.first_half_expiry = null;
        updates.second_half_student_id = null;
        updates.second_half_expiry = null;
      } else if (shiftType === 'first_half') {
        updates.first_half_student_id = studentId;
        updates.first_half_expiry = validUntil;
        // Clear full time if assigning half
        updates.full_time_student_id = null;
        updates.full_time_expiry = null;
      } else if (shiftType === 'second_half') {
        updates.second_half_student_id = studentId;
        updates.second_half_expiry = validUntil;
        // Clear full time if assigning half
        updates.full_time_student_id = null;
        updates.full_time_expiry = null;
      }

      const { error } = await this.supabase.supabase
        .from('library_seats')
        .update(updates)
        .eq('seat_no', seatNo);

      if (error) throw error;
      
      // Clear cache after seat modification
      this.clearSeatsCache();
      
      return { success: true };
    } catch (error: any) {
      console.error('[LibraryService] assignSeat error:', error);
      return { success: false, error: error.message };
    }
  }

  async releaseSeat(seatNo: number, shiftType?: 'full_time' | 'first_half' | 'second_half'): Promise<{success: boolean, error?: string}> {
    try {
      const updates: any = {};

      if (!shiftType || shiftType === 'full_time') {
        updates.full_time_student_id = null;
        updates.full_time_expiry = null;
      }
      
      if (!shiftType || shiftType === 'first_half') {
        updates.first_half_student_id = null;
        updates.first_half_expiry = null;
      }
      
      if (!shiftType || shiftType === 'second_half') {
        updates.second_half_student_id = null;
        updates.second_half_expiry = null;
      }

      const { error } = await this.supabase.supabase
        .from('library_seats')
        .update(updates)
        .eq('seat_no', seatNo);

      if (error) throw error;
      
      // Clear cache after seat modification
      this.clearSeatsCache();
      
      return { success: true };
    } catch (error: any) {
      console.error('[LibraryService] releaseSeat error:', error);
      return { success: false, error: error.message };
    }
  }

  async changeSeat(
    studentId: string,
    oldSeatNo: number,
    newSeatNo: number,
    shiftType: 'full_time' | 'first_half' | 'second_half',
    expiryDate: string
  ): Promise<{success: boolean, error?: string}> {
    try {
      // 1. Release old seat
      const releaseResult = await this.releaseSeat(oldSeatNo, shiftType);
      if (!releaseResult.success) {
        throw new Error('Failed to release old seat: ' + releaseResult.error);
      }

      // 2. Assign to new seat
      const updates: any = {};
      
      if (shiftType === 'full_time') {
        updates.full_time_student_id = studentId;
        updates.full_time_expiry = expiryDate;
      } else if (shiftType === 'first_half') {
        updates.first_half_student_id = studentId;
        updates.first_half_expiry = expiryDate;
      } else if (shiftType === 'second_half') {
        updates.second_half_student_id = studentId;
        updates.second_half_expiry = expiryDate;
      }

      const { error } = await this.supabase.supabase
        .from('library_seats')
        .update(updates)
        .eq('seat_no', newSeatNo);

      if (error) throw error;
      
      // Clear cache after seat modification
      this.clearSeatsCache();
      
      return { success: true };
    } catch (error: any) {
      console.error('[LibraryService] changeSeat error:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // FEE PAYMENTS
  // ========================================

  async recordFeePayment(payment: Partial<LibraryFeePayment>): Promise<{success: boolean, payment?: LibraryFeePayment, error?: string}> {
    try {
      // 1. Insert payment record
      const { data: paymentData, error: paymentError } = await this.supabase.supabase
        .from('library_fee_payments')
        .insert(payment)
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 2. Record in library cash ledger
      await this.supabase.supabase
        .from('library_cash_ledger')
        .insert({
          date: payment.payment_date,
          type: 'income',
          category: payment.shift_type === 'registration' ? 'Registration Fee' : 'Seat Rental',
          amount: payment.amount_paid,
          description: `${payment.shift_type} payment - Seat ${payment.seat_no}`,
          payment_mode: payment.payment_mode,
          reference_id: paymentData.id
        });

      // 3. Update seat assignment
      if (payment.shift_type !== 'registration') {
        await this.assignSeat(
          payment.seat_no!,
          payment.student_id!,
          payment.shift_type as any,
          payment.valid_until!
        );
      }

      return { success: true, payment: paymentData };
    } catch (error: any) {
      console.error('[LibraryService] recordFeePayment error:', error);
      return { success: false, error: error.message };
    }
  }

  async getPaymentHistory(studentId?: string): Promise<LibraryFeePayment[]> {
    try {
      let query = this.supabase.supabase
        .from('library_fee_payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[LibraryService] getPaymentHistory error:', error);
      return [];
    }
  }

  // ========================================
  // EXPENSES
  // ========================================

  async addExpense(expense: Partial<LibraryExpense>): Promise<{success: boolean, error?: string}> {
    try {
      // 1. Insert expense
      const { data, error: expenseError } = await this.supabase.supabase
        .from('library_expenses')
        .insert(expense)
        .select()
        .single();

      if (expenseError) throw expenseError;

      // 2. Record in cash ledger
      await this.supabase.supabase
        .from('library_cash_ledger')
        .insert({
          date: expense.date,
          type: 'expense',
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          payment_mode: expense.payment_mode,
          reference_id: data.id
        });

      return { success: true };
    } catch (error: any) {
      console.error('[LibraryService] addExpense error:', error);
      return { success: false, error: error.message };
    }
  }

  async getExpenses(startDate?: string, endDate?: string): Promise<LibraryExpense[]> {
    try {
      let query = this.supabase.supabase
        .from('library_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[LibraryService] getExpenses error:', error);
      return [];
    }
  }

  // ========================================
  // ANALYTICS & REPORTS
  // ========================================

  async getExpiringSeats(daysAhead: number = 2) {
    try {
      const { data, error } = await this.supabase.supabase
        .rpc('get_expiring_seats', { days_ahead: daysAhead });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[LibraryService] getExpiringSeats error:', error);
      return [];
    }
  }

  async getLibraryCashBalance(): Promise<number> {
    try {
      const { data, error } = await this.supabase.supabase
        .rpc('get_library_cash_balance');

      if (error) throw error;
      return data || 0;
    } catch (error: any) {
      console.error('[LibraryService] getLibraryCashBalance error:', error);
      return 0;
    }
  }

  async getDashboardStats() {
    try {
      const [seats, students, balance, expenses] = await Promise.all([
        this.getAllSeats(),
        this.getAllStudents('active'),
        this.getLibraryCashBalance(),
        this.getExpenses(
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        )
      ]);

      const occupiedSeats = seats.filter(s => 
        s.full_time_student_id || s.first_half_student_id || s.second_half_student_id
      ).length;

      const fullTimeCount = seats.filter(s => s.full_time_student_id).length;
      const firstHalfCount = seats.filter(s => s.first_half_student_id && !s.full_time_student_id).length;
      const secondHalfCount = seats.filter(s => s.second_half_student_id && !s.full_time_student_id).length;

      const monthlyExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

      // Calculate total revenue from payments this month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const payments = await this.getPaymentHistory();
      const monthlyRevenue = payments
        .filter(p => p.payment_date >= startOfMonth)
        .reduce((sum, p) => sum + p.amount_paid, 0);

      const totalSeats = seats.length; // Dynamic total seats from database

      return {
        totalSeats,
        occupiedSeats,
        availableSeats: totalSeats - occupiedSeats,
        totalRevenue: monthlyRevenue,
        totalExpenses: monthlyExpense,
        cashBalance: balance,
        fullTimeCount,
        firstHalfCount,
        secondHalfCount,
        occupancyRate: totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0
      };
    } catch (error) {
      console.error('[LibraryService] getDashboardStats error:', error);
      return {
        totalSeats: 0,
        occupiedSeats: 0,
        availableSeats: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        cashBalance: 0,
        fullTimeCount: 0,
        firstHalfCount: 0,
        secondHalfCount: 0,
        occupancyRate: 0
      };
    }
  }

  async deleteStudent(id: string): Promise<{success: boolean, error?: string}> {
    try {
      const { error } = await this.supabase.supabase
        .from('library_students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('[LibraryService] deleteStudent error:', error);
      return { success: false, error: error.message };
    }
  }

  async getStudentPaymentHistory(studentId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('library_fee_payments')
        .select(`
          *,
          student:library_students(name)
        `)
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(payment => ({
        ...payment,
        student_name: payment.student?.name
      }));
    } catch (error: any) {
      console.error('[LibraryService] getStudentPaymentHistory error:', error);
      return [];
    }
  }

  async deleteExpense(id: string): Promise<{success: boolean, error?: string}> {
    try {
      // Also delete from cash ledger
      const { error: ledgerError } = await this.supabase.supabase
        .from('library_cash_ledger')
        .delete()
        .eq('reference_id', id);

      if (ledgerError) throw ledgerError;

      const { error } = await this.supabase.supabase
        .from('library_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('[LibraryService] deleteExpense error:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // PHOTO UPLOAD
  // ========================================

  async uploadStudentPhoto(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `student-photos/${fileName}`;

      const { error: uploadError } = await this.supabase.supabase.storage
        .from('library-student-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = this.supabase.supabase.storage
        .from('library-student-photos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('[LibraryService] uploadStudentPhoto error:', error);
      throw error;
    }
  }

  // ========================================
  // ATTENDANCE TRACKING
  // ========================================

  async checkInStudent(studentId: string, bypassTimeRestriction: boolean = false): Promise<{success: boolean, attendance?: LibraryAttendance, error?: string}> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentHour = now.getHours();
      const timeString = now.toTimeString().split(' ')[0];
      
      // Time restriction: 7 AM - 7 PM (19:00) - bypass for admin
      if (!bypassTimeRestriction && (currentHour < 7 || currentHour >= 19)) {
        return { success: false, error: 'Attendance can only be marked between 7:00 AM and 7:00 PM' };
      }
      
      // Check if already checked in today (one check-in per day)
      const { data: existing } = await this.supabase.supabase
        .from('library_attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', today)
        .single();

      if (existing) {
        return { success: false, error: 'Already checked in today. Only one check-in allowed per day.' };
      }

      // Determine if late (after 9 AM)
      const checkInHour = parseInt(timeString.split(':')[0]);
      const status = checkInHour >= 9 ? 'late' : 'present';

      const { data, error } = await this.supabase.supabase
        .from('library_attendance')
        .insert({
          student_id: studentId,
          date: today,
          check_in_time: timeString,
          status
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, attendance: data };
    } catch (error: any) {
      console.error('[LibraryService] checkInStudent error:', error);
      return { success: false, error: error.message };
    }
  }

  async checkOutStudent(studentId: string, bypassTimeRestriction: boolean = false): Promise<{success: boolean, error?: string}> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentHour = now.getHours();
      const timeString = now.toTimeString().split(' ')[0];

      // Time restriction: 7 AM - 7 PM (19:00) - bypass for admin
      if (!bypassTimeRestriction && (currentHour < 7 || currentHour >= 19)) {
        return { success: false, error: 'Attendance can only be marked between 7:00 AM and 7:00 PM' };
      }

      // Check if already checked out (one check-out per day)
      const { data: existing } = await this.supabase.supabase
        .from('library_attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', today)
        .single();

      if (!existing) {
        return { success: false, error: 'No check-in record found for today' };
      }

      if (existing.check_out_time) {
        return { success: false, error: 'Already checked out today. Only one check-out allowed per day.' };
      }

      const { error } = await this.supabase.supabase
        .from('library_attendance')
        .update({ check_out_time: timeString })
        .eq('student_id', studentId)
        .eq('date', today)
        .is('check_out_time', null);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('[LibraryService] checkOutStudent error:', error);
      return { success: false, error: error.message };
    }
  }

  async getTodayAttendanceStatus(studentId: string): Promise<LibraryAttendance | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await this.supabase.supabase
        .from('library_attendance')
        .select('*')
        .eq('student_id', studentId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error: any) {
      console.error('[LibraryService] getTodayAttendanceStatus error:', error);
      return null;
    }
  }

  // Find student by mobile number (for self-attendance)
  async findStudentByMobile(mobile: string): Promise<LibraryStudent | null> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('library_students')
        .select('*')
        .eq('mobile', mobile)
        .single();

      if (error) return null;
      return data;
    } catch (error: any) {
      console.error('[LibraryService] findStudentByMobile error:', error);
      return null;
    }
  }

  async getAttendanceRecords(studentId?: string, startDate?: string, endDate?: string): Promise<LibraryAttendance[]> {
    try {
      let query = this.supabase.supabase
        .from('library_attendance')
        .select(`
          *,
          student:library_students(*)
        `)
        .order('date', { ascending: false });

      if (studentId) query = query.eq('student_id', studentId);
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[LibraryService] getAttendanceRecords error:', error);
      return [];
    }
  }

  async getAttendanceStats(studentId: string, days: number = 30): Promise<{total: number, present: number, late: number, percentage: number}> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const records = await this.getAttendanceRecords(studentId, startDate.toISOString().split('T')[0]);
      
      const total = days;
      const present = records.filter(r => r.status === 'present').length;
      const late = records.filter(r => r.status === 'late').length;
      const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      return { total, present, late, percentage };
    } catch (error: any) {
      console.error('[LibraryService] getAttendanceStats error:', error);
      return { total: 0, present: 0, late: 0, percentage: 0 };
    }
  }

  async getAllTodayAttendance(): Promise<LibraryAttendance[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await this.supabase.supabase
        .from('library_attendance')
        .select(`
          *,
          student:library_students(*)
        `)
        .eq('date', today)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[LibraryService] getAllTodayAttendance error:', error);
      return [];
    }
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  async bulkReleaseSeat(seatNumbers: number[]): Promise<{success: boolean, released: number, errors: string[]}> {
    const errors: string[] = [];
    let released = 0;

    for (const seatNo of seatNumbers) {
      const result = await this.releaseSeat(seatNo);
      if (result.success) {
        released++;
      } else {
        errors.push(`Seat ${seatNo}: ${result.error}`);
      }
    }

    return { success: released > 0, released, errors };
  }

  async bulkUpdateStudentStatus(studentIds: string[], status: 'active' | 'inactive' | 'suspended'): Promise<{success: boolean, updated: number, errors: string[]}> {
    const errors: string[] = [];
    let updated = 0;

    for (const studentId of studentIds) {
      const result = await this.updateStudent(studentId, { status });
      if (result.success) {
        updated++;
      } else {
        errors.push(`Student ${studentId}: ${result.error}`);
      }
    }

    return { success: updated > 0, updated, errors };
  }

  // ========================================
  // DETAILED REPORTS
  // ========================================

  async getMonthlyRevenueBreakdown(year: number, month: number): Promise<any[]> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await this.supabase.supabase
        .from('library_fee_payments')
        .select('payment_date, shift_type, amount_paid')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate)
        .order('payment_date');

      if (error) throw error;

      // Group by date
      const breakdown: any = {};
      (data || []).forEach((payment: any) => {
        if (!breakdown[payment.payment_date]) {
          breakdown[payment.payment_date] = { date: payment.payment_date, total: 0, registration: 0, seat_rental: 0 };
        }
        breakdown[payment.payment_date].total += payment.amount_paid;
        if (payment.shift_type === 'registration') {
          breakdown[payment.payment_date].registration += payment.amount_paid;
        } else {
          breakdown[payment.payment_date].seat_rental += payment.amount_paid;
        }
      });

      return Object.values(breakdown);
    } catch (error: any) {
      console.error('[LibraryService] getMonthlyRevenueBreakdown error:', error);
      return [];
    }
  }

  async getStudentWisePaymentReport(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('library_fee_payments')
        .select(`
          student_id,
          amount_paid,
          payment_date,
          shift_type,
          student:library_students(name, mobile)
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      // Group by student
      const studentMap: any = {};
      (data || []).forEach((payment: any) => {
        if (!studentMap[payment.student_id]) {
          studentMap[payment.student_id] = {
            student_id: payment.student_id,
            student_name: payment.student?.name || 'Unknown',
            mobile: payment.student?.mobile || '',
            total_paid: 0,
            payment_count: 0,
            last_payment_date: payment.payment_date
          };
        }
        studentMap[payment.student_id].total_paid += payment.amount_paid;
        studentMap[payment.student_id].payment_count += 1;
      });

      return Object.values(studentMap);
    } catch (error: any) {
      console.error('[LibraryService] getStudentWisePaymentReport error:', error);
      return [];
    }
  }

  async getExpenseCategoryReport(year: number, month: number): Promise<any[]> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await this.supabase.supabase
        .from('library_expenses')
        .select('category, amount')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Group by category
      const categoryMap: any = {};
      (data || []).forEach((expense: any) => {
        if (!categoryMap[expense.category]) {
          categoryMap[expense.category] = { category: expense.category, total: 0, count: 0 };
        }
        categoryMap[expense.category].total += expense.amount;
        categoryMap[expense.category].count += 1;
      });

      return Object.values(categoryMap);
    } catch (error: any) {
      console.error('[LibraryService] getExpenseCategoryReport error:', error);
      return [];
    }
  }

  async getProfitLossStatement(year: number, month: number): Promise<{revenue: number, expenses: number, profit: number, details: any}> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Get revenue
      const payments = await this.getPaymentHistory();
      const revenue = payments
        .filter(p => p.payment_date >= startDate && p.payment_date <= endDate)
        .reduce((sum, p) => sum + p.amount_paid, 0);

      // Get expenses
      const expenses = await this.getExpenses(startDate, endDate);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      const profit = revenue - totalExpenses;

      return {
        revenue,
        expenses: totalExpenses,
        profit,
        details: {
          revenue_breakdown: await this.getMonthlyRevenueBreakdown(year, month),
          expense_breakdown: await this.getExpenseCategoryReport(year, month)
        }
      };
    } catch (error: any) {
      console.error('[LibraryService] getProfitLossStatement error:', error);
      return { revenue: 0, expenses: 0, profit: 0, details: {} };
    }
  }

  // ========================================
  // RECEIPT GENERATION
  // ========================================

  generateReceiptData(payment: LibraryFeePayment, student: LibraryStudent): any {
    return {
      receipt_no: `LIB-${payment.id.slice(0, 8).toUpperCase()}`,
      date: new Date(payment.payment_date).toLocaleDateString('en-IN'),
      student_name: student.name,
      mobile: student.mobile,
      seat_no: payment.seat_no,
      shift_type: payment.shift_type,
      amount_paid: payment.amount_paid,
      payment_mode: payment.payment_mode,
      valid_from: new Date(payment.valid_from).toLocaleDateString('en-IN'),
      valid_until: new Date(payment.valid_until).toLocaleDateString('en-IN'),
      transaction_ref: payment.transaction_reference || 'N/A'
    };
  }
}
