// アプリケーション全体で使用する色の定数定義

// メインテーマカラー
export const THEME_COLORS = {
  // プライマリカラー（テーマカラー #72C6BD）
  primary: {
    DEFAULT: '#72C6BD',
    hsl: '174 41% 61%',
    rgb: '114 198 189',
    foreground: '#FFFFFF'
  },
  
  // セカンダリカラー
  secondary: {
    DEFAULT: '#F8FAFC',
    foreground: '#333333'
  },
  
  // アクセントカラー
  accent: {
    DEFAULT: '#F8FAFC',
    foreground: '#333333'
  },
  
  // ミュートカラー
  muted: {
    DEFAULT: '#F8FAFC',
    foreground: '#64748B'
  }
} as const;

// システムカラー
export const SYSTEM_COLORS = {
  // 背景色
  background: {
    DEFAULT: '#FFFFFF',
    rgb: '255 255 255'
  },
  
  // 前景色（テキスト）
  foreground: {
    DEFAULT: '#000000',
    rgb: '0 0 0'
  },
  
  // ボーダー
  border: {
    DEFAULT: '#E2E8F0',
    rgb: '226 232 240'
  },
  
  // インプット
  input: {
    DEFAULT: '#E2E8F0',
    rgb: '226 232 240'
  },
  
  // リング（フォーカス）
  ring: {
    DEFAULT: '#72C6BD',
    hsl: '174 41% 61%'
  }
} as const;

// カード関連
export const CARD_COLORS = {
  DEFAULT: '#FFFFFF',
  foreground: '#000000',
  rgb: '255 255 255',
  foregroundRgb: '0 0 0'
} as const;

// ポップオーバー関連
export const POPOVER_COLORS = {
  DEFAULT: '#FFFFFF',
  foreground: '#000000',
  rgb: '255 255 255',
  foregroundRgb: '0 0 0'
} as const;

// 状態カラー
export const STATE_COLORS = {
  // 成功
  success: {
    DEFAULT: '#10B981',
    foreground: '#FFFFFF',
    light: '#D1FAE5',
    dark: '#065F46'
  },
  
  // 警告
  warning: {
    DEFAULT: '#F59E0B',
    foreground: '#FFFFFF',
    light: '#FEF3C7',
    dark: '#92400E',
    // Toast用の黄色系
    border: '#FDE68A',
    background: '#FFFBEB',
    text: '#92400E',
    icon: '#F59E0B'
  },
  
  // エラー・破壊的操作
  destructive: {
    DEFAULT: '#EF4444',
    foreground: '#FFFFFF',
    rgb: '239 68 68'
  },
  
  // 情報
  info: {
    DEFAULT: '#3B82F6',
    foreground: '#FFFFFF',
    light: '#DBEAFE',
    dark: '#1E40AF'
  }
} as const;

// ブランドカラー（外部サービス用）
export const BRAND_COLORS = {
  // Google
  google: {
    blue: '#4285F4',
    green: '#34A853',
    yellow: '#F5F5F5',
    red: '#EA4335'
  },
  
  // Supabase
  supabase: {
    green: '#3ECF8E',
    darkGreen: '#249361'
  }
} as const;

// 統計・データ表示用カラー
export const STATS_COLORS = {
  // トロフィー・成績表示
  trophy: {
    gold: '#F59E0B',
    silver: '#9CA3AF',
    bronze: '#D97706'
  },
  
  // 正解率表示
  accuracy: {
    high: '#10B981',    // 80%以上
    medium: '#F59E0B',  // 60-79%
    low: '#EF4444',     // 60%未満
    purple: '#8B5CF6'   // 特別表示用
  },
  
  // チャート用カラー
  chart: {
    1: '#72C6BD',
    2: '#8B5CF6',
    3: '#F59E0B',
    4: '#EF4444',
    5: '#10B981'
  }
} as const;

// CSS変数用の値（globals.cssで使用）
export const CSS_VARIABLES = {
  '--background': SYSTEM_COLORS.background.rgb,
  '--foreground': SYSTEM_COLORS.foreground.rgb,
  '--card': CARD_COLORS.rgb,
  '--card-foreground': CARD_COLORS.foregroundRgb,
  '--popover': POPOVER_COLORS.rgb,
  '--popover-foreground': POPOVER_COLORS.foregroundRgb,
  '--primary': THEME_COLORS.primary.hsl,
  '--primary-foreground': '255 255 255',
  '--secondary': '248 250 252',
  '--secondary-foreground': '0 0 0',
  '--muted': '248 250 252',
  '--muted-foreground': '100 116 139',
  '--accent': '248 250 252',
  '--accent-foreground': '0 0 0',
  '--destructive': STATE_COLORS.destructive.rgb,
  '--destructive-foreground': '255 255 255',
  '--border': SYSTEM_COLORS.border.rgb,
  '--input': SYSTEM_COLORS.input.rgb,
  '--ring': THEME_COLORS.primary.hsl,
  '--radius': '0.5rem'
} as const;

// ユーティリティ関数
export const getColorValue = (colorPath: string): string | null => {
  // 例: getColorValue('theme.primary.DEFAULT') => '#72C6BD'
  const keys = colorPath.split('.');
  let value: Record<string, unknown> = { theme: THEME_COLORS, system: SYSTEM_COLORS, state: STATE_COLORS, brand: BRAND_COLORS, stats: STATS_COLORS };
  
  for (const key of keys) {
    value = value[key] as Record<string, unknown>;
    if (value === undefined) return null;
  }
  
  return typeof value === 'string' ? value : null;
};

// HSL形式の色をRGB形式に変換
export const hslToRgb = (hsl: string): string => {
  // 簡易実装 - 必要に応じて拡張
  return hsl;
};

// RGB形式の色をHSL形式に変換
export const rgbToHsl = (rgb: string): string => {
  // 簡易実装 - 必要に応じて拡張
  return rgb;
};