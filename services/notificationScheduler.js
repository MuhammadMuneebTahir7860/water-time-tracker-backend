const User = require("../models/User");
const fcmService = require("./fcmService");
const cron = require("node-cron");

function getLanguageCode(lang) {
  if (!lang) return "en";
  const l = lang.toLowerCase();
  if (l.includes("türkçe") || l.includes("turkish")) return "tr";
  if (l.includes("español") || l.includes("spanish")) return "es";
  if (l.includes("deutsch") || l.includes("german")) return "de";
  if (l.includes("français") || l.includes("french")) return "fr";
  if (l.includes("हिन्दी") || l.includes("hindi")) return "hi";
  if (l.includes("فارسی") || l.includes("persian") || l.includes("farsi")) return "fa";
  if (l.includes("العربية") || l.includes("arabic")) return "ar";
  return "en";
}

const NOTIFICATIONS = [
  { en: { title: "Good Morning! ✨", body: "Wake up your metabolism with a glass before coffee. Your body is thirsty after 8 hours! 💧" }, tr: { title: "Günaydın! ✨", body: "Kahveden önce bir bardakla metabolizmanı uyandır. Vücudun 8 saatten sonra susadı! 💧" }, es: { title: "¡Buenos días! ✨", body: "Despierta tu metabolismo con un vaso de agua antes del café. ¡Tu cuerpo tiene sed tras 8 horas! 💧" }, de: { title: "Guten Morgen! ✨", body: "Wecke deinen Stoffwechsel mit einem Glas vor dem Kaffee. Dein Körper ist durstig nach 8 Stunden! 💧" }, fr: { title: "Bon matin ! ✨", body: "Réveillez votre métabolisme avec un verre avant le café. Votre corps a soif après 8 heures ! 💧" }, hi: { title: "सुप्रभात! ✨", body: "कॉफी से पहले एक गिलास पानी पीकर अपने मेटाबॉलिज्म को जगाएं। 8 घंटे बाद आपका शरीर प्यासा है! 💧" }, fa: { title: "صبح بخیر! ✨", body: "سوخت‌وساز بدنتان را با یک لیوان آب قبل از قهوه بیدار کنید. بدن شما بعد از ۸ ساعت تشنه است! 💧" }, ar: { title: "صباح الخير! ✨", body: "نشّط عملية التمثيل الغذائي بكوب من الماء قبل القهوة. جسمك عطشان بعد 8 ساعات! 💧" } },
  { en: { title: "Feeling Tired? 😴", body: "Before you grab a snack, try a glass of water. Fatigue is often the first sign of mild dehydration. ⚡" }, tr: { title: "Yorgun mu Hissediyorsun? 😴", body: "Atıştırmadan önce bir bardak su dene. Yorgunluk genelde hafif susuzluğun ilk işaretidir. ⚡" }, es: { title: "¿Te sientes cansado? 😴", body: "Antes de buscar un bocadillo, prueba un vaso de agua. El cansancio suele ser el primer signo de deshidratación leve. ⚡" }, de: { title: "Fühlst du dich müde? 😴", body: "Trinke ein Glas Wasser, bevor du einen Snack nimmst. Müdigkeit ist oft das erste Zeichen von leichtem Flüssigkeitsmangel. ⚡" }, fr: { title: "Vous vous sentez fatigué ? 😴", body: "Avant de grignoter, buvez un verre d'eau. La fatigue est souvent le premier signe d'une légère déshydratation. ⚡" }, hi: { title: "थकान महसूस हो रही है? 😴", body: "कुछ खाने से पहले, एक गिलास पानी पीकर देखें। थकान अक्सर हल्के डिहाइड्रेशन का पहला लक्षण होती है। ⚡" }, fa: { title: "احساس خستگی می‌کنید؟ 😴", body: "قبل از اینکه به سراغ میان‌وعده بروید، یک لیوان آب بنوشید. خستگی اغلب اولین نشانه کم‌آبی خفیف است. ⚡" }, ar: { title: "تشعر بالتعب? 😴", body: "قبل تناول وجبة خفيفة، جرب شرب كوب من الماء. التعب غالباً هو أول علامة على الجفاف الخفيف. ⚡" } },
  { en: { title: "Radiant Skin Inside Out ✨", body: "Hydration is your cheapest beauty routine. Stay on track to keep your skin plump and glowing! 💧👄" }, tr: { title: "İçten Dışa Işıldayan Cilt ✨", body: "Hidrasyon senin en ucuz güzellik rutinin. Cildini nemli ve parlak tutmak için hedefini takibe devam et! 💧👄" }, es: { title: "Piel radiante por dentro y por fuera ✨", body: "La hidratación es tu rutina de belleza más barata. ¡Sigue así para mantener tu piel hidratada y brillante! 💧👄" }, de: { title: "Strahlende Haut von innen heraus ✨", body: "Trinken ist deine günstigste Schönheitsroutine. Bleib dran, um deine Haut prall und strahlend zu halten! 💧👄" }, fr: { title: "Une peau éclatante de l'intérieur ✨", body: "L'hydratation est votre routine beauté la moins chère. Continuez ainsi pour garder une peau repulpée et lumineuse ! 💧👄" }, hi: { title: "दमकती त्वचा अंदर और बाहर से ✨", body: "हाइड्रेशन आपकी सबसे सस्ती सौंदर्य दिनचर्या है। अपनी त्वचा को कोमल और चमकदार बनाए रखने के लिए लक्ष्य पर बने रहें! 💧👄" }, fa: { title: "پوستی شاداب از درون به بیرون ✨", body: "هیدراته ماندن ارزان‌ترین روتین زیبایی شماست. هدف خود را دنبال کنید تا پوستی باطراوت و درخشان داشته باشید! 💧👄" }, ar: { title: "بشرة متألقة من الداخل والخارج ✨", body: "الترطيب هو أرخص روتين جمال لك. استمر في الشرب للحفاظ على بشرتك ممتلئة ومشرقة! 💧👄" } },
  { en: { title: "Brain Fog Alert? 🧠", body: "Your brain is mostly water! Even mild dehydration can hinder concentration. Log your next glass." }, tr: { title: "Beyin Sisi Alarmı mı? 🧠", body: "Beyninin çoğu sudur! Hafif susuzluk bile konsantrasyonu engelleyebilir. Bir sonraki bardağını kaydet." }, es: { title: "¿Niebla mental? 🧠", body: "¡Tu cerebro es principalmente agua! Incluso la deshidratación leve afecta la concentración. Registra tu próximo vaso." }, de: { title: "Gehirnnebel-Alarm? 🧠", body: "Dein Gehirn besteht größtenteils aus Wasser! Schon ein leichter Flüssigkeitsmangel hemmt die Konzentration. Nächstes Glas erfassen!" }, fr: { title: "Brouillard mental ? 🧠", body: "Votre cerveau est composé principalement d'eau ! Une légère déshydratation peut nuire à la concentration. Enregistrez votre prochain verre." }, hi: { title: "मानसिक सुस्ती? 🧠", body: "आपका दिमाग ज्यादातर पानी से बना है! हल्का डिहाइड्रेशन भी एकाग्रता में बाधा डाल सकता है। अपना अगला गिलास दर्ज करें।" }, fa: { title: "احساس سردرگمی ذهنی؟ 🧠", body: "مغز شما عمدتاً از آب تشکیل شده است! حتی کم‌آبی خفیف می‌تواند تمرکز را مختل کند. لیوان بعدی خود را ثبت کنید." }, ar: { title: "ضباب ذهني؟ 🧠", body: "دماغك يتكون في الغالب من الماء! حتى الجفاف الخفيف can ان يعيق التركيز. سجل كوبك التالي الآن." } },
  { en: { title: "Pre-Meal Trick 🍽️", body: "Drink a glass of water 20 mins before lunch. It aids digestion and helps recognize true hunger. 💧" }, tr: { title: "Yemek Öncesi İpucu 🍽️", body: "Öğle yemeğinden 20 dk önce bir bardak su iç. Sindirime yardımcı olur ve gerçek açlığı fark etmeni sağlar. 💧" }, es: { title: "Truco antes de comer 🍽️", body: "Bebe un vaso de agua 20 min antes del almuerzo. Ayuda a la digestión y a reconocer el hambre real. 💧" }, de: { title: "Trick vor dem Essen 🍽️", body: "Trinke ein Glas Wasser 20 Min. vor dem Mittagessen. Es fördert die Verdauung und hilft, echten Hunger zu erkennen. 💧" }, fr: { title: "Astuce avant le repas 🍽️", body: "Buvez un verre d'eau 20 min avant le déjeuner. Cela facilite la digestion et aide à reconnaître la vraie faim. 💧" }, hi: { title: "भोजन से पहले की ट्रिक 🍽️", body: "दोपहर के भोजन से 20 मिनट पहले एक गिलास पानी पिएं। यह पाचन में मदद करता है और वास्तविक भूख की पहचान कराता है। 💧" }, fa: { title: "ترفند قبل از غذا 🍽️", body: "۲۰ دقیقه قبل از ناهار یک لیوان آب بنوشید. این کار به هضم غذا و تشخیص گرسنگی واقعی کمک می‌کند. 💧" }, ar: { title: "حيلة قبل الوجبة 🍽️", body: "اشرب كوبًا من الماء قبل الغداء بـ 20 دقيقة. هذا يساعد في الهضم ويساعد على تمييز الجوع الحقيقي. 💧" } },
  { en: { title: "Workout Warrior? 🏋️‍♂️", body: "Replace what you sweat! Hydrate before, during, and after exercise to prevent cramps. 💧" }, tr: { title: "Antrenman Savaşçısı mısın? 🏋️‍♂️", body: "Terlediğin suyu geri kazan! Krampları önlemek için egzersiz öncesi, sırası ve sonrasında su iç. 💧" }, es: { title: "¿Guerrero del ejercicio? 🏋️‍♂️", body: "¡Recupera lo que sudas! Hidrátate antes, durante y después del ejercicio para evitar calambres. 💧" }, de: { title: "Workout-Krieger? 🏋️‍♂️", body: "Ersetze, was du ausschwitzt! Trinke vor, während und nach dem Sport, um Krämpfen vorzubeugen. 💧" }, fr: { title: "Guerrier de l'entraînement ? 🏋️‍♂️", body: "Remplacez ce que vous transpirez ! Hydratez-vous avant, pendant et après l'exercice pour éviter les crampes. 💧" }, hi: { title: "वर्कआउट वॉरियर? 🏋️‍♂️", body: "पसीने में जो खोया है उसे वापस पाएं! ऐंठन से बचने के लिए व्यायाम से पहले, दौरान और बाद में हाइड्रेट रहें। 💧" }, fa: { title: "ورزشکار حرفه‌ای؟ 🏋️‍♂️", body: "آبی را که با عرق کردن از دست داده‌اید جایگزین کنید! برای جلوگیری از گرفتگی عضلات، قبل، حین و بعد از ورزش آب بنوشید. 💧" }, ar: { title: "محارب التمرين؟ 🏋️‍♂️", body: "عوض ما عرقته! رطب جسمك قبل التمرين وخلاله وبعده لتجنب التشنجات العضلية. 💧" } },
  { en: { title: "The Flush Factor 🔄", body: "Water helps your kidneys flush out waste. Keep your internal system clean with consistent sipping." }, tr: { title: "Arınma Faktörü 🔄", body: "Su, böbreklerinin atıkları atmasına yardımcı olur. Sürekli yudumlayarak iç sistemini temiz tut." }, es: { title: "El factor de limpieza 🔄", body: "El agua ayuda a tus riñones a eliminar toxinas. Mantén limpio tu sistema interno bebiendo de forma constante." }, de: { title: "Der Spüleffekt 🔄", body: "Wasser hilft deinen Nieren, Abfallstoffe auszuspülen. Halte dein inneres System durch regelmäßiges Trinken sauber." }, fr: { title: "Le facteur de purification 🔄", body: "L'eau aide vos reins à éliminer les déchets. Gardez votre système interne propre en buvant régulièrement." }, hi: { title: "सफाई का कारक 🔄", body: "पानी आपके गुर्दों को अपशिष्ट बाहर निकालने में मदद करता है। लगातार घूंट-घूंट पानी पीकर अपनी आंतरिक प्रणाली को साफ रखें।" }, fa: { title: "عامل پاکسازی 🔄", body: "آب به کلیه‌های شما کمک می‌کند تا مواد زائد را دفع کنند. با نوشیدن منظم، سیستم داخلی خود را تمیز نگه دارید." }, ar: { title: "عامل التطهير 🔄", body: "يساعد الماء كليتيك على طرد السموم والفضلات. حافظ على نظافة نظامك الداخلي بارتشاف الماء بانتظام." } },
  { en: { title: "Curb Those Cravings 🍩", body: "Confusing thirst with hunger is common. Craving sweets? Drink water first and wait 15 mins!" }, tr: { title: "Aşırı İstekleri Dizginle 🍩", body: "Susuzluğu açlıkla karıştırmak yaygındır. Canın tatlı mı istiyor? Önce su iç ve 15 dk bekle!" }, es: { title: "Controla esos antojos 🍩", body: "Es común confundir la sed con el hambre. ¿Antojo de dulces? ¡Bebe agua primero y espera 15 min!" }, de: { title: "Heißhunger stoppen 🍩", body: "Durst wird oft mit Hunger verwechselt. Lust auf Süßes? Trinke zuerst Wasser und warte 15 Minuten!" }, fr: { title: "Calmez vos envies 🍩", body: "Il est fréquent de confondre la soif et la faim. Envie de sucre ? Buvez d'abord de l'eau et attendez 15 min !" }, hi: { title: "अवांछित क्रेविंग्स पर रोक 🍩", body: "प्यास को भूख समझना आम है। मीठा खाने का मन है? पहले पानी पिएं और 15 मिनट इंतजार करें!" }, fa: { title: "کنترل هوس‌های غذایی 🍩", body: "اشتباه گرفتن تشنگی با گرسنگی بسیار رایج است. هوس شیرینی کرده‌اید؟ اول آب بنوشید و ۱۵ دقیقه صبر کنید!" }, ar: { title: "كبح الرغبة في الأكل 🍩", body: "من الشائع خلط العطش بالجوع. تشتهي الحلويات؟ اشرب الماء أولاً وانتظر 15 دقيقة!" } },
  { en: { title: "Keep it Moving! 🚶‍♂️", body: "Stay hydrated to keep joints lubricated and digestion smooth. Motion needs fluid! 💧" }, tr: { title: "Harekete Devam Et! 🚶‍♂️", body: "Eklemlerini yağlı ve sindirimini rahat tutmak için susuz kalma. Hareket için sıvı gerekir! 💧" }, es: { title: "¡Mantente en movimiento! 🚶‍♂️", body: "Hidrátate para mantener tus articulaciones lubricadas y la digestión ligera. ¡El movimiento necesita fluidos! 💧" }, de: { title: "In Bewegung bleiben! 🚶‍♂️", body: "Trinke genug, um Gelenke geschmeidig und die Verdauung in Schwung zu halten. Bewegung braucht Flüssigkeit! 💧" }, fr: { title: "Restez en mouvement ! 🚶‍♂️", body: "Restez hydraté pour lubrifier vos articulations et faciliter la digestion. Le mouvement a besoin de liquide ! 💧" }, hi: { title: "गतिमान रहें! 🚶‍♂️", body: "जोड़ों को चिकना और पाचन को सुचारू रखने के लिए हाइड्रेटेड रहें। गतिशीलता के लिए तरल की आवश्यकता होती है! 💧" }, fa: { title: "فعال بمانید! 🚶‍♂️", body: "هیدراته بمانید تا مفصل‌هایتان روان کار کنند و هضم راحت‌تری داشته باشید. تحرک نیاز به مایعات دارد! 💧" }, ar: { title: "حافظ على حركتك! 🚶‍♂️", body: "ترطيب جسمك يحافظ على مرونة المفاصل ويسهل الهضم. الحركة تحتاج إلى سوائل! 💧" } },
  { en: { title: "Habit Master 🎉", body: "You’ve made it 10 days! Consistency is key. Tap to log your first glass and keep your streak alive! 💧🔥" }, tr: { title: "Alışkanlık Ustası 🎉", body: "10 günü devirdin! İstikrar kilit önemde. İlk bardağını kaydetmek için tıkla ve serini devam ettir! 💧🔥" }, es: { title: "Maestro del hábito 🎉", body: "¡Llevas 10 días! La constancia es clave. ¡Toca para registrar tu primer vaso y mantén tu racha activa! 💧🔥" }, de: { title: "Gewohnheits-Meister 🎉", body: "Du hast 10 Tage geschafft! Beständigkeit ist alles. Tippe, um dein erstes Glas zu erfassen und deine Serie zu halten! 💧🔥" }, fr: { title: "Maître de l'habitude 🎉", body: "Vous y êtes depuis 10 jours ! La régularité est la clé. Appuyez pour enregistrer votre premier verre et continuer votre série ! 💧🔥" }, hi: { title: "आदत के पक्के 🎉", body: "आपने 10 दिन पूरे कर लिए हैं! निरंतरता ही सफलता की कुंजी है। अपना पहला गिलास दर्ज करने के लिए टैप करें और अपनी लय बनाए रखें! 💧🔥" }, fa: { title: "استاد عادت‌سازی 🎉", body: "شما ۱۰ روز را با موفقیت پشت سر گذاشتید! تداوم، کلید موفقیت است. برای ثبت اولین لیوان ضربه بزنید و زنجیره خود را حفظ کنید! 💧🔥" }, ar: { title: "سيد العادات 🎉", body: "لقد أكملت 10 أيام! الاستمرارية هي المفتاح. اضغط لتسجيل كوبك الأول وحافظ على سلسلة نجاحك نشطة! 💧🔥" } },
];

