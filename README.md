# NOP Web Test Client

Webová aplikácia pre generovanie QR kódov na platby a správu transakcií s integráciou MQTT notifikácií z banky.

## Čo táto aplikácia robí?

Táto aplikácia umožňuje:
- Nahrať certifikát obchodníka (P12 súbor)
- Generovať QR kódy pre platby
- Prijímať notifikácie z banky cez MQTT
- Tlačiť potvrdenia o platbách
- Spravovať transakcie a označovať spory

## Čo potrebuješ pred začatím

Pred inštaláciou aplikácie si musíš nainštalovať:

1. **Node.js** (verzia 18 alebo vyššia)
   - Stiahni z: https://nodejs.org/
   - Po inštalácii over verziu príkazom: `node --version`

2. **Git**
   - Stiahni z: https://git-scm.com/
   - Po inštalácii over verziu príkazom: `git --version`

3. **Supabase účet** (databáza)
   - Zaregistruj sa na: https://supabase.com/
   - Je to zadarmo pre malé projekty

4. **Vercel účet** (pre nasadenie)
   - Zaregistruj sa na: https://vercel.com/
   - Môžeš sa prihlásiť cez GitHub účet

## Krok 1: Stiahnutie aplikácie

1. Otvor terminál (Command Prompt na Windows, Terminal na Mac/Linux)

2. Prejdi do priečinka, kde chceš mať aplikáciu:
   \`\`\`bash
   cd Desktop
   \`\`\`

3. Naklonuj repozitár (stiahni kód):
   \`\`\`bash
   git clone https://github.com/tvoj-uzivatel/nop-web-test-client.git
   \`\`\`

4. Prejdi do priečinka aplikácie:
   \`\`\`bash
   cd nop-web-test-client
   \`\`\`

5. Nainštaluj potrebné balíčky:
   \`\`\`bash
   npm install
   \`\`\`

## Krok 2: Nastavenie databázy (Supabase)

1. Prihlás sa na https://supabase.com/

2. Vytvor nový projekt:
   - Klikni na "New Project"
   - Zadaj názov projektu (napr. "nop-client")
   - Vytvor silné heslo (ulož si ho!)
   - Vyber región (Europe West je dobrá voľba)
   - Klikni "Create new project"

3. Počkaj 2-3 minúty, kým sa projekt vytvorí

4. Spusti SQL skripty na vytvorenie tabuliek:
   - V Supabase dashboarde klikni na "SQL Editor" v ľavom menu
   - Klikni na "New query"
   - Otvor súbor `scripts/001_create_mqtt_notifications_table.sql` vo svojom editore
   - Skopíruj celý obsah a vlož ho do SQL editora
   - Klikni "Run" (alebo stlač F5)
   - Opakuj to isté pre `scripts/002_create_transaction_generations_table.sql`

5. Over, že sa tabuľky vytvorili:
   - Klikni na "Table Editor" v ľavom menu
   - Mali by si vidieť tabuľky: `mqtt_notifications` a `transaction_generations`

## Krok 3: Nastavenie premenných prostredia

1. V Supabase dashboarde klikni na "Settings" (ikona ozubeného kolieska)

2. Klikni na "API" v ľavom menu

3. Nájdi a skopíruj tieto hodnoty:
   - **Project URL** (napr. `https://xxxxx.supabase.co`)
   - **anon public** kľúč (dlhý reťazec znakov)
   - **service_role** kľúč (ešte dlhší reťazec)

4. Vytvor súbor `.env.local` v hlavnom priečinku projektu:
   \`\`\`bash
   touch .env.local
   \`\`\`

5. Otvor `.env.local` v textovom editore a pridaj:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=tvoja-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tvoj-service-role-key
   \`\`\`

6. Nahraď hodnoty tými, ktoré si skopíroval z Supabase

## Krok 4: Spustenie aplikácie lokálne

1. V terminále (v priečinku projektu) spusti:
   \`\`\`bash
   npm run dev
   \`\`\`

2. Počkaj, kým sa aplikácia spustí (zobrazí sa "Ready in X seconds")

3. Otvor prehliadač a choď na:
   \`\`\`
   http://localhost:3000
   \`\`\`

4. Mala by sa ti zobraziť prihlasovacia stránka aplikácie!

## Krok 5: Nasadenie na Vercel (produkcia)

1. Prihlás sa na https://vercel.com/

2. Klikni na "Add New..." → "Project"

3. Importuj svoj Git repozitár:
   - Ak máš kód na GitHube, vyber ho zo zoznamu
   - Ak nie, najprv nahraj kód na GitHub

4. Nastav premenné prostredia:
   - V sekcii "Environment Variables" pridaj tie isté premenné ako v `.env.local`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

5. Klikni "Deploy"

6. Počkaj 2-3 minúty, kým sa aplikácia nasadí

7. Po dokončení dostaneš URL adresu (napr. `https://tvoj-projekt.vercel.app`)

8. Otvor túto URL v prehliadači - aplikácia je teraz online!



**Vibecoded in Vercel V0** | [GitHub](https://github.com/tvoj-uzivatel/nop-web-test-client)
