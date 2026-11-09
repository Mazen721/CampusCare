import type { ar } from './ar';
import type { DeepStringRecord } from './types';

export const en: DeepStringRecord<typeof ar> = {
  meta: {
    title: 'CampusCare — Campus Operations',
    description: 'CampusCare — one place for campus maintenance requests and lost & found recovery.',
  },
  common: {
    switchLanguage: 'Switch language',
    english: 'English',
    arabic: 'العربية',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading...',
    back: 'Back',
    actions: 'Actions',
    status: 'Status',
    viewAll: 'View all',
  },
  nav: {
    dashboard: 'Dashboard',
    maintenance: 'Maintenance',
    requests: 'Maintenance Requests',
    workOrders: 'Work Orders',
    preventive: 'Preventive Plans',
    calendar: 'Calendar',
    technicians: 'Technicians',
    feedback: 'Service Feedback',
    lostFound: 'Lost & Found',
    items: 'Items',
    claims: 'Claims',
    matches: 'Match Suggestions',
    locations: 'Locations',
    users: 'Users',
    activityLogs: 'Activity Logs',
    notifications: 'Notifications',
    profile: 'Profile',
  },
  auth: {
    signIn: 'Sign in',
    signOut: 'Sign out',
    email: 'Email',
    password: 'Password',
    changePassword: 'Change password',
  },
  dashboard: {
    title: 'Dashboard',
    maintenance: 'Maintenance',
    lostFound: 'Lost & Found',
    accounts: 'Accounts',
    totalRecords: 'Total records',
    requests: 'Requests',
    active: 'Active',
    completed: 'Completed',
    lost: 'Lost',
    found: 'Found',
    items: 'Items',
    claims: 'Claims',
    jobs: 'Jobs',
  },
  requests: {
    title: 'Maintenance Requests',
  },
  workOrders: {
    title: 'Work Orders',
  },
  technicians: {
    title: 'Technicians',
  },
  preventive: {
    title: 'Preventive Maintenance Plans',
  },
  calendar: {
    title: 'Calendar',
  },
  feedback: {
    title: 'Service Feedback',
  },
  locations: {
    title: 'Locations',
  },
  lostFound: {
    title: 'Lost & Found',
  },
  claims: {
    title: 'Claims',
  },
  matches: {
    title: 'Match Suggestions',
  },
  users: {
    title: 'Users',
  },
  activityLogs: {
    title: 'Activity Logs',
  },
  notifications: {
    title: 'Notifications',
  },
  ai: {
    insights: 'AI Insights',
    summary: 'AI Summary',
  },
  errors: {
    network: 'Unable to connect to the server. Please check your internet connection.',
    requestFailed: 'Request failed ({{status}}).',
    generic: 'An unexpected error occurred.',
  },
  serverErrors: {
    internal: 'An internal server error occurred.',
    routeNotFound: 'The requested route was not found.',
    validationFailed: 'Input validation failed.',
    uploadTooLarge: 'File size exceeds the allowed limit.',
    uploadInvalid: 'File type is not supported.',
  },
  notif: {},
  activity: {},
  validation: {},
  enums: {},
} as const;
