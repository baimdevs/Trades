// File: app/api/data/route.js
import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET() {
  // Ambil data akun dari server Vercel
  const data = await kv.get('nexus_terminal_data');
  
  // Jika ini pertama kali banget (database masih kosong), set data awal Sultan
  const defaultData = data || {
    balanceUSD: 384950.00,
    nxsHolding: 4250.75,
    transactions: [
      { id: 1, type: 'Deposit P2P Node', amount: '+1,500 NXS', status: 'Success', date: '2026-06-20' }
    ]
  };

  return NextResponse.json(defaultData);
}

export async function POST(request) {
  const body = await request.json();
  
  // Simpan data terbaru ke database Vercel
  await kv.set('nexus_terminal_data', body);
  
  return NextResponse.json({ success: true });
}
  
