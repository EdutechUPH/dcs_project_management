// src/components/Header.tsx
import Link from 'next/link';
import UserStatus from './UserStatus';

export default function Header() {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center sticky top-0 z-10">
      <Link href="/" className="text-xl font-bold">DCS Project Tracker</Link>
      
      {/* All dynamic content is handled by UserStatus */}
      <UserStatus />
    </header>
  );
}