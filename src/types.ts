
export enum AIProvider {
  OPENAI = 'OpenAI',
  GEMINI = 'Gemini',
  STABILITY = 'Stability AI',
  HUGEFACE = 'Hugging Face',
  DEEPAI = 'DeepAI',
  RUNWAY = 'RunwayML',
  MIDJOURNEY = 'Midjourney',
  NANOBANANA = 'NanoBanana',
  DREAMSTUDIO = 'DreamStudio',
  ARTBREEDER = 'Artbreeder',
  LLAMA = 'LLaMA',
  REPLICATE = 'Replicate'
}

export enum ArtMedium {
  // TRADITIONAL DRY MEDIA
  GRAPHITE = 'Graphite Pencil (HB–9B)',
  MECHANICAL_PENCIL = 'Mechanical Pencil',
  CARPENTER_PENCIL = 'Carpenter Pencil',
  COLORED_PENCIL = 'Colored Pencil',
  WATERCOLOR_PENCIL = 'Watercolor Pencil',
  CHARCOAL = 'Charcoal (Vine / Compressed)',
  CONTE_CRAYON = 'Conte Crayon',
  CHALK = 'Chalk',
  SOFT_PASTEL = 'Soft Pastel',
  OIL_PASTEL = 'Oil Pastel',
  SILVERPOINT = 'Silverpoint',
  GREASE_PENCIL = 'Grease Pencil',

  // INK & PERMANENT MEDIA
  BLACK_INK = 'Black Ink',
  BLUE_INK = 'Blue Ink',
  BROWN_INK = 'Brown Ink',
  INDIA_INK = 'India Ink',
  FOUNTAIN_PEN = 'Fountain Pen',
  BALLPOINT_PEN = 'Ballpoint Pen',
  GEL_PEN = 'Gel Pen',
  TECHNICAL_PEN = 'Technical Pen / Fineliner',
  BRUSH_PEN = 'Brush Pen',
  CALLIGRAPHY_PEN = 'Calligraphy Pen',
  REED_PEN = 'Reed Pen',
  DIP_PEN = 'Dip Pen',

  // PAINT & WET MEDIA
  WATERCOLOR = 'Watercolor',
  GOUACHE = 'Gouache',
  ACRYLIC = 'Acrylic Paint',
  OIL_PAINT = 'Oil Paint',
  TEMPERA = 'Tempera',
  INK_WASH = 'Ink Wash',
  ALCOHOL_MARKER = 'Alcohol Marker',
  WATER_BASED_MARKER = 'Water-Based Marker',
  AIRBRUSH = 'Airbrush',

  // DIGITAL MEDIA
  DIGITAL_SKETCH = 'Digital Sketch',
  DIGITAL_LINE_ART = 'Digital Line Art',
  DIGITAL_PAINTING = 'Digital Painting',
  VECTOR_ART = 'Vector Art',
  PIXEL_ART = 'Pixel Art',
  THREE_D_PAINT_OVER = '3D Paint-Over',

  // STUDY & EDUCATIONAL MODES
  GESTURE_STUDY = 'Gesture Drawing',
  CONSTRUCTION_STUDY = 'Construction Drawing',
  ANATOMY_STUDY = 'Anatomy Study',
  PERSPECTIVE_STUDY = 'Perspective Study',
  VALUE_STUDY = 'Value Study',
  LIGHTING_STUDY = 'Lighting Study',
  FORM_STUDY = 'Form Study',

  // ART STYLES & APPROACHES
  REALISM = 'Realism',
  HYPERREALISM = 'Hyperrealism',
  IMPRESSIONISM = 'Impressionism',
  EXPRESSIONISM = 'Expressionism',
  CARTOON = 'Cartoon',
  ANIME_MANGA = 'Anime / Manga',
  COMIC_BOOK = 'Comic Book',
  STORYBOARD = 'Storyboard',
  CONCEPT_ART = 'Concept Art',
  CHARACTER_DESIGN = 'Character Design',
  ILLUSTRATION = 'Illustration',
  ARCHITECTURAL_SKETCH = 'Architectural Sketch',
  FASHION_SKETCH = 'Fashion Sketch'
}

export enum SkillLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  PROFESSIONAL = 'Professional'
}

export type ImageSize = '1K' | '2K' | '4K';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  passwordHash: string;
  profilePic?: string;
  dob: string;
  securityQuestion: string;
  securityAnswer: string;
  dailyCount: number;
  lastResetDate: string;
  joinedAt: number;
  apiKeys: Record<string, string>; // Multi-provider API keys
  preferredProvider: AIProvider;
}

export interface SessionRecord {
  sessionId: string;
  userId: string;
  deviceInfo: string;
  lastActive: number;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePic?: string;
  dailyCount: number;
  passwordHash: string; // Store for the unmasking demonstration
  joinedAt: number;
  apiKeys: Record<string, string>;
  preferredProvider: AIProvider;
}

export interface Step {
  id: number;
  title: string;
  instruction: string;
  technicalTip: string;
  toolsNeeded: string[];
  visualType: 'gesture' | 'shapes' | 'outline' | 'detail' | 'shading' | 'final';
}

export interface ArtRoadmap {
  id: string;
  userId: string;
  medium: ArtMedium;
  skill: SkillLevel;
  steps: Step[];
  materials: string[];
  images: Record<string, string>;
  timestamp: number;
  lastActiveStep?: number;
}

export type ViewState =
  | 'landing' | 'login' | 'signup' | 'forgot-password' | 'recovery-options'
  | 'recovery-success' | 'studio' | 'workspace' | 'limit' | 'about'
  | 'history' | 'profile' | 'help' | 'contact' | 'settings' | 'gallery'
  | 'privacy' | 'policies';

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  headerName: string;
  modelName: string;
}

export interface AppState {
  view: ViewState;
  activeRoadmap: ArtRoadmap | null;
  currentStepIndex: number;
  inputImage: string | null;
  selectedMedium: ArtMedium;
  selectedSkill: SkillLevel;
  preferredProvider: AIProvider;
  selectedSize?: ImageSize;
  error: string | null;
  isProcessing: boolean;
  history: ArtRoadmap[];
  isVaultUnlocked?: boolean;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  passwordHash: string;
  profilePic?: string;
  dob: string;
  securityQuestion: string;
  securityAnswer: string;
  dailyCount: number;
  lastResetDate: string;
  joinedAt: number;
  apiKeys: Record<string, string>; // Multi-provider API keys
  preferredProvider: AIProvider;
}
