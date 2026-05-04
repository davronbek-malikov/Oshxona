export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-[640px] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <span className="text-3xl">⚙️</span>
          </div>
          <h1 className="text-2xl font-bold">Sozlash kerak</h1>
          <p className="text-muted-foreground mt-1">
            Ilovani ishlatishdan oldin quyidagilarni bajaring.
          </p>
          <p className="text-sm text-muted-foreground">
            Setup required before using the app.
          </p>
        </div>

        {/* Step 1: Supabase */}
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
              1
            </span>
            <h2 className="font-bold text-lg">Supabase loyihasini yarating</h2>
          </div>

          <ol className="space-y-3 text-sm pl-11">
            <li className="flex gap-2">
              <span className="font-bold text-primary flex-shrink-0">a.</span>
              <span>
                <strong>supabase.com</strong> saytiga kiring → "New project"
                tugmasini bosing
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary flex-shrink-0">b.</span>
              <span>
                Loyiha yaratilgandan so'ng:{" "}
                <strong>Settings → API</strong> ga o'ting
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary flex-shrink-0">c.</span>
              <span>
                Quyidagi qiymatlarni nusxalab{" "}
                <code className="bg-gray-100 px-1 rounded">.env.local</code>{" "}
                fayliga joylashtiring:
              </span>
            </li>
          </ol>

          <div className="bg-gray-900 rounded-xl p-4 text-sm font-mono space-y-1 text-green-400 pl-11">
            <p>
              <span className="text-gray-400"># Project URL:</span>
            </p>
            <p>
              NEXT_PUBLIC_SUPABASE_URL=
              <span className="text-yellow-300">https://xxxx.supabase.co</span>
            </p>
            <p className="mt-2">
              <span className="text-gray-400"># anon / public key:</span>
            </p>
            <p>
              NEXT_PUBLIC_SUPABASE_ANON_KEY=
              <span className="text-yellow-300">eyJhbGci...</span>
            </p>
            <p className="mt-2">
              <span className="text-gray-400"># service_role key (secret!):</span>
            </p>
            <p>
              SUPABASE_SERVICE_ROLE_KEY=
              <span className="text-yellow-300">eyJhbGci...</span>
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 pl-11">
            ⚠️ <strong>SQL migratsiyalarini ham ishga tushiring:</strong> Supabase
            Dashboard → SQL Editor da{" "}
            <code>supabase/migrations/0001_init.sql</code> va{" "}
            <code>0002_otps.sql</code> fayllarini nusxalab ishga tushiring.
            So'ngra <code>supabase/seed.sql</code> ni ham ishga tushiring.
          </div>
        </div>

        {/* Step 2: Telegram Bot */}
        <div className="bg-white rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
              2
            </span>
            <h2 className="font-bold text-lg">Telegram bot yarating</h2>
          </div>

          <ol className="space-y-3 text-sm pl-11">
            <li className="flex gap-2">
              <span className="font-bold text-primary flex-shrink-0">a.</span>
              <span>
                Telegram-da <strong>@BotFather</strong> ni oching →{" "}
                <code className="bg-gray-100 px-1 rounded">/newbot</code> yuboring
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary flex-shrink-0">b.</span>
              <span>
                Bot nomi va username bering (masalan:{" "}
                <code className="bg-gray-100 px-1 rounded">OshxonaBot</code>)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary flex-shrink-0">c.</span>
              <span>
                BotFather bergan tokenni{" "}
                <code className="bg-gray-100 px-1 rounded">.env.local</code> ga
                joylashtiring:
              </span>
            </li>
          </ol>

          <div className="bg-gray-900 rounded-xl p-4 text-sm font-mono space-y-1 text-green-400 pl-11">
            <p>
              TELEGRAM_BOT_TOKEN=
              <span className="text-yellow-300">1234567890:AAF...</span>
            </p>
            <p>
              TELEGRAM_BOT_USERNAME=
              <span className="text-yellow-300">OshxonaBot</span>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 pl-11">
            ℹ️ Webhook ni sozlash uchun (lokal testda ngrok kerak):{" "}
            <code className="bg-blue-100 px-1 rounded break-all">
              https://api.telegram.org/bot&lt;TOKEN&gt;/setWebhook?url=http://localhost:3000/api/telegram/webhook
            </code>
          </div>
        </div>

        {/* Step 3: Restart */}
        <div className="bg-white rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
              3
            </span>
            <h2 className="font-bold text-lg">
              Dev serverni qayta ishga tushiring
            </h2>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-sm font-mono text-green-400 pl-11">
            <p>
              <span className="text-gray-400"># .env.local ni to'ldirgandan so'ng:</span>
            </p>
            <p className="mt-1">npm run dev</p>
          </div>
          <p className="text-sm text-muted-foreground pl-11">
            Muhit o'zgaruvchilari o'zgartirilganda server qayta ishga tushirilishi
            shart — hot reload ularni qabul qilmaydi.
          </p>
        </div>

        {/* .env.local location */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-sm">
          <p className="font-bold mb-1">📁 .env.local fayli joylashuvi:</p>
          <code className="text-xs bg-white border border-border rounded px-2 py-1 block break-all">
            c:\Users\davro\OneDrive\Desktop\OSHXONA\.env.local
          </code>
          <p className="text-muted-foreground text-xs mt-2">
            Bu fayl allaqachon yaratilgan — ichidagi bo'sh qiymatlarni to'ldiring.
          </p>
        </div>
      </div>
    </div>
  );
}
