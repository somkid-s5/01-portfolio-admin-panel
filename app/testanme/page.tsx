"use client";

import React, { useState } from 'react';

interface Prize {
  id: string;
  name: string;
  weight: number; // น้ำหนักสำหรับการสุ่ม
  color: string;
}

const WeightedWheel = () => {
  // ข้อมูลรางวัล (ครั้งแรกใช้ weight ที่ตั้ง, ครั้งที่สองเป็นต้นไปเท่ากันหมด)
  const prizes: Prize[] = [
    { id: '1', name: 'มาร์ท', weight: 5, color: '#FF6B6B' },   
    { id: '2', name: 'อาม', weight: 5, color: '#4ECDC4' },      
    { id: '3', name: 'หนุ่น', weight: 5, color: '#45B7D1' },       
    { id: '4', name: 'เดียร์', weight: 85, color: '#FFA07A' },
  ];

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const [spinCount, setSpinCount] = useState(0);

  // ฟังก์ชันสุ่มแบบมีน้ำหนัก (Weighted Random)
  const weightedRandom = (): Prize => {
    // ถ้าหมุนครั้งแรก (spinCount === 0) ใช้ weight ที่ตั้งไว้
    // ถ้าหมุนครั้งที่สองเป็นต้นไป ให้โอกาสเท่ากันทุกคน
    const useEqualWeight = spinCount > 0;
    
    if (useEqualWeight) {
      // สุ่มแบบเท่ากันหมด (โอกาสเท่ากัน)
      const randomIndex = Math.floor(Math.random() * prizes.length);
      return prizes[randomIndex];
    } else {
      // สุ่มแบบมีน้ำหนักตาม weight (ครั้งแรก)
      const totalWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (const prize of prizes) {
        random -= prize.weight;
        if (random <= 0) {
          return prize;
        }
      }
      
      return prizes[prizes.length - 1]; // fallback
    }
  };

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // 🎯 ขั้นตอนที่ 1: สุ่มหาผู้ชนะก่อน (ก่อนที่วงล้อจะหมุน)
    const winner = weightedRandom();
    
    // 🎯 ขั้นตอนที่ 2: หาตำแหน่งของผู้ชนะในวงล้อ
    const winnerIndex = prizes.findIndex(p => p.id === winner.id);
    const degreesPerSlice = 360 / prizes.length;
    
    // SVG เริ่มวาดจากมุม 0° (3 นาฬิกา) และวาดตามเข็มนาฬิกา
    // ช่องแรก (index 0) เริ่มที่ 0° ถึง degreesPerSlice
    // เราต้องการให้ลูกศร (ที่ 270° หรือ 12 นาฬิกา) ชี้กลางช่อง
    const sliceMiddleAngle = (winnerIndex * degreesPerSlice) + (degreesPerSlice / 2);
    
    // เราต้องหมุนวงล้อให้ sliceMiddleAngle มาอยู่ที่ 270° (12 นาฬิกา)
    // rotation ที่ต้องการ = 270° - sliceMiddleAngle
    const spinRotations = 5; // หมุน 5 รอบ
    const baseRotation = 270 - sliceMiddleAngle;
    const finalRotation = (360 * spinRotations) + baseRotation;
    
    // 🎯 ขั้นตอนที่ 4: หมุนวงล้อไปหยุดที่ตำแหน่งผู้ชนะ
    setRotation(rotation + finalRotation);

    // แสดงผลลัพธ์หลังจากหมุนเสร็จ
    setTimeout(() => {
      setIsSpinning(false);
      setResult(winner);
      setSpinCount(prev => prev + 1);
    }, 4000);
  };

  // คำนวณ % จริงของแต่ละรางวัล
  const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
          <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🎡 Lucky Wheel</h1>
          <p className="text-purple-200 text-lg">
            {spinCount === 0 ? 'ครั้งแรก: ใช้ weight ที่ตั้งไว้ (เดียร์ 85%)' : 'ครั้งที่ 2+: โอกาสเท่ากันทุกคน!'}
          </p>
          <p className="text-purple-300 text-sm mt-2">หมุนไปแล้ว: {spinCount} ครั้ง</p>
        </div>

        <div className="flex flex-col gap-8">
          {/* วงล้อ */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* ลูกศรชี้ - ปรับให้ใหญ่และเด่นชัดขึ้น */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-20">
                <div className="relative">
                  {/* เงาลูกศร */}
                  <div className="absolute inset-0 blur-sm">
                    <div className="w-0 h-0 border-l-[25px] border-r-[25px] border-t-[50px] border-l-transparent border-r-transparent border-t-black/30"></div>
                  </div>
                  {/* ลูกศรหลัก */}
                  <div className="relative">
                    <div className="w-0 h-0 border-l-[25px] border-r-[25px] border-t-[50px] border-l-transparent border-r-transparent border-t-red-500"></div>
                    {/* ขอบทอง */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2">
                      <div className="w-0 h-0 border-l-[22px] border-r-[22px] border-t-[45px] border-l-transparent border-r-transparent border-t-yellow-400"></div>
                    </div>
                  </div>
                  {/* จุดเน้นที่ปลายลูกศร */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-red-600"></div>
                </div>
              </div>

              {/* วงล้อ */}
              <div className="relative w-[400px] h-[400px]">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full drop-shadow-2xl"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                  }}
                >
                  {prizes.map((prize, index) => {
                    const angle = (360 / prizes.length) * index;
                    const nextAngle = (360 / prizes.length) * (index + 1);
                    
                    return (
                      <g key={prize.id}>
                        <path
                          d={`M 100 100 L ${100 + 100 * Math.cos((angle * Math.PI) / 180)} ${100 + 100 * Math.sin((angle * Math.PI) / 180)} A 100 100 0 0 1 ${100 + 100 * Math.cos((nextAngle * Math.PI) / 180)} ${100 + 100 * Math.sin((nextAngle * Math.PI) / 180)} Z`}
                          fill={prize.color}
                          stroke="white"
                          strokeWidth="2"
                        />
                        <text
                          x={100 + 60 * Math.cos(((angle + nextAngle) / 2 * Math.PI) / 180)}
                          y={100 + 60 * Math.sin(((angle + nextAngle) / 2 * Math.PI) / 180)}
                          fill="white"
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${(angle + nextAngle) / 2 + 90}, ${100 + 60 * Math.cos(((angle + nextAngle) / 2 * Math.PI) / 180)}, ${100 + 60 * Math.sin(((angle + nextAngle) / 2 * Math.PI) / 180)})`}
                        >
                          {prize.name.length > 12 ? prize.name.substring(0, 10) + '...' : prize.name}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* จุดตรงกลาง */}
                  <circle cx="100" cy="100" r="15" fill="white" stroke="#333" strokeWidth="2" />
                  <circle cx="100" cy="100" r="8" fill="#333" />
                </svg>
              </div>
            </div>

            {/* ปุ่มหมุน */}
            <button
              onClick={spinWheel}
              disabled={isSpinning}
              className={`mt-8 px-12 py-4 text-2xl font-bold rounded-full shadow-lg transform transition-all ${
                isSpinning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-yellow-500 hover:scale-110 hover:shadow-2xl active:scale-95'
              } text-white`}
            >
              {isSpinning ? '🎡 กำลังหมุน...' : '🎯 หมุนเลย!'}
            </button>

            {/* แสดงผลลัพธ์ */}
            {result && (
              <div className="mt-6 p-6 bg-white rounded-2xl shadow-2xl text-center animate-bounce">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🎉 ยินดีด้วย!</h2>
                <p className="text-3xl font-bold" style={{ color: result.color }}>
                  {result.name}
                </p>
              </div>
            )}
          </div>


        </div>

        {/* คำอธิบายการทำงาน */}
        <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-3">⚙️ วิธีการทำงาน</h3>
          <ol className="text-purple-100 space-y-2 list-decimal list-inside">
            <li><strong>ครั้งแรก:</strong> ใช้ weight ตามที่ตั้งไว้ → เดียร์มีโอกาส 85% (มาร์ท/อาม/หนุ่น อย่างละ 5%)</li>
            <li><strong>ครั้งที่ 2+:</strong> เปลี่ยนเป็นสุ่มแบบเท่ากัน → ทุกคนมีโอกาส 25%</li>
            <li><strong>Logic:</strong> สุ่มผู้ชนะก่อนที่วงล้อจะหมุน → แล้วหมุนไปหยุดที่ผู้ชนะ</li>
          </ol>
          <p className="text-purple-200 mt-3 text-sm italic">
            ✨ เหมาะสำหรับ Event: ครั้งแรกให้คนที่เราอยากได้ชนะ (85%) พอครั้งต่อไปเปิดโอกาสทุกคนเท่าๆ กัน!
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeightedWheel;