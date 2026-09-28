import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CounsellAI — Student Counselling & Early Intervention Platform',
  description:
    'Institutional student intervention platform with deterministic risk detection, AI counselling briefs, structured action plans, and longitudinal improvement tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
