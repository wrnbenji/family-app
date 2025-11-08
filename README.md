
# Family React Starter (Expo + RN Web + Supabase + i18n)

**Egy projekt – iOS/Android/Web (PWA)** React-tel (Expo + React Native Web), **offline-first bevásárlólista**, **hu/de/en i18n** és **Supabase** backend.
Az MVP képernyők: Teendők, Bevásárlólista (kész), Naptár.

## 0) Előfeltételek
- Node.js 18+
- Git
- (Ajánlott) Yarn vagy PNPM
- iOS/Android buildhez Xcode / Android Studio (később is jó)

## 1) Supabase beállítás
1. Hozz létre projektet a Supabase-ben.
2. A Dashboard **SQL editorában** futtasd a `supabase/schema.sql` és **utána** a `supabase/policies.sql` tartalmát.
3. Settings → API: másold ki az **URL**-t és az **anon public key**-t.
4. Auth → Email logint kapcsold be (MVP-hez elég), SMTP-t beállíthatsz később.

## 2) Környezeti változók
Másold a `.env.example`-t `.env`-re és töltsd ki:
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON=...
```

## 3) Telepítés és futtatás
```bash
# telepítés (expo a kompatibilis verziókat automatikusan javasolja)
npm install
# vagy: yarn / pnpm i

# indítás
npx expo start
# iOS:   i
# And.:  a
# Web:   w
```

## 4) Struktúra
```
app/              ← Expo Router képernyők
lib/              ← kliens logika (i18n, Supabase, offline store)
locales/          ← fordítások (hu/de/en)
supabase/         ← SQL sémák + policy-k
```

## 5) Offline-first bevásárlólista
- A lista lokálisan él (AsyncStorage/IndexedDB), **optimista** frissítéssel.
- Hálózatnál szinkron Supabase `shopping_items` táblára, Realtime visszafrissít.

## 6) Többnyelvűség
- `i18next` + `react-i18next` + böngésző nyelvfelismerés (web), mobilon `expo-localization`.

## 7) GitHub repo(k)
### Egy repo (ajánlott, egyszerű)
```bash
git init
git add .
git commit -m "init: family-react-starter"
# GitHub-on létrehozol egy üres repót: family-react-starter
git remote add origin https://github.com/<felhasznalo>/family-react-starter.git
git branch -M main
git push -u origin main
```

### Két repo (app + infra külön)
- **family-app**: ez a projekt (alkalmazás)
- **family-infra**: a `supabase/` mappa tartalma (schema/policy)
```bash
# infra külön mappába (választható)
mkdir ../family-infra && cp -r supabase ../family-infra/
cd ../family-infra && git init && git add . && git commit -m "infra: supabase schema"
git remote add origin https://github.com/<felhasznalo>/family-infra.git
git branch -M main && git push -u origin main
```

## 8) Következő lépések
- Auth UI csiszolása (regisztráció / jelszó reset).
- Háztartás-létrehozás és meghívó kód/link képernyő.
- Teendők + Naptár képernyők kitöltése.
- Mobil push értesítés (expo-notifications), weben később Web Push.
- EAS build a store-okhoz.
