import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { SKUState } from "../data/mockData"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupees(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatImpressions(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(2)}L`;
  return n.toLocaleString('en-IN');
}

export function stateColor(state: SKUState): string {
  const colors = {
    winner: 'bg-green-100 text-green-800 border-green-200',
    bleeder: 'bg-red-100 text-red-800 border-red-200',
    sleeper: 'bg-amber-100 text-amber-800 border-amber-200',
    dead: 'bg-gray-100 text-gray-600 border-gray-200',
    stable: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return colors[state];
}

export function stateBadgeColor(state: SKUState): string {
  const colors = {
    winner: 'bg-green-600 text-white',
    bleeder: 'bg-red-600 text-white',
    sleeper: 'bg-amber-600 text-white',
    dead: 'bg-gray-500 text-white',
    stable: 'bg-blue-600 text-white',
  };
  return colors[state];
}
export function getStatusColor(state: SKUState): string {
  const colors = {
    winner: 'bg-green-50 text-green-700 border-green-100',
    bleeder: 'bg-red-50 text-red-700 border-red-100',
    sleeper: 'bg-amber-50 text-amber-700 border-amber-100',
    dead: 'bg-gray-50 text-gray-700 border-gray-100',
    stable: 'bg-blue-50 text-blue-700 border-blue-100',
  };
  return colors[state];
}
