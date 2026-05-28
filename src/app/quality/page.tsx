"use client"

import React, { useState } from "react"
import { 
    ClipboardCheck, 
    Video, 
    Mic, 
    Lightbulb, 
    Sliders, 
    FileText, 
    Sparkles, 
    AlertCircle, 
    Users, 
    Info,
    ChevronDown,
    ChevronUp
} from "lucide-react"

// Types for guidelines structure
interface GuidelineItem {
    id: string;
    num: number;
    text: string;
    subItems?: string[];
    detail?: string;
}

export default function QualityStandardPage() {
    // Guidelines data grouped by section
    const preProductionItems: GuidelineItem[] = [
        {
            id: "pre-1",
            num: 1,
            text: "Penjadwalan idealnya H-7, bertanya ke ID jika belum konfirmasi",
            detail: "Pastikan timeline terjadwal dengan baik untuk menghindari bentrok jadwal studio atau ketersediaan kru."
        },
        {
            id: "pre-2",
            num: 2,
            text: "Persiapkan jika ada permintaan khusus dari dosen",
            detail: "Koordinasikan kebutuhan teknis khusus (misalnya alat peraga, setup tangkapan layar tambahan) sebelum proses rekaman dimulai."
        },
        {
            id: "pre-3",
            num: 3,
            text: "Minta script, PPT, referensi aset (misalnya gambar medis untuk FK) dosen ke tim ID. Kalau bisa sudah masuk di sharepoint",
            detail: "Aset pendukung sebaiknya sudah diunggah di SharePoint agar siap digunakan dan diintegrasikan saat taping."
        }
    ];

    const tapingCameraItems: GuidelineItem[] = [
        {
            id: "cam-1",
            num: 1,
            text: "Persiapan minimal 30 menit sebelum taping. Wajib mempersiapkan: battery charged, kamera + memory (ssd (priority)/sd card), audio, lighting, prompter dan/atau ppt, posisi pembicara (blocking).",
            detail: "Lakukan checklist fisik ini setiap sebelum rekaman untuk menghindari kendala teknis di tengah jalan."
        },
        {
            id: "cam-2",
            num: 2,
            text: "Pakai dua kamera (Lumix S5Xii)",
            detail: "Setup multi-camera memberikan opsi sudut pengambilan gambar (angle) yang lebih dinamis saat editing."
        },
        {
            id: "cam-3",
            num: 3,
            text: "Resolusi (minimal Full HD)",
            detail: "Standar ketajaman video pembelajaran UPH untuk kenyamanan belajar mahasiswa."
        },
        {
            id: "cam-4",
            num: 4,
            text: "Shutter Speed minimal 24 fps",
            detail: "Gunakan kelipatan yang sesuai (misalnya 1/50 detik) untuk pergerakan gambar yang natural."
        },
        {
            id: "cam-5",
            num: 5,
            text: "Menggunakan profil warna Standard/Natural (WB 5100-5600K). Sesuaikan dengan skintone objek.",
            detail: "Atur White Balance agar warna kulit subjek terlihat akurat dan konsisten."
        },
        {
            id: "cam-6",
            num: 6,
            text: "Menggunakan dual native ISO 100 atau 640 (640 jika low light)",
            detail: "Dual native ISO membantu menjaga kualitas sinyal sensor dan meminimalkan noise pada kondisi kurang cahaya."
        },
        {
            id: "cam-7",
            num: 7,
            text: "Aperture f:2.8 - f:4.0 (Jika group, gunakan f:4.0)",
            detail: "Aperture lebih sempit memastikan semua objek dalam grup tetap berada dalam bidang fokus."
        },
        {
            id: "cam-8",
            num: 8,
            text: "Filter Camera: Gunakan filter VND-CPL jika objek menggunakan kacamata atau banyak refleksi",
            detail: "Membantu mengeleminasi pantulan cahaya lampu studio pada kacamata dosen."
        },
        {
            id: "cam-9",
            num: 9,
            text: "Gunakan Focal Length 35mm untuk Cam 1 dan 50mm - 70mm untuk Cam 2",
            detail: "Cam 1 untuk wide/medium shot, Cam 2 untuk tight/close-up shot portrait."
        },
        {
            id: "cam-10",
            num: 10,
            text: "Prompter digunakan di camera 1",
            detail: "Memudahkan dosen membaca script sambil tetap menatap lensa kamera utama secara natural."
        }
    ];

    const tapingAudioItems: GuidelineItem[] = [
        {
            id: "aud-1",
            num: 11,
            text: "Untuk audio, minimal bitrate 24-bit, resolution 48khz.",
            detail: "Standar kualitas audio resolusi tinggi untuk mempermudah pemrosesan audio lebih lanjut."
        },
        {
            id: "aud-2",
            num: 12,
            text: "Untuk perekaman audio: gunakan Zoom H8 dan Shotgun Mic Sennheiser MKE 600 (prioritas), atau clip-on Hollyland (dimasukkan ke HP/tablet).",
            detail: "Prioritaskan shotgun mic untuk suara ruang yang jernih, gunakan clip-on jika dosen aktif bergerak atau membutuhkan setup ringkas."
        }
    ];

    const tapingLightingItems: GuidelineItem[] = [
        {
            id: "lit-1",
            num: 13,
            text: "Menggunakan prinsip 3-point lighting:",
            detail: "Pengaturan pencahayaan tiga titik standar industri untuk memberikan dimensi dan memisahkan subjek dari latar belakang."
        }
    ];

    const editingItems: GuidelineItem[] = [
        {
            id: "edt-1",
            num: 1,
            text: "Untuk video di dalam satu mata kuliah, diusahakan memiliki style video + editing (konsep, colour grading, lighting, font/typeface, assets) yang sama/mendekati.",
            detail: "Konsistensi estetik membangun identitas visual materi kuliah yang profesional."
        },
        {
            id: "edt-2",
            num: 2,
            text: "Menggunakan DCS Approved assets:",
            subItems: [
                "Font (Judul, Subjudul, Isi, details, subtitle)",
                "Lower Third",
                "UPH Opening and Closing scene"
            ],
            detail: "Wajib menggunakan template aset resmi yang telah disetujui untuk keseragaman brand UPH."
        },
        {
            id: "edt-3",
            num: 3,
            text: "Menggunakan audio yang sudah diedit oleh sound engineer (prioritas). Jika di kondisi tertentu harus menggunakan audio yang belum diedit oleh sound engineer, maka video harus diupdate di kemudian hari menggunakan audio yang sudah diedit.",
            detail: "Pastikan kualitas audio maksimal. Jika terpaksa rilis dengan audio mentah, jadwalkan revisi audio sesegera mungkin."
        }
    ];

    // State for expanded detail items
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 bg-gray-50/30 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs mb-1.5 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        DCS Video Production Handbook
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quality Standard Guidelines</h1>
                    <p className="text-sm text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
                        Panduan penjaminan mutu produksi video pembelajaran resmi untuk tim **Digital Content Specialist (DCS) UPH**. Dokumen ini merangkum seluruh standar teknis mulai dari Pra-produksi, Taping, hingga Editing.
                    </p>
                </div>
                
                {/* Handbook Badge */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs self-start md:self-auto">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                        <ClipboardCheck className="w-5.5 h-5.5" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">DCS Standards</div>
                        <div className="text-sm font-bold text-gray-800">Version 2.1 (Active)</div>
                    </div>
                </div>
            </div>

            {/* Grid Layout of Standards */}
            <div className="space-y-8">
                
                {/* 1. PRE-PRODUCTION CARD */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="bg-blue-50/50 border-b border-blue-100 px-6 py-4.5 flex items-center gap-3">
                        <div className="p-2 bg-blue-500 text-white rounded-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-blue-950 text-base leading-none">PRE-PRODUCTION</h2>
                            <p className="text-xs text-blue-700/80 mt-1">Perencanaan matang, jadwal ideal, dan koordinasi aset materi kuliah.</p>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                        {preProductionItems.map((item) => (
                            <StaticGuidelineRow 
                                key={item.id} 
                                item={item} 
                                isExpanded={!!expandedItems[item.id]} 
                                onToggleExpand={toggleExpand}
                                themeColor="blue"
                            />
                        ))}
                    </div>
                </div>

                {/* 2. TAPING CARD */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="bg-emerald-50/50 border-b border-emerald-100 px-6 py-4.5 flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 text-white rounded-lg">
                            <Video className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-emerald-950 text-base leading-none">TAPING (PRODUCTION)</h2>
                            <p className="text-xs text-emerald-700/80 mt-1">Standar setup multi-camera, setingan audio, dan pencahayaan studio.</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Technical Camera Subsection */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                Camera Settings & Setup
                            </h3>
                            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden">
                                {tapingCameraItems.map((item) => (
                                    <StaticGuidelineRow 
                                        key={item.id} 
                                        item={item} 
                                        isExpanded={!!expandedItems[item.id]} 
                                        onToggleExpand={toggleExpand}
                                        themeColor="emerald"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Audio Setup Subsection */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                                Audio Capture Settings
                            </h3>
                            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden">
                                {tapingAudioItems.map((item) => (
                                    <StaticGuidelineRow 
                                        key={item.id} 
                                        item={item} 
                                        isExpanded={!!expandedItems[item.id]} 
                                        onToggleExpand={toggleExpand}
                                        themeColor="cyan"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Lighting Setup Subsection */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                Studio Lighting configuration
                            </h3>
                            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                                {tapingLightingItems.map((item) => (
                                    <StaticGuidelineRow 
                                        key={item.id} 
                                        item={item} 
                                        isExpanded={!!expandedItems[item.id]} 
                                        onToggleExpand={toggleExpand}
                                        themeColor="amber"
                                    />
                                ))}
                                
                                {/* 3-Point Lighting Spec Box */}
                                <div className="bg-amber-50/20 p-5 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        
                                        {/* Key Light Card */}
                                        <div className="bg-white p-4 rounded-xl border border-amber-100/70 shadow-2xs space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase">Point 1</span>
                                                <span className="text-xs font-extrabold text-amber-600">70% - 100% Intensity</span>
                                            </div>
                                            <h4 className="text-sm font-extrabold text-gray-800">Key Light</h4>
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                **Godox SL 120 Mark III**
                                                <br />Diletakkan di sebelah kanan kamera utama, posisi menghadap ke bawah ~45 derajat.
                                            </p>
                                        </div>

                                        {/* Fill Light Card */}
                                        <div className="bg-white p-4 rounded-xl border border-amber-100/70 shadow-2xs space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase">Point 2</span>
                                                <span className="text-xs font-extrabold text-amber-600">30% - 70% Intensity</span>
                                            </div>
                                            <h4 className="text-sm font-extrabold text-gray-800">Fill Light</h4>
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                **Godox SL 120 Mark III**
                                                <br />Posisi berseberangan dengan key light untuk melembutkan bayangan objek.
                                            </p>
                                        </div>

                                        {/* Back Light Card */}
                                        <div className="bg-white p-4 rounded-xl border border-amber-100/70 shadow-2xs space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase">Point 3</span>
                                                <span className="text-xs font-extrabold text-emerald-600">Cinematic Depth</span>
                                            </div>
                                            <h4 className="text-sm font-extrabold text-gray-800">Back / Rim / Hair Light</h4>
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                **Godox TL 60 / Lampu Hias**
                                                <br />Fungsi untuk estetika dan memberikan depth / kesan cinematic pada video pembelajaran.
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 3. EDITING & ASSETS CARD */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="bg-indigo-50/50 border-b border-indigo-100 px-6 py-4.5 flex items-center gap-3">
                        <div className="p-2 bg-indigo-500 text-white rounded-lg">
                            <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-indigo-950 text-base leading-none">EDITING, AUDIO & APPROVED ASSETS</h2>
                            <p className="text-xs text-indigo-700/80 mt-1">Standar branding aset DCS, style editing konsisten, dan pemrosesan audio engineer.</p>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {editingItems.map((item) => (
                            <StaticGuidelineRow 
                                key={item.id} 
                                item={item} 
                                isExpanded={!!expandedItems[item.id]} 
                                onToggleExpand={toggleExpand}
                                themeColor="indigo"
                            />
                        ))}
                    </div>
                </div>

            </div>

            {/* Bottom Preview Banner: DCS Peer-Review System */}
            <div className="bg-linear-to-r from-gray-900 to-slate-800 text-white p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-1"></div>
                
                <div className="space-y-2 max-w-2xl relative z-10">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                        <Users className="w-3 h-3" />
                        Rencana Mendatang: Cross-Review
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">Sistem Scoring Peer-Review DCS</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                        Kedepannya, kita akan mengintegrasikan sistem **scoring silang**. Anggota DCS akan menerima satu tautan video secara acak tiap term dari sesama rekan (tanpa mengetahui pembuatnya), lalu melakukan penilaian kualitas langsung pada halaman ini menggunakan panduan di atas.
                    </p>
                </div>
                
                <div className="bg-gray-800/60 border border-gray-700 p-4 rounded-xl flex items-center gap-3 self-start md:self-auto min-w-[210px] relative z-10">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                        <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">System Launch</div>
                        <div className="text-sm font-extrabold text-white">Next Phase (T3)</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Row component for static guideline item
interface StaticGuidelineRowProps {
    item: GuidelineItem;
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
    themeColor: "blue" | "emerald" | "cyan" | "amber" | "indigo";
}

function StaticGuidelineRow({ item, isExpanded, onToggleExpand, themeColor }: StaticGuidelineRowProps) {
    const colors = {
        blue: {
            bulletBg: "bg-blue-50 text-blue-700",
            rowBg: "hover:bg-blue-50/10",
        },
        emerald: {
            bulletBg: "bg-emerald-50 text-emerald-700",
            rowBg: "hover:bg-emerald-50/10",
        },
        cyan: {
            bulletBg: "bg-cyan-50 text-cyan-700",
            rowBg: "hover:bg-cyan-50/10",
        },
        amber: {
            bulletBg: "bg-amber-50 text-amber-700",
            rowBg: "hover:bg-amber-50/10",
        },
        indigo: {
            bulletBg: "bg-indigo-50 text-indigo-700",
            rowBg: "hover:bg-indigo-50/10",
        }
    }[themeColor];

    return (
        <div className={`p-4 sm:p-5 flex items-start gap-4 transition-all ${colors.rowBg}`}>
            {/* Number bullet */}
            <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${colors.bulletBg}`}>
                {item.num}
            </div>

            {/* Content text */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">
                        {item.text}
                    </p>
                    
                    {item.detail && (
                        <button 
                            onClick={() => onToggleExpand(item.id)}
                            className="text-gray-400 hover:text-gray-600 p-0.5 hover:bg-gray-100 rounded-md transition-colors"
                            title="Tampilkan Detail Penjelasan"
                        >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    )}
                </div>

                {/* Subitems (specifically for Approved Assets) */}
                {item.subItems && (
                    <ul className="mt-3 pl-4 border-l-2 border-indigo-200 space-y-1.5 text-xs text-gray-500 font-medium">
                        {item.subItems.map((sub, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0"></span>
                                <span>{sub}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Collapsible explanations */}
                {isExpanded && item.detail && (
                    <div className="mt-3 bg-gray-50 border border-gray-100 p-3 rounded-lg text-xs text-gray-600 leading-relaxed flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-gray-700 block mb-0.5">Penjelasan Tambahan:</span>
                            {item.detail}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
