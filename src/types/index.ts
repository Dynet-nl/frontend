// Core type definitions for the Dynet application

// ============ User & Auth Types ============

export interface User {
  _id: string;
  name: string;
  email: string;
  roles: UserRoles;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRoles {
  Admin?: number;
  TechnischePlanning?: number;
  TechnischeSchouwer?: number;
  Werkvoorbereider?: number;
  HASPlanning?: number;
  HASMonteur?: number;
}

export interface AuthState {
  isAuthenticated?: boolean;
  roles?: number[];
  email?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  // Note: accessToken is now stored in httpOnly cookie by the backend
  roles: number[];
}

// ============ Location Types ============

export interface City {
  _id: string;
  name: string;
  areas?: Area[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Area {
  _id: string;
  name: string;
  city: string | City;
  districts?: District[];
  createdAt?: string;
  updatedAt?: string;
}

export interface District {
  _id: string;
  name: string;
  area: string | Area;
  buildings?: Building[];
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ============ Building Types ============

export interface Building {
  _id: string;
  district: string | District;
  address: string;
  postcode?: string;
  buildingIdentifier?: string;
  layout?: Layout;
  flats?: Flat[];
  schedules?: Schedule[];
  appointmentDate?: string;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  appointmentWeekNumber?: string;
  fileUrl?: string;
  isBlocked?: boolean;
  blockReason?: string;
  blockedBy?: string | User;
  blockedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Layout {
  _id: string;
  building: string | Building;
  blocks: LayoutBlock[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LayoutBlock {
  blockType: string;
  firstFloor: number;
  topFloor: number;
  floors: LayoutFloor[];
}

export interface LayoutFloor {
  floor: number;
  flat: string;
  cableNumber?: string;
  cableLength?: string;
}

// ============ Flat/Apartment Types ============

export interface Flat {
  _id: string;
  building: string | Building;
  zoeksleutel?: string;
  postcode?: string;
  complexNaam?: string;
  soortBouw?: string;
  adres?: string;
  huisNummer?: string;
  toevoeging?: string;
  email?: string;
  team?: string;
  fcStatusHas?: string;
  ipVezelwaarde?: string;
  toelichtingStatus?: string;
  laswerkAP?: string;
  laswerkDP?: string;
  ap?: string;
  dp?: string;
  odf?: string;
  odfPositie?: string;
  tkNummer?: string;
  technischePlanning?: TechnischePlanning;
  technischeSchouwer?: TechnischeSchouwer;
  werkvoorbereider?: Werkvoorbereider;
  hasPlanning?: HASPlanning;
  hasMonteur?: HASMonteur;
  createdAt?: string;
  updatedAt?: string;
}

// ============ Planning Types ============

export interface AppointmentBooked {
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface TechnischePlanning {
  _id: string;
  appointmentBooked?: AppointmentBooked;
  telephone?: string;
  vveWocoName?: string;
  technischeSchouwerName?: string;
  readyForSchouwer?: boolean;
  signed?: boolean;
  calledAlready?: boolean;
  timesCalled?: number;
  additionalNotes?: string;
  smsSent?: boolean;
}

export interface TechnischeSchouwer {
  _id: string;
  inspectionDate?: string;
  inspectionNotes?: string;
  status?: string;
}

export interface Werkvoorbereider {
  _id: string;
  preparationDate?: string;
  preparationNotes?: string;
  status?: string;
}

export interface HASPlanning {
  _id: string;
  plannedDate?: string;
  plannedNotes?: string;
  status?: string;
}

export interface HASMonteur {
  _id: string;
  appointmentBooked?: AppointmentBooked;
  hasMonteurName?: string;
  installation?: InstallationDetails;
}

export interface InstallationDetails {
  completed?: boolean;
  completedDate?: string;
  notes?: string;
}

// ============ Schedule Types ============

export interface Schedule {
  _id: string;
  building?: string | Building;
  flats?: string[] | Flat[];
  date?: string;
  startTime?: string;
  endTime?: string;
  type?: 'technische' | 'has';
  personnel?: string | User;
  status?: ScheduleStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ScheduleStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// ============ API Response Types ============

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ Dashboard Types ============

export interface DashboardStats {
  totalBuildings: number;
  totalFlats: number;
  completedFlats: number;
  pendingFlats: number;
  blockedBuildings: number;
  recentActivity?: ActivityItem[];
}

export interface ActivityItem {
  _id: string;
  type: string;
  description: string;
  user?: string | User;
  timestamp: string;
}

// ============ Import Types ============

export interface ImportPreview {
  success: boolean;
  validation?: ImportValidation;
  preview?: Partial<Flat>[];
  buildingPreview?: BuildingPreviewItem[];
  stats?: ImportStats;
  errors?: string[];
  warnings?: string[];
}

export interface ImportValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  foundColumns: Record<string, string>;
  stats: {
    validRows: number;
    invalidRows: number;
  };
}

export interface BuildingPreviewItem {
  address: string;
  houseNumber: string;
  flats: number;
  keyName: string;
}

export interface ImportStats {
  totalRows: number;
  totalBuildings: number;
  totalFlats: number;
  buildingsWithMultipleFlats: number;
  sampleSize: number;
  validRows: number;
}

export interface ImportProgress {
  importId: string;
  currentStep: number;
  totalSteps: number;
  stage: ImportStage;
  message: string;
  stats?: Partial<ImportStats>;
}

export type ImportStage =
  | 'uploading'
  | 'validating'
  | 'converting'
  | 'creating_district'
  | 'processing_buildings'
  | 'saving'
  | 'completed'
  | 'error';

// ============ UI Types ============

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'link';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
}

// ============ Form Types ============

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: (value: unknown) => string | null;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============ Hook Types ============

export interface UseApiQueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
}

export interface UseApiMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: string, variables: TVariables) => void;
  invalidateQueries?: string[];
}
