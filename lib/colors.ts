// アプリケーション全体で使用する色の定数定義
// テーマカラー: #9FE7C8 (エメラルドグリーン)

// HSLに変換: #9FE7C8 = hsl(149, 59%, 76%)
// RGBに変換: #9FE7C8 = rgb(159, 231, 200)

export const THEME_COLOR = '#9FE7C8';

// ブランドカラー（既存コンポーネント対応）
export const BRAND_COLORS = {
  google: {
    blue: '#4285F4',
    green: '#34A853',
    yellow: '#FBBC05',
    red: '#EA4335',
  },
  supabase: {
    green: '#3ECF8E',
    darkGreen: '#2E8B57',
  },
} as const;

// 統計色（既存コンポーネント対応）
export const STATS_COLORS = {
  primary: '#9FE7C8',
  secondary: '#64748B',
  trophy: {
    gold: '#FFD700',
  },
  accuracy: {
    purple: '#8B5CF6',
  },
} as const;

// 追加: Toast等の状態色（アイコンなどで使用）
export const STATE_COLORS = {
  success: { icon: '#10B981' },
  warning: { icon: '#F59E0B' },
  error: { icon: '#EF4444' },
  info: { icon: '#3B82F6' },
} as const;

// CSS変数用のカラー値
export const COLORS = {
  primary: {
    DEFAULT: '#9FE7C8',
    hsl: '149 59% 76%',
    rgb: '159 231 200',
    foreground: '#0F172A', // ダークグレー
  },
  
  secondary: {
    DEFAULT: '#F8FAFC',
    hsl: '210 20% 98%',
    rgb: '248 250 252',
    foreground: '#64748B',
  },
  
  accent: {
    DEFAULT: '#E0F2FE',
    hsl: '191 95% 93%',
    rgb: '224 242 254',
    foreground: '#0C4A6E',
  },
  
  muted: {
    DEFAULT: '#F1F5F9',
    hsl: '210 40% 96%',
    rgb: '241 245 249',
    foreground: '#64748B',
  },
  
  background: {
    DEFAULT: '#FFFFFF',
    rgb: '255 255 255',
  },
  
  foreground: {
    DEFAULT: '#0F172A',
    rgb: '15 23 42',
  },
  
  card: {
    DEFAULT: '#FFFFFF',
    rgb: '255 255 255',
    foreground: '#0F172A',
  },
  
  border: {
    DEFAULT: '#E2E8F0',
    rgb: '226 232 240',
  },
  
  input: {
    DEFAULT: '#E2E8F0',
    rgb: '226 232 240',
  },
  
  ring: {
    DEFAULT: '#9FE7C8',
    hsl: '149 59% 76%',
  },
  
  // 状態色
  success: '#10B981',
  warning: '#F59E0B', 
  error: '#EF4444',
  info: '#3B82F6',
  
  // グレースケール
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  }
} as const;

// CSS変数用の値（globals.cssで使用）
export const CSS_VARIABLES = {
  '--background': COLORS.background.rgb,
  '--foreground': COLORS.foreground.rgb,
  '--card': COLORS.card.rgb,
  '--card-foreground': COLORS.card.foreground,
  '--popover': COLORS.card.rgb,
  '--popover-foreground': COLORS.card.foreground,
  '--primary': COLORS.primary.hsl,
  '--primary-foreground': COLORS.primary.foreground,
  '--secondary': COLORS.secondary.hsl,
  '--secondary-foreground': COLORS.secondary.foreground,
  '--muted': COLORS.muted.hsl,
  '--muted-foreground': COLORS.muted.foreground,
  '--accent': COLORS.accent.hsl,
  '--accent-foreground': COLORS.accent.foreground,
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 98%',
  '--border': COLORS.border.rgb,
  '--input': COLORS.input.rgb,
  '--ring': COLORS.ring.hsl,
  '--radius': '0.5rem'
} as const;