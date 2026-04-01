const LightColors = {
    // Brand Colors (Vibrant Eco)
    primary: '#10B981',       // Vibrant Emerald (from image)
    primaryDark: '#059669',
    primaryLight: '#D1FAE5',  // Very light green for inputs

    secondary: '#111827',     // Dark text

    // Backgrounds
    background: '#F7F8FA',    // Neutral near-white
    surface: '#FFFFFF',
    card: '#FFFFFF',

    // Text
    text: '#111827',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',

    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    border: '#E5E7EB',
    inputBg: '#F5F6F8',       // Neutral light gray for inputs

    white: '#FFFFFF',
    black: '#000000',
};

const DarkColors = {
    // Brand Colors — kept consistent
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: '#064E3B',

    secondary: '#F9FAFB',

    // Backgrounds
    background: '#0F172A',
    surface: '#1E293B',
    card: '#1E293B',

    // Text
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textLight: '#64748B',

    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    border: '#334155',
    inputBg: '#1E293B',

    white: '#FFFFFF',
    black: '#000000',
};

// Default export for backward compatibility (light theme)
export const Colors = LightColors;

// Function to get theme-aware colors
export const getColors = (isDarkMode: boolean) => isDarkMode ? DarkColors : LightColors;

export { LightColors, DarkColors };
