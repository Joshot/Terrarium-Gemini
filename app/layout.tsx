import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Aquaria - 3D Cozy Fish Breeding Tycoon',
  description: 'A serene 3D aquarium and terrarium simulation where you care for fish, breed rare hybrid species with realistic genetics, and expand your peaceful aquatic sanctuary.',
  openGraph: {
    title: 'Aquaria - 3D Cozy Fish Breeding Tycoon',
    description: 'A serene 3D aquarium and terrarium simulation where you care for fish, breed rare hybrid species with realistic genetics, and expand your peaceful aquatic sanctuary.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aquaria - 3D Cozy Fish Breeding Tycoon',
    description: 'A serene 3D aquarium and terrarium simulation where you care for fish, breed rare hybrid species with realistic genetics, and expand your peaceful aquatic sanctuary.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