function timeToMinutes(timeStr) {
  if (!timeStr) return -1;
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/(\d+):(\d+)\s*(AM|PM)/);
  if (!match) return -1;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3];

  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

const startNotificationScheduler = () => {
  console.log("Starting node-cron for hydration reminders (runs every 1 minute)...");
  
  cron.schedule("* * * * *", async () => {
    try {
      // console.log("Running scheduled notifications...");
      const intendedUtc = new Date();
      
      // Fetch users with fcmToken
      const users = await User.find({ fcmToken: { $ne: "" }, fcmToken: { $exists: true } });
      
      const notificationPromises = [];

      for (const user of users) {
        if (user.globalReminderEnabled === false) continue;
        if (!user.fcmToken) continue;

        const lastSent = user.lastNotificationSentAt ? new Date(user.lastNotificationSentAt) : new Date(0);
        const minutesSinceLast = (intendedUtc.getTime() - lastSent.getTime()) / 60000;
        if (minutesSinceLast < 1) continue; // prevents duplicates

        const offset = user.timezoneOffset || 0;
        const localTime = new Date(intendedUtc.getTime() + offset * 60000);
        const curH = localTime.getUTCHours();
        const curM = localTime.getUTCMinutes();
        const currentTotalMinutes = curH * 60 + curM;
        
        let shouldNotify = false;
        let isTip = false;

        // Check 1 - Daily Tip
        if (curH === 9 && curM === 0) {
          shouldNotify = true;
          isTip = true;
        }

        // Check 2 - Default Reminder
        const validDefaultHours = [8, 10, 12, 14, 16, 18, 20, 22];
        if (!shouldNotify && validDefaultHours.includes(curH) && curM === 0) {
          const hasCustomReminders = user.reminders && user.reminders.some(r => r.isCustom && r.enabled);
          if (!hasCustomReminders) {
            shouldNotify = true;
          }
        }

        // Check 3 - Custom Reminder
        if (!shouldNotify && user.reminders && user.reminders.length > 0) {
          for (const reminder of user.reminders) {
            if (reminder.enabled && reminder.startTime) {
              const reminderMinutes = timeToMinutes(reminder.startTime);
              if (currentTotalMinutes - reminderMinutes === 0) {
                shouldNotify = true;
                break;
              }
            }
          }
        }

        if (shouldNotify) {
          const langCode = getLanguageCode(user.language);
          let title, body, type, drinkText, snoozeText;

          if (isTip) {
            const dayIndex = (intendedUtc.getUTCDate() - 1) % 10;
            const tip = NOTIFICATIONS[dayIndex];
            const localizedTip = tip[langCode] || tip["en"];
            title = localizedTip.title;
            body = localizedTip.body;
            type = "tip";
            drinkText = langCode === "tr" ? "250ml İç" : "Drink 250ml";
            snoozeText = langCode === "tr" ? "10 dk Ertele" : "Snooze 10 min";
          } else {
            const localizedReminders = {
              en: { title: "Time to Drink Water!", body: "Stay hydrated! Your body needs water to function properly.", drink: "Drink 250ml", snooze: "Snooze 10 min" },
              tr: { title: "Su İçme Vakti!", body: "Gün boyunca susuz kalmayın. Vücudunuzun suya ihtiyacı var!", drink: "250ml İç", snooze: "10 dk Ertele" },
              es: { title: "¡Hora de beber agua!", body: "¡Mantente hidratado! Tu cuerpo necesita agua para funcionar correctamente.", drink: "Beber 250ml", snooze: "Aplazar 10 min" },
              de: { title: "Zeit, Wasser zu trinken!", body: "Bleib hydriert! Dein Körper braucht Wasser, um richtig zu funktionieren.", drink: "250ml trinken", snooze: "10 Min. Schlummern" },
              fr: { title: "L'heure de boire de l'eau !", body: "Restez hydraté ! Votre corps a besoin d'eau pour fonctionner correctement.", drink: "Boire 250ml", snooze: "Rappeler dans 10 min" },
              hi: { title: "पानी पीने का समय!", body: "हाइड्रेटेड रहें! आपके शरीर को ठीक से काम करने के लिए पानी की आवश्यकता है।", drink: "250ml पिएं", snooze: "10 मिनट बाद" },
              fa: { title: "وقت نوشیدن آب است!", body: "هیدراته بمانید! بدن شما برای کارکرد درست به آب نیاز دارد.", drink: "نوشیدن ۲۵۰ میلی‌لیتر", snooze: "۱۰ دقیقه به تعویق بینداز" },
              ar: { title: "حان وقت شرب الماء!", body: "حافظ على ترطيب جسمك! يحتاج جسمك إلى الماء ليعمل بشكل صحيح.", drink: "شرب 250 مل", snooze: "تأجيل 10 دقائق" }
            };
            const activeReminder = localizedReminders[langCode] || localizedReminders["en"];
            title = activeReminder.title;
            body = activeReminder.body;
            drinkText = activeReminder.drink;
            snoozeText = activeReminder.snooze;
            type = "reminder_with_actions";
          }

          const messagePayload = {
            notification: { title, body },
            data: {
              type, title, body,
              drink_text: drinkText,
              snooze_text: snoozeText
            },
            android: {
              priority: "high",
              notification: {
                channelId: "water_intake_channel",
                sound: "water"
              }
            }
          };

          notificationPromises.push(
            fcmService.sendPushNotification(user.fcmToken, messagePayload)
              .then(() => {
                return User.findByIdAndUpdate(user._id, { lastNotificationSentAt: new Date() });
              })
              .catch((err) => console.error(`Error sending to user ${user._id}:`, err))
          );
        }
      }

      await Promise.allSettled(notificationPromises);
      // console.log(`Scheduler run complete. Processed users for notifications.`);
    } catch (error) {
      console.error("Error in startNotificationScheduler cron:", error);
    }
  });
};

module.exports = {
  startNotificationScheduler
};
