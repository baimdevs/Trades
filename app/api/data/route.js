import { get } from '@vercel/edge-config';
import { NextResponse } from 'next/server';

// Penyimpanan sementara di memori server Vercel
let memoryStorage = null;

export async function GET() {
  try {
    if (memoryStorage) {
      return NextResponse.json(memoryStorage);
    }

    const backupData = await get('nexus_terminal_data');
    
    const defaultData = backupData || {
      balanceUSD: 384950.00,
      nxsHolding: 4250.75,
      transactions: [
        { id: 1, type: 'Deposit P2P Node', amount: '+1,500 NXS', status: 'Success', date: '2026-06-20 14:24' }
      ]
    };

    memoryStorage = defaultData;
    return NextResponse.json(defaultData);
  } catch (error) {
    return NextResponse.json({ error: "Gagal membaca database Edge" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    memoryStorage = body; // Update memori runtime server
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memperbarui data" }, { status: 500 });
  }
}
