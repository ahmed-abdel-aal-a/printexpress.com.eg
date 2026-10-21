import React from 'react';

export default function FontPreview() {
  const combos = [
    // Previous 12
    { en: '"Bebas Neue"', ar: '"Lalezar"', name: 'Bebas Neue + Lalezar', desc: 'طويل جداً وملفت، يصرخ بالقوة.' },
    { en: '"Oswald"', ar: '"Changa"', name: 'Oswald + Changa', desc: 'هندسي، مربع، ومثالي للأكشن الحديث.' },
    { en: '"Righteous"', ar: '"Almarai"', name: 'Righteous + Almarai', desc: 'انسيابي ومستقبلي (Sci-Fi).' },
    { en: '"Racing Sans One"', ar: '"Lalezar"', name: 'Racing Sans + Lalezar', desc: 'سرعة، سباقات، وحركة مائلة.' },
    { en: '"Teko"', ar: '"Changa"', name: 'Teko + Changa', desc: 'تكنولوجي، زوايا حادة وجريئة.' },
    { en: '"Anton"', ar: '"Lalezar"', name: 'Anton + Lalezar', desc: 'عريض جداً وأيقوني (Bold Impact).' },
    { en: '"Black Ops One"', ar: '"Changa"', name: 'Black Ops One + Changa', desc: 'استنسل عسكري حاد.' },
    { en: '"Russo One"', ar: '"Readex Pro"', name: 'Russo One + Readex', desc: 'فضاء، تقنية عريضة وقوية.' },
    { en: '"Squada One"', ar: '"Changa"', name: 'Squada One + Changa', desc: 'رياضي وهندسي مستقيم.' },
    { en: '"Bungee"', ar: '"Lalezar"', name: 'Bungee + Lalezar', desc: 'حضري (Urban) وسميك للشارع.' },
    { en: '"Audiowide"', ar: '"Readex Pro"', name: 'Audiowide + Readex', desc: 'إلكتروني وتقني حديث.' },
    { en: '"Fugaz One"', ar: '"Tajawal"', name: 'Fugaz One + Tajawal', desc: 'مائل بشدة، أكشن حركي.' },
    
    // New 10 (Crazy & Eye-catching)
    { en: '"Permanent Marker"', ar: '"Marhey"', name: 'Marker + Marhey', desc: 'تخطيط يدوي عنيف، متمرد وصارخ.' },
    { en: '"Bangers"', ar: '"Rakkas"', name: 'Bangers + Rakkas', desc: 'أسلوب الكوميكس والأبطال الخارقين، بوم!' },
    { en: '"Rubik Mono One"', ar: '"Lalezar"', name: 'Rubik Mono + Lalezar', desc: 'ضخم جداً وكأنه كتلة إسمنتية ثقيلة.' },
    { en: '"Monoton"', ar: '"Reem Kufi"', name: 'Monoton + Reem Kufi', desc: 'كلاسيكي بخطوط نيون (Retro) يخطف العين فوراً.' },
    { en: '"Press Start 2P"', ar: '"Changa"', name: '8-Bit + Changa', desc: 'ستايل ألعاب الأتاري القديمة (Arcade).' },
    { en: '"Sigmar One"', ar: '"Baloo Bhaijaan 2"', name: 'Sigmar + Baloo', desc: 'مرح، ممتلئ، ويلفت الانتباه بقوة طاغية.' },
    { en: '"Rampart One"', ar: '"Lalezar"', name: 'Rampart + Lalezar', desc: 'ثلاثي الأبعاد (3D) ومجسم بظل قوي.' },
    { en: '"Wallpoet"', ar: '"Changa"', name: 'Wallpoet + Changa', desc: 'فن الشارع (جرافيتي) حاد وعدواني.' },
    { en: '"Michroma"', ar: '"Tajawal"', name: 'Michroma + Tajawal', desc: 'تقني عريض بشكل غير مألوف (Tech Wide).' },
    { en: '"Luckiest Guy"', ar: '"Lemonada"', name: 'Luckiest + Lemonada', desc: 'كارتوني ضخم وجذاب جداً ومرح.' },
  ];

  const fontFamiliesUrl = "https://fonts.googleapis.com/css2?family=Almarai:wght@800&family=Anton&family=Audiowide&family=Baloo+Bhaijaan+2:wght@800&family=Bangers&family=Bebas+Neue&family=Black+Ops+One&family=Bungee&family=Changa:wght@700&family=Fugaz+One&family=Lalezar&family=Lemonada:wght@700&family=Luckiest+Guy&family=Marhey:wght@700&family=Michroma&family=Monoton&family=Oswald:wght@700&family=Permanent+Marker&family=Press+Start+2P&family=Racing+Sans+One&family=Rakkas&family=Rampart+One&family=Readex+Pro:wght@700&family=Reem+Kufi:wght@700&family=Righteous&family=Rubik+Mono+One&family=Russo+One&family=Sigmar+One&family=Squada+One&family=Tajawal:wght@700&family=Teko:wght@700&family=Wallpoet&display=swap";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-10 flex flex-col items-center gap-10" dir="rtl">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={fontFamiliesUrl} rel="stylesheet" />
      
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3 text-[#F9D423] font-sans">معرض خطوط الأكشن الشامل</h1>
        <p className="text-gray-400">مزيج من أقوى الخطوط الإنجليزية والعربية معاً</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl">
        {combos.map((f, i) => (
          <div key={i} className="bg-[#111] p-8 rounded-2xl border border-neutral-800 flex flex-col items-center justify-between hover:border-[#F9D423] transition-colors">
            <div className="text-center mb-8">
              <h2 className="text-2xl text-white mb-2 font-sans font-bold">{i + 1}. {f.name}</h2>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
            
            {/* Logo Preview Wrapper */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 bg-black rounded-xl border border-neutral-900 w-full">
              
              {/* English Logo */}
              <div className="flex flex-col shrink-0 items-start" dir="ltr">
                <div className="flex items-baseline drop-shadow-sm text-[#F9D423] pr-2 italic" style={{ fontFamily: `${f.en}, sans-serif` }}>
                  <span className="text-6xl font-normal">P</span>
                  <span className="text-5xl font-normal">rint</span>
                </div>
                <span className="ml-8 text-xs tracking-[0.4em] text-[#7D7D7D] uppercase mt-1 italic" style={{ fontFamily: `${f.en}, sans-serif` }}>
                  Express
                </span>
              </div>

              {/* Divider */}
              <div className="h-px w-full md:w-px md:h-16 bg-neutral-800"></div>

              {/* Arabic Logo */}
              <div className="flex flex-col shrink-0 items-start" dir="rtl">
                <div className="flex items-baseline drop-shadow-sm text-[#F9D423] pl-2 italic" style={{ fontFamily: `${f.ar}, sans-serif` }}>
                  <span className="text-5xl font-normal">برينت</span>
                </div>
                <span className="mr-6 text-sm tracking-[0.2em] text-[#7D7D7D] mt-1 italic" style={{ fontFamily: `${f.ar}, sans-serif` }}>
                  إكسبريس
                </span>
                <span className="mr-6 text-xs text-white mt-3 italic" style={{ fontFamily: `${f.ar}, sans-serif` }}>
                  ( نطبع المستحيل )
                </span>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
