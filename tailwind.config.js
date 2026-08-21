/** Tailwind 配置 —— 品牌色与设计 token 与 deliverables/gstack/site 设计评审一致 */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主蓝（CTA / 主按钮 / 链接）
        blue: {
          50: "#EFF6FF",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        // 橙色点缀（仅非文字图标/圆点/徽章，占比 <5%）
        orange: {
          50: "#FFF7ED",
          600: "#EA580C",
          700: "#C2410C",
        },
        // cool slate 中性灰阶
        slate: {
          900: "#0F172A",
          700: "#334155",
          600: "#475569",
          500: "#64748B",
          400: "#94A3B8",
          300: "#CBD5E1",
          200: "#E2E8F0",
          100: "#F1F5F9",
        },
      },
      borderRadius: { sm: "6px", md: "10px", lg: "16px" },
      maxWidth: { container: "1120px" },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto",
          "Helvetica Neue", "Arial", "PingFang SC", "Hiragino Sans GB",
          "Microsoft YaHei", "微软雅黑", "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
