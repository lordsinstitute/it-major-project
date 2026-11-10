/**
 * Mediqo Centralized Design System
 * Approved Brand Colors:
 * - Deep Teal: #123B45
 * - Aqua: #20A69A
 * - Soft Mint: #D9F3EC
 * - Off-white: #F4F7F6
 * - Warm Coral: #FF9B71
 */

export type ThemeMode = "light" | "dark";

export const BRAND = {
  deepTeal: "#123B45",
  aqua: "#20A69A",
  softMint: "#D9F3EC",
  offWhite: "#F4F7F6",
  warmCoral: "#FF9B71",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#ef4444",
} as const;

export interface ThemeColors {
  isDark: boolean;
  bg: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  primarySubtle: string;
  aqua: string;
  softMint: string;
  coral: string;
  coralSubtle: string;
  cardBg: string;
  inputBg: string;
  sidebarBg: string;
  shadow: string;
  success: string;
  warning: string;
}

export function getThemeColors(mode: ThemeMode): ThemeColors {
  const isDark = mode === "dark";
  return {
    isDark,
    bg: isDark ? "#0d1a1c" : BRAND.offWhite,
    surface: isDark ? "#122528" : "#ffffff",
    surfaceSubtle: isDark ? "#172e32" : "#f0f6f4",
    border: isDark ? "#1d3d42" : "#d8e9e4",
    borderSubtle: isDark ? "#173136" : "#e6f2ee",
    text: isDark ? "#e8f4f2" : BRAND.deepTeal,
    textMuted: isDark ? "#91b3ab" : "#5a7a78",
    primary: BRAND.aqua,
    primaryHover: "#198b81",
    primarySubtle: isDark ? "rgba(32, 166, 154, 0.18)" : BRAND.softMint,
    aqua: BRAND.aqua,
    softMint: BRAND.softMint,
    coral: BRAND.warmCoral,
    coralSubtle: isDark ? "rgba(255, 155, 113, 0.18)" : "#fff1ec",
    cardBg: isDark ? "#14292d" : "#ffffff",
    inputBg: isDark ? "#193236" : "#ffffff",
    sidebarBg: isDark ? "#0f2022" : "#ffffff",
    shadow: isDark
      ? "0 8px 30px rgba(0, 0, 0, 0.35)"
      : "0 8px 30px rgba(18, 59, 69, 0.06)",
    success: BRAND.success,
    warning: BRAND.warning,
  };
}

export const commonStyles = {
  card: (colors: ThemeColors) => ({
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: 24,
    boxShadow: colors.shadow,
    transition: "background-color 0.2s ease, border-color 0.2s ease",
  }),
  buttonPrimary: (colors: ThemeColors) => ({
    padding: "10px 20px",
    backgroundColor: colors.primary,
    color: "#ffffff",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(32, 166, 154, 0.25)",
    transition: "all 0.15s ease",
  }),
  buttonSecondary: (colors: ThemeColors) => ({
    padding: "10px 18px",
    backgroundColor: colors.surfaceSubtle,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.15s ease",
  }),
  input: (colors: ThemeColors) => ({
    padding: "11px 14px",
    backgroundColor: colors.inputBg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s ease",
  }),
};
