import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface DigitalBook {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  publisher?: string;
  category: string;
  sub_category?: string;
  class?: string;
  subject?: string;
  language: string;
  file_url: string;
  thumbnail_url?: string;
  file_size_mb?: number;
  pages?: number;
  description?: string;
  tags?: string[];
  source: string;
  source_url?: string;
  downloads: number;
  views: number;
  rating: number;
  is_featured: boolean;
  added_date: string;
}

export interface BookCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  count: number;
  color: string;
}

export interface ResourceLink {
  title: string;
  description: string;
  url: string;
  category: string;
  icon: string;
  isOfficial: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DigitalLibraryService {
  constructor(private supabase: SupabaseService) {}

  // Get all books with optional filters
  async getBooks(filters?: {
    category?: string;
    class?: string;
    subject?: string;
    language?: string;
    search?: string;
    limit?: number;
  }): Promise<DigitalBook[]> {
    try {
      let query = this.supabase.supabase
        .from('digital_library')
        .select('*')
        .eq('is_active', true);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.class) {
        query = query.eq('class', filters.class);
      }
      if (filters?.subject) {
        query = query.eq('subject', filters.subject);
      }
      if (filters?.language) {
        query = query.eq('language', filters.language);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,author.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      query = query.order('downloads', { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching books:', error);
      return [];
    }
  }

  // Get featured books
  async getFeaturedBooks(limit: number = 10): Promise<DigitalBook[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('digital_library')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('featured_order', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured books:', error);
      return [];
    }
  }

  // Get book by ID
  async getBookById(id: string): Promise<DigitalBook | null> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('digital_library')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Increment views
      await this.incrementViews(id);

      return data;
    } catch (error) {
      console.error('Error fetching book:', error);
      return null;
    }
  }

  // Increment view count
  async incrementViews(bookId: string): Promise<void> {
    try {
      await this.supabase.supabase.rpc('increment_book_views', { book_id: bookId });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  // Track download
  async trackDownload(bookId: string, studentId?: string): Promise<void> {
    try {
      // Increment download count
      await this.supabase.supabase.rpc('increment_book_downloads', { book_id: bookId });

      // Log download if student is logged in
      if (studentId) {
        await this.supabase.supabase
          .from('book_downloads')
          .insert({
            book_id: bookId,
            student_id: studentId,
            download_date: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  }

  // Get categories with counts
  async getCategories(): Promise<BookCategory[]> {
    // Return predefined categories
    return [
      {
        id: 'ncert',
        name: 'NCERT Books',
        icon: '📚',
        description: 'Official NCERT textbooks for all classes',
        count: 0,
        color: '#4CAF50'
      },
      {
        id: 'upboard',
        name: 'UP Board Books',
        icon: '📖',
        description: 'UP Board textbooks (Class 9-12)',
        count: 0,
        color: '#2196F3'
      },
      {
        id: 'upsc',
        name: 'UPSC Resources',
        icon: '🎓',
        description: 'Complete UPSC preparation material',
        count: 0,
        color: '#FF9800'
      },
      {
        id: 'ssc',
        name: 'SSC Resources',
        icon: '📝',
        description: 'SSC CGL, CHSL, MTS preparation',
        count: 0,
        color: '#9C27B0'
      },
      {
        id: 'banking',
        name: 'Banking Exams',
        icon: '🏦',
        description: 'IBPS, SBI, RBI preparation',
        count: 0,
        color: '#00BCD4'
      },
      {
        id: 'railway',
        name: 'Railway Exams',
        icon: '🚂',
        description: 'RRB NTPC, Group D preparation',
        count: 0,
        color: '#F44336'
      },
      {
        id: 'police',
        name: 'Police Exams',
        icon: '👮',
        description: 'UP Police, SSC GD, State Police',
        count: 0,
        color: '#FF5722'
      },
      {
        id: 'free-prep',
        name: 'Free Prep Sites',
        icon: '🎯',
        description: 'Adda247, Testbook, Drishti IAS',
        count: 0,
        color: '#009688'
      },
      {
        id: 'programming',
        name: 'Programming & CS',
        icon: '💻',
        description: 'C, C++, Java, Python, HTML, Web Dev',
        count: 0,
        color: '#3F51B5'
      },
      {
        id: 'technical',
        name: 'ITI & Polytechnic',
        icon: '🔧',
        description: 'Technical courses, Diploma, ITI trades',
        count: 0,
        color: '#FF9800'
      },
      {
        id: 'jobs',
        name: 'Job Portals',
        icon: '💼',
        description: 'Naukri, Sarkari Jobs, Vacancies',
        count: 0,
        color: '#4CAF50'
      },
      {
        id: 'skills',
        name: 'Skill Development',
        icon: '🎯',
        description: 'Free certifications, Online courses',
        count: 0,
        color: '#E91E63'
      },
      {
        id: 'coding',
        name: 'Coding Practice',
        icon: '⚡',
        description: 'HackerRank, LeetCode, Competitive Coding',
        count: 0,
        color: '#00C853'
      },
      {
        id: 'commerce',
        name: 'Commerce & Banking',
        icon: '💰',
        description: 'Accounting, Economics, Business Studies',
        count: 0,
        color: '#FFB300'
      },
      {
        id: 'degree',
        name: 'Degree Programs',
        icon: '🎓',
        description: 'BA, BSc, BCom - Syllabus & Guides',
        count: 0,
        color: '#7C4DFF'
      },
      {
        id: 'junior',
        name: 'Junior Students',
        icon: '🧒',
        description: 'Class 1-8 Learning Apps & Resources',
        count: 0,
        color: '#FF6E40'
      },
      {
        id: 'ai-tools',
        name: 'AI Tools',
        icon: '🤖',
        description: 'ChatGPT, Image Gen, Video AI, Coding AI',
        count: 0,
        color: '#9C27B0'
      }
    ];
  }

  // Get official resource links
  getOfficialResourceLinks(): ResourceLink[] {
    return [
      // NCERT
      {
        title: 'NCERT Official Textbooks',
        description: 'Download all NCERT books (Class 1-12) in PDF format',
        url: 'https://ncert.nic.in/textbook.php',
        category: 'School',
        icon: '📚',
        isOfficial: true
      },
      {
        title: 'e-Pathshala by NCERT',
        description: 'Digital platform for NCERT books and resources',
        url: 'https://epathshala.nic.in/',
        category: 'School',
        icon: '📱',
        isOfficial: true
      },
      {
        title: 'Khan Academy',
        description: 'Free video lessons, practice exercises for all subjects (Math, Science, etc.)',
        url: 'https://www.khanacademy.org/',
        category: 'School',
        icon: '🎓',
        isOfficial: false
      },
      {
        title: 'Khan Academy India',
        description: 'Free courses aligned with NCERT - Math, Science in Hindi & English',
        url: 'https://www.khanacademy.org/i/in',
        category: 'School',
        icon: '🇮🇳',
        isOfficial: false
      },

      // UP Board
      {
        title: 'UP Board E-Books',
        description: 'Official UP Board textbooks for Class 9-12',
        url: 'https://upmsp.edu.in/Ebook.aspx',
        category: 'School',
        icon: '📖',
        isOfficial: true
      },

      // UPSC
      {
        title: 'UPSC Official Website',
        description: 'Syllabus, notifications, and previous year papers',
        url: 'https://www.upsc.gov.in/',
        category: 'UPSC',
        icon: '🎯',
        isOfficial: true
      },
      {
        title: 'Drishti IAS Free Resources',
        description: 'Daily current affairs, monthly magazines, free PDFs',
        url: 'https://www.drishtiias.com/current-affairs-news-analysis-editorials',
        category: 'UPSC',
        icon: '📰',
        isOfficial: false
      },
      {
        title: 'Vision IAS Free Resources',
        description: 'Monthly current affairs magazines and test series',
        url: 'https://www.visionias.in/student-dashboard',
        category: 'UPSC',
        icon: '📚',
        isOfficial: false
      },
      {
        title: 'ClearIAS Free Study Material',
        description: 'Complete free UPSC prep - Notes, Mock Tests, Strategy',
        url: 'https://www.clearias.com/',
        category: 'UPSC',
        icon: '🎓',
        isOfficial: false
      },
      {
        title: 'InsightsOnIndia',
        description: 'Free daily current affairs and answer writing practice',
        url: 'https://www.insightsonindia.com/',
        category: 'UPSC',
        icon: '✍️',
        isOfficial: false
      },
      {
        title: 'NIOS Study Material',
        description: 'Free study material for UPSC preparation',
        url: 'https://www.nios.ac.in/online-course-material.aspx',
        category: 'UPSC',
        icon: '📚',
        isOfficial: true
      },
      {
        title: 'IGNOU E-Gyankosh',
        description: '4000+ free e-books for competitive exams',
        url: 'https://egyankosh.ac.in/',
        category: 'UPSC',
        icon: '🎓',
        isOfficial: true
      },
      {
        title: 'Constitution of India',
        description: 'Official PDF with all amendments',
        url: 'https://legislative.gov.in/constitution-of-india',
        category: 'UPSC',
        icon: '⚖️',
        isOfficial: true
      },
      {
        title: 'Economic Survey',
        description: 'Annual economic survey documents',
        url: 'https://www.indiabudget.gov.in/economicsurvey/',
        category: 'UPSC',
        icon: '💰',
        isOfficial: true
      },

      // SSC & Other Competitive
      {
        title: 'SSC Official Website',
        description: 'SSC notifications, admit cards, results',
        url: 'https://ssc.nic.in/',
        category: 'SSC',
        icon: '📝',
        isOfficial: true
      },
      {
        title: 'Adda247 Free Section',
        description: 'Free PDFs, Current Affairs, SSC/Banking study material',
        url: 'https://www.adda247.com/school/',
        category: 'SSC',
        icon: '📚',
        isOfficial: false
      },
      {
        title: 'Testbook Free Content',
        description: 'Free mock tests, quizzes, and study notes for SSC',
        url: 'https://testbook.com/ssc',
        category: 'SSC',
        icon: '✏️',
        isOfficial: false
      },
      {
        title: 'GradeUp - SSC Free Prep',
        description: 'Free daily quizzes, current affairs, SSC preparation',
        url: 'https://gradeup.co/ssc-exams-online-coaching',
        category: 'SSC',
        icon: '📖',
        isOfficial: false
      },
      {
        title: 'AffairsCloud Current Affairs',
        description: 'Free daily/monthly current affairs PDF downloads',
        url: 'https://www.affairscloud.com/current-affairs/',
        category: 'All',
        icon: '📰',
        isOfficial: false
      },
      {
        title: 'National Digital Library (NDLI)',
        description: '7.8 crore+ digital resources - Free registration',
        url: 'https://ndl.iitkgp.ac.in/',
        category: 'All',
        icon: '📚',
        isOfficial: true
      },

      // Banking
      {
        title: 'IBPS Official',
        description: 'Banking recruitment notifications',
        url: 'https://www.ibps.in/',
        category: 'Banking',
        icon: '🏦',
        isOfficial: true
      },
      {
        title: 'Bankersadda Free Resources',
        description: 'Free banking current affairs, quizzes, study notes',
        url: 'https://www.bankersadda.com/banking-awareness/',
        category: 'Banking',
        icon: '📚',
        isOfficial: false
      },
      {
        title: 'Oliveboard Banking Free Prep',
        description: 'Free mock tests, quizzes for IBPS, SBI exams',
        url: 'https://www.oliveboard.in/banking/',
        category: 'Banking',
        icon: '✏️',
        isOfficial: false
      },
      {
        title: 'AffairsCloud Banking',
        description: 'Banking awareness, free monthly PDF capsules',
        url: 'https://www.affairscloud.com/banking-awareness/',
        category: 'Banking',
        icon: '💼',
        isOfficial: false
      },
      {
        title: 'RBI Publications',
        description: 'Reports and research papers',
        url: 'https://www.rbi.org.in/Scripts/Publications.aspx',
        category: 'Banking',
        icon: '📊',
        isOfficial: true
      },

      // Railway
      {
        title: 'Railway RRB Central',
        description: 'Official railway recruitment notifications',
        url: 'https://www.rrbcdg.gov.in/',
        category: 'Railway',
        icon: '🚂',
        isOfficial: true
      },
      {
        title: 'RailwayAdda Free Prep',
        description: 'Free study material, mock tests for RRB exams',
        url: 'https://www.railwayadda.com/',
        category: 'Railway',
        icon: '📚',
        isOfficial: false
      },
      {
        title: 'Testbook Railway Section',
        description: 'Free quizzes and railway exam preparation',
        url: 'https://testbook.com/railway',
        category: 'Railway',
        icon: '✏️',
        isOfficial: false
      },

      // Police Exams
      {
        title: 'UP Police Recruitment',
        description: 'Official UP Police recruitment and study material',
        url: 'https://uppbpb.gov.in/',
        category: 'General',
        icon: '👮',
        isOfficial: true
      },
      {
        title: 'SSC GD Constable',
        description: 'Police constable recruitment via SSC',
        url: 'https://ssc.nic.in/Portal/Notices',
        category: 'General',
        icon: '🚔',
        isOfficial: true
      },
      {
        title: 'Gradeup Police Exam Prep',
        description: 'Free study material for police exams',
        url: 'https://gradeup.co/police-exams',
        category: 'General',
        icon: '👮‍♂️',
        isOfficial: false
      },

      // General Resources
      {
        title: 'Project Gutenberg',
        description: '70,000+ free e-books (Classics)',
        url: 'https://www.gutenberg.org/',
        category: 'General',
        icon: '📖',
        isOfficial: true
      },
      {
        title: 'Internet Archive',
        description: 'Millions of free books and documents',
        url: 'https://archive.org/',
        category: 'General',
        icon: '🗄️',
        isOfficial: true
      },
      {
        title: 'SWAYAM Portal',
        description: 'Free online courses with downloadable content',
        url: 'https://swayam.gov.in/',
        category: 'All',
        icon: '🎓',
        isOfficial: true
      },

      // Programming & Computer Science
      {
        title: 'W3Schools - Learn Web Dev',
        description: 'Free HTML, CSS, JavaScript, Python, SQL tutorials',
        url: 'https://www.w3schools.com/',
        category: 'Programming',
        icon: '💻',
        isOfficial: false
      },
      {
        title: 'GeeksforGeeks',
        description: 'C, C++, Java, Python, DSA - Complete tutorials',
        url: 'https://www.geeksforgeeks.org/',
        category: 'Programming',
        icon: '👨‍💻',
        isOfficial: false
      },
      {
        title: 'Programiz - Learn Programming',
        description: 'C, C++, Java, Python tutorials with examples',
        url: 'https://www.programiz.com/',
        category: 'Programming',
        icon: '📱',
        isOfficial: false
      },
      {
        title: 'TutorialsPoint',
        description: 'Free tutorials for all programming languages',
        url: 'https://www.tutorialspoint.com/',
        category: 'Programming',
        icon: '📚',
        isOfficial: false
      },
      {
        title: 'JavaTpoint',
        description: 'Java, Python, C, C++, Web development tutorials',
        url: 'https://www.javatpoint.com/',
        category: 'Programming',
        icon: '☕',
        isOfficial: false
      },
      {
        title: 'FreeCodeCamp',
        description: 'Learn web development - HTML, CSS, JavaScript',
        url: 'https://www.freecodecamp.org/',
        category: 'Programming',
        icon: '🔥',
        isOfficial: false
      },
      {
        title: 'Codecademy Free Courses',
        description: 'Interactive coding lessons - Python, JS, HTML',
        url: 'https://www.codecademy.com/catalog/subject/all',
        category: 'Programming',
        icon: '🎮',
        isOfficial: false
      },
      {
        title: 'Python.org Official',
        description: 'Official Python documentation and tutorials',
        url: 'https://docs.python.org/3/tutorial/',
        category: 'Programming',
        icon: '🐍',
        isOfficial: true
      },
      {
        title: 'MDN Web Docs',
        description: 'HTML, CSS, JavaScript - Mozilla documentation',
        url: 'https://developer.mozilla.org/',
        category: 'Programming',
        icon: '🌐',
        isOfficial: true
      },
      {
        title: 'GitHub Learning Lab',
        description: 'Learn Git, GitHub, open source development',
        url: 'https://github.com/skills',
        category: 'Programming',
        icon: '🐙',
        isOfficial: true
      },

      // ITI & Polytechnic Resources
      {
        title: 'NCVT MIS - ITI Portal',
        description: 'Official ITI resources, syllabus, trade info',
        url: 'https://www.ncvtmis.gov.in/',
        category: 'Technical',
        icon: '🔧',
        isOfficial: true
      },
      {
        title: 'AICTE - Polytechnic Resources',
        description: 'Diploma courses, syllabus, study material',
        url: 'https://www.aicte-india.org/',
        category: 'Technical',
        icon: '🏗️',
        isOfficial: true
      },
      {
        title: 'NIOS Vocational Courses',
        description: 'ITI level vocational training material',
        url: 'https://www.nios.ac.in/vocational-education.aspx',
        category: 'Technical',
        icon: '📐',
        isOfficial: true
      },
      {
        title: 'Spoken Tutorial - IIT Bombay',
        description: 'Free video tutorials - CAD, Programming, Office tools',
        url: 'https://spoken-tutorial.org/',
        category: 'Technical',
        icon: '🎥',
        isOfficial: true
      },
      {
        title: 'e-Shiksha - Technical Education',
        description: 'Engineering & polytechnic study resources',
        url: 'https://www.eshikshakosh.nios.ac.in/',
        category: 'Technical',
        icon: '⚙️',
        isOfficial: true
      },

      // Job Portals
      {
        title: 'Naukri.com',
        description: 'India\'s largest job portal - Private & government jobs',
        url: 'https://www.naukri.com/',
        category: 'Jobs',
        icon: '💼',
        isOfficial: false
      },
      {
        title: 'LinkedIn Jobs',
        description: 'Professional networking & job search platform',
        url: 'https://www.linkedin.com/jobs/',
        category: 'Jobs',
        icon: '👔',
        isOfficial: false
      },
      {
        title: 'Indeed India',
        description: 'Search jobs across all industries',
        url: 'https://www.indeed.co.in/',
        category: 'Jobs',
        icon: '🔍',
        isOfficial: false
      },
      {
        title: 'Sarkari Result',
        description: 'Latest government job notifications & results',
        url: 'https://www.sarkariresult.com/',
        category: 'Jobs',
        icon: '📋',
        isOfficial: false
      },
      {
        title: 'Fresher Jobs - Naukri',
        description: 'Entry-level & fresher job opportunities',
        url: 'https://www.naukri.com/fresher-jobs',
        category: 'Jobs',
        icon: '🎓',
        isOfficial: false
      },
      {
        title: 'National Career Service',
        description: 'Government job portal - All India recruitment',
        url: 'https://www.ncs.gov.in/',
        category: 'Jobs',
        icon: '🇮🇳',
        isOfficial: true
      },
      {
        title: 'Monster India',
        description: 'Job search, career advice, resume building',
        url: 'https://www.monsterindia.com/',
        category: 'Jobs',
        icon: '👹',
        isOfficial: false
      },
      {
        title: 'Internshala',
        description: 'Internships & entry-level jobs for students',
        url: 'https://internshala.com/',
        category: 'Jobs',
        icon: '🎒',
        isOfficial: false
      },

      // Skill Development & Trending Courses
      {
        title: 'NPTEL - Free Online Courses',
        description: 'IIT/IISc courses - Engineering, Science, Humanities',
        url: 'https://nptel.ac.in/',
        category: 'Skills',
        icon: '🎓',
        isOfficial: true
      },
      {
        title: 'Coursera Free Courses',
        description: 'University courses - AI, Data Science, Business',
        url: 'https://www.coursera.org/courses?query=free',
        category: 'Skills',
        icon: '📚',
        isOfficial: false
      },
      {
        title: 'edX Free Courses',
        description: 'Harvard, MIT courses - Computer Science, Business',
        url: 'https://www.edx.org/search?tab=course',
        category: 'Skills',
        icon: '🎯',
        isOfficial: false
      },
      {
        title: 'Google Digital Garage',
        description: 'Free digital marketing, data analytics courses',
        url: 'https://learndigital.withgoogle.com/digitalgarage',
        category: 'Skills',
        icon: '🔍',
        isOfficial: true
      },
      {
        title: 'Microsoft Learn',
        description: 'Free Microsoft certifications - Azure, Office, Power BI',
        url: 'https://learn.microsoft.com/',
        category: 'Skills',
        icon: '🪟',
        isOfficial: true
      },
      {
        title: 'Udacity Free Courses',
        description: 'Programming, AI, Data Science introductory courses',
        url: 'https://www.udacity.com/courses/all',
        category: 'Skills',
        icon: '🚀',
        isOfficial: false
      },
      {
        title: 'Skill India Digital',
        description: 'Government skill development programs & certifications',
        url: 'https://www.skillindiadigital.gov.in/',
        category: 'Skills',
        icon: '🇮🇳',
        isOfficial: true
      },
      {
        title: 'Great Learning Free Courses',
        description: 'Data Science, AI, ML, Digital Marketing courses',
        url: 'https://www.mygreatlearning.com/academy',
        category: 'Skills',
        icon: '📊',
        isOfficial: false
      },
      {
        title: 'Udemy Free Courses',
        description: 'Development, Business, Marketing free courses',
        url: 'https://www.udemy.com/courses/free/',
        category: 'Skills',
        icon: '🎬',
        isOfficial: false
      },
      {
        title: 'YouTube Learning',
        description: 'Free video courses on any topic',
        url: 'https://www.youtube.com/learning',
        category: 'Skills',
        icon: '📹',
        isOfficial: true
      },

      // CODING PRACTICE
      {
        title: 'HackerRank',
        description: 'Practice coding in C, C++, Java, Python - Solve problems, earn certificates',
        url: 'https://www.hackerrank.com/',
        category: 'Coding',
        icon: '⚡',
        isOfficial: true
      },
      {
        title: 'LeetCode',
        description: 'Best platform for interview preparation - DSA problems with solutions',
        url: 'https://leetcode.com/',
        category: 'Coding',
        icon: '🔥',
        isOfficial: true
      },
      {
        title: 'CodeChef',
        description: 'Competitive programming, Monthly contests, Learn & Practice coding',
        url: 'https://www.codechef.com/',
        category: 'Coding',
        icon: '👨‍🍳',
        isOfficial: true
      },
      {
        title: 'Codeforces',
        description: 'Regular competitive programming contests, Global leaderboard',
        url: 'https://codeforces.com/',
        category: 'Coding',
        icon: '🏆',
        isOfficial: true
      },
      {
        title: 'HackerEarth',
        description: 'Coding challenges, Hackathons, Job opportunities for coders',
        url: 'https://www.hackerearth.com/',
        category: 'Coding',
        icon: '🌍',
        isOfficial: true
      },
      {
        title: 'GeeksforGeeks Practice',
        description: 'Practice DSA problems, Company-wise interview questions',
        url: 'https://practice.geeksforgeeks.org/',
        category: 'Coding',
        icon: '💚',
        isOfficial: true
      },
      {
        title: 'InterviewBit',
        description: 'Programming interview questions, Tech interview preparation',
        url: 'https://www.interviewbit.com/',
        category: 'Coding',
        icon: '💼',
        isOfficial: true
      },

      // COMMERCE & BANKING EDUCATION
      {
        title: 'Learn Accounting (AccountingCoach)',
        description: 'Free accounting lessons, Bookkeeping, Financial statements',
        url: 'https://www.accountingcoach.com/',
        category: 'Commerce',
        icon: '📊',
        isOfficial: true
      },
      {
        title: 'Economics Learning (Khan Academy)',
        description: 'Microeconomics, Macroeconomics, Finance & Capital Markets',
        url: 'https://www.khanacademy.org/economics-finance-domain',
        category: 'Commerce',
        icon: '💹',
        isOfficial: true
      },
      {
        title: 'Investopedia',
        description: 'Finance, Investing, Banking concepts explained simply',
        url: 'https://www.investopedia.com/',
        category: 'Commerce',
        icon: '💰',
        isOfficial: true
      },
      {
        title: 'NIOS Commerce Study Material',
        description: 'Accountancy, Business Studies, Economics for 11th-12th',
        url: 'https://nios.ac.in/online-course-material.aspx',
        category: 'Commerce',
        icon: '📚',
        isOfficial: true
      },
      {
        title: 'Tally Tutorial',
        description: 'Learn Tally ERP, Accounting software - Free tutorials',
        url: 'https://tallysolutions.com/learning/',
        category: 'Commerce',
        icon: '🖥️',
        isOfficial: true
      },
      {
        title: 'Corporate Finance Institute (CFI)',
        description: 'Free finance courses, Excel, Financial modeling',
        url: 'https://corporatefinanceinstitute.com/resources/',
        category: 'Commerce',
        icon: '📈',
        isOfficial: true
      },

      // DEGREE PROGRAMS (BA/BSc/BCom)
      {
        title: 'IGNOU Study Material',
        description: 'BA, BSc, BCom books & guides - Download free PDFs',
        url: 'https://egyankosh.ac.in/',
        category: 'Degree',
        icon: '📖',
        isOfficial: true
      },
      {
        title: 'NCERT Books for BA/BSc',
        description: 'History, Political Science, Economics, Physics, Chemistry, Biology',
        url: 'https://ncert.nic.in/textbook.php',
        category: 'Degree',
        icon: '📚',
        isOfficial: true
      },
      {
        title: 'NIOS Degree Program',
        description: 'Open schooling degree programs, Study materials available',
        url: 'https://nios.ac.in/',
        category: 'Degree',
        icon: '🎓',
        isOfficial: true
      },
      {
        title: 'SWAYAM - University Courses',
        description: 'BA/BSc/BCom online video lectures from top universities',
        url: 'https://swayam.gov.in/',
        category: 'Degree',
        icon: '🎥',
        isOfficial: true
      },
      {
        title: 'NPTEL - Science Courses',
        description: 'BSc level Physics, Chemistry, Mathematics, Biology courses',
        url: 'https://nptel.ac.in/course.html',
        category: 'Degree',
        icon: '🔬',
        isOfficial: true
      },
      {
        title: 'BA/BSc Previous Year Papers',
        description: 'University question papers for all subjects',
        url: 'https://www.examrace.com/IGNOU/',
        category: 'Degree',
        icon: '📝',
        isOfficial: false
      },
      {
        title: 'BCom Study Material (Learn Accounts)',
        description: 'Accounting, Cost Accounting, Corporate Accounting resources',
        url: 'https://www.learnaccounts.org/',
        category: 'Degree',
        icon: '💼',
        isOfficial: false
      },

      // JUNIOR STUDENTS (Class 1-8)
      {
        title: "BYJU'S - The Learning App",
        description: 'Class 1-8 Math & Science with videos, quizzes (Free trial)',
        url: 'https://byjus.com/',
        category: 'Junior',
        icon: '🎈',
        isOfficial: true
      },
      {
        title: 'Toppr',
        description: 'Interactive learning for Class 1-8, Practice questions',
        url: 'https://www.toppr.com/',
        category: 'Junior',
        icon: '⭐',
        isOfficial: true
      },
      {
        title: 'Vedantu - Young Learner',
        description: 'Live classes for junior students, Doubt solving',
        url: 'https://www.vedantu.com/',
        category: 'Junior',
        icon: '📱',
        isOfficial: true
      },
      {
        title: 'Meritnation',
        description: 'CBSE/ICSE Class 1-8 study material, Animations, Tests',
        url: 'https://www.meritnation.com/',
        category: 'Junior',
        icon: '🏅',
        isOfficial: true
      },
      {
        title: 'Khan Academy Kids',
        description: 'Fun learning for age 2-8, Math, Reading, Logic games',
        url: 'https://www.khanacademy.org/kids',
        category: 'Junior',
        icon: '🧸',
        isOfficial: true
      },
      {
        title: 'NCERT Solutions for Class 1-8',
        description: 'All subjects solutions, Chapter-wise explanations',
        url: 'https://ncert.nic.in/textbook.php',
        category: 'Junior',
        icon: '✅',
        isOfficial: true
      },
      {
        title: 'National Geographic Kids',
        description: 'Science, Geography, Animals - Fun learning for kids',
        url: 'https://kids.nationalgeographic.com/',
        category: 'Junior',
        icon: '🌍',
        isOfficial: true
      },
      {
        title: 'CoolMath4Kids',
        description: 'Math games, Logic puzzles for elementary students',
        url: 'https://www.coolmath4kids.com/',
        category: 'Junior',
        icon: '🎮',
        isOfficial: true
      },
      {
        title: 'DIKSHA Platform',
        description: 'Digital learning for school students, State board books',
        url: 'https://diksha.gov.in/',
        category: 'Junior',
        icon: '📲',
        isOfficial: true
      },

      // AI TOOLS - CHAT & ASSISTANTS
      {
        title: 'ChatGPT (OpenAI)',
        description: 'Most powerful AI chatbot - Write, code, solve problems, translations',
        url: 'https://chat.openai.com/',
        category: 'AI Tools',
        icon: '🤖',
        isOfficial: true
      },
      {
        title: 'Microsoft Copilot',
        description: 'Free AI assistant powered by GPT-4 - Search, chat, create content',
        url: 'https://copilot.microsoft.com/',
        category: 'AI Tools',
        icon: '🔵',
        isOfficial: true
      },
      {
        title: 'Google Gemini',
        description: 'Google\'s AI - Ask questions, get help with writing, coding',
        url: 'https://gemini.google.com/',
        category: 'AI Tools',
        icon: '✨',
        isOfficial: true
      },
      {
        title: 'Claude AI (Anthropic)',
        description: 'Advanced AI assistant - Long conversations, document analysis',
        url: 'https://claude.ai/',
        category: 'AI Tools',
        icon: '🧠',
        isOfficial: true
      },
      {
        title: 'Perplexity AI',
        description: 'AI-powered search engine - Get answers with sources',
        url: 'https://www.perplexity.ai/',
        category: 'AI Tools',
        icon: '🔍',
        isOfficial: true
      },

      // AI TOOLS - IMAGE GENERATION
      {
        title: 'DALL-E by OpenAI',
        description: 'Generate images from text descriptions - Free credits available',
        url: 'https://openai.com/dall-e-3',
        category: 'AI Tools',
        icon: '🎨',
        isOfficial: true
      },
      {
        title: 'Leonardo.ai',
        description: 'AI image generation - Free tier with 150 credits/day',
        url: 'https://leonardo.ai/',
        category: 'AI Tools',
        icon: '🖼️',
        isOfficial: true
      },
      {
        title: 'Adobe Firefly',
        description: 'Adobe\'s AI image generator - Text to image, generative fill',
        url: 'https://firefly.adobe.com/',
        category: 'AI Tools',
        icon: '🔥',
        isOfficial: true
      },
      {
        title: 'Stable Diffusion (DreamStudio)',
        description: 'Free AI art generator - Create stunning images',
        url: 'https://dreamstudio.ai/',
        category: 'AI Tools',
        icon: '🌟',
        isOfficial: true
      },
      {
        title: 'Canva AI (Magic Design)',
        description: 'Free AI design tools - Text to image, Magic Edit, Background remover',
        url: 'https://www.canva.com/ai-image-generator/',
        category: 'AI Tools',
        icon: '🎨',
        isOfficial: true
      },

      // AI TOOLS - VIDEO EDITING
      {
        title: 'Runway ML',
        description: 'AI video editing - Text to video, Green screen, Video effects',
        url: 'https://runwayml.com/',
        category: 'AI Tools',
        icon: '🎬',
        isOfficial: true
      },
      {
        title: 'Pictory AI',
        description: 'Convert text to videos - Script to video, Auto captions',
        url: 'https://pictory.ai/',
        category: 'AI Tools',
        icon: '📹',
        isOfficial: true
      },
      {
        title: 'Descript',
        description: 'Edit videos by editing text - Remove filler words, Studio sound',
        url: 'https://www.descript.com/',
        category: 'AI Tools',
        icon: '🎙️',
        isOfficial: true
      },
      {
        title: 'CapCut',
        description: 'Free AI video editor - Auto captions, Background removal',
        url: 'https://www.capcut.com/',
        category: 'AI Tools',
        icon: '✂️',
        isOfficial: true
      },
      {
        title: 'InVideo AI',
        description: 'Turn ideas into videos with AI - Text to video in minutes',
        url: 'https://invideo.io/ai/',
        category: 'AI Tools',
        icon: '🎥',
        isOfficial: true
      },

      // AI TOOLS - WRITING
      {
        title: 'Grammarly',
        description: 'AI writing assistant - Grammar check, tone suggestions, plagiarism',
        url: 'https://www.grammarly.com/',
        category: 'AI Tools',
        icon: '✍️',
        isOfficial: true
      },
      {
        title: 'QuillBot',
        description: 'AI paraphrasing tool - Rewrite text, Summarizer, Grammar checker',
        url: 'https://quillbot.com/',
        category: 'AI Tools',
        icon: '📝',
        isOfficial: true
      },
      {
        title: 'Copy.ai',
        description: 'AI content generator - Blog posts, Social media, Ads copy',
        url: 'https://www.copy.ai/',
        category: 'AI Tools',
        icon: '📄',
        isOfficial: true
      },
      {
        title: 'Jasper AI',
        description: 'AI content creation - Long-form articles, Marketing copy',
        url: 'https://www.jasper.ai/',
        category: 'AI Tools',
        icon: '🖊️',
        isOfficial: true
      },

      // AI TOOLS - DESIGN
      {
        title: 'Uizard',
        description: 'AI UI design - Convert sketches to mockups, Generate designs',
        url: 'https://uizard.io/',
        category: 'AI Tools',
        icon: '📱',
        isOfficial: true
      },
      {
        title: 'Figma AI',
        description: 'AI design tools in Figma - Auto layout, Design suggestions',
        url: 'https://www.figma.com/ai/',
        category: 'AI Tools',
        icon: '🎨',
        isOfficial: true
      },
      {
        title: 'Remove.bg',
        description: 'AI background remover - Remove image backgrounds in seconds',
        url: 'https://www.remove.bg/',
        category: 'AI Tools',
        icon: '🖼️',
        isOfficial: true
      },

      // AI TOOLS - VOICE/AUDIO
      {
        title: 'ElevenLabs',
        description: 'AI voice generator - Text to speech, Voice cloning',
        url: 'https://elevenlabs.io/',
        category: 'AI Tools',
        icon: '🎤',
        isOfficial: true
      },
      {
        title: 'Murf.ai',
        description: 'AI voiceover studio - 120+ voices, Voice changer',
        url: 'https://murf.ai/',
        category: 'AI Tools',
        icon: '🔊',
        isOfficial: true
      },
      {
        title: 'Speechify',
        description: 'Text to speech AI - Listen to any text, Natural voices',
        url: 'https://speechify.com/',
        category: 'AI Tools',
        icon: '📢',
        isOfficial: true
      },

      // AI TOOLS - PRODUCTIVITY
      {
        title: 'Notion AI',
        description: 'AI in Notion - Write, summarize, translate, brainstorm',
        url: 'https://www.notion.so/product/ai',
        category: 'AI Tools',
        icon: '📋',
        isOfficial: true
      },
      {
        title: 'ChatPDF',
        description: 'Chat with any PDF - Ask questions about documents',
        url: 'https://www.chatpdf.com/',
        category: 'AI Tools',
        icon: '📄',
        isOfficial: true
      },
      {
        title: 'Beautiful.ai',
        description: 'AI presentation maker - Professional slides in minutes',
        url: 'https://www.beautiful.ai/',
        category: 'AI Tools',
        icon: '🎯',
        isOfficial: true
      },
      {
        title: 'Slides AI',
        description: 'Generate presentations from text - Auto-create PowerPoint slides',
        url: 'https://www.slidesai.io/',
        category: 'AI Tools',
        icon: '📊',
        isOfficial: true
      }
    ];
  }

  // Search books
  async searchBooks(query: string, limit: number = 20): Promise<DigitalBook[]> {
    return this.getBooks({ search: query, limit });
  }

  // Get popular books
  async getPopularBooks(limit: number = 10): Promise<DigitalBook[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('digital_library')
        .select('*')
        .eq('is_active', true)
        .order('downloads', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching popular books:', error);
      return [];
    }
  }

  // Get recent additions
  async getRecentBooks(limit: number = 10): Promise<DigitalBook[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('digital_library')
        .select('*')
        .eq('is_active', true)
        .order('added_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent books:', error);
      return [];
    }
  }
}
