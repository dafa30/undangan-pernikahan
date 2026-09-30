'use server'

import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from "@/lib/lib/supabase";

// Inisialisasi Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function enhanceWishWithAI(rawWish: string) {
  try {
    // Daftar kandidat model dari yang paling canggih hingga versi stabil terlama
    const supportedModels = [
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.0-pro',
      'gemini-pro'
    ];
    
    let finalResult = null;
    const prompt = `Anda adalah asisten pernikahan yang elegan. Rapikan dan perindah ucapan selamat pernikahan berikut agar terdengar lebih hangat, puitis, dan menggunakan tata bahasa Indonesia yang baik dan sopan. Jangan merubah makna asli pesan, hanya percantik diksinya. Pesan asli: "${rawWish}"`;

    // Looping untuk mencoba model satu per satu
    for (const modelName of supportedModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        finalResult = result.response.text();
        
        // Jika berhasil mendapatkan teks, keluar dari loop
        console.log(`[BERHASIL] Menggunakan model: ${modelName}`);
        break; 
      } catch (e: any) {
        // Jika model ini 404/gagal, catat di terminal dan lanjut ke model berikutnya
        console.log(`[GAGAL] Model ${modelName} tidak tersedia.`);
      }
    }

    if (finalResult) {
      return finalResult;
    } else {
      throw new Error("Semua daftar model Gemini gagal diakses.");
    }

  } catch (error) {
    console.error("Error formatting wish:", error);
    return rawWish; // Fallback ke teks asli jika terjadi error fatal
  }
}

export async function addWish(data: {
  name: string;
  attendance: string;
  wish: string;
}) {
  const { error } = await supabase
    .from("wishes")
    .insert([
      {
        name: data.name,
        attendance: data.attendance,
        wish: data.wish,
      },
    ]);

  if (error) {
    console.error(error);

    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
}

export async function getWishes() {
  const { data, error } = await supabase
    .from("wishes")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }
  return data; 
}

export async function deleteWish(id: number) {
  const { error } = await supabase
    .from("wishes")
    .delete()
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
  };
}
